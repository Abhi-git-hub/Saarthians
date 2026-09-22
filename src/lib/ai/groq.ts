// Server-only Groq client (OpenAI-compatible REST, plain fetch, no SDK).
//
// The key travels in the Authorization Bearer header (never in the URL,
// never to the browser) and is read only here. gpt-oss models do not honor
// response_format=json_object, so the JSON contract is instructed in the
// prompt and validated server-side; fences are stripped before parsing and
// malformed output is never persisted as a tutor answer.
//
// Env (all server-only):
// - GROQ_API_KEY (required)
// - GROQ_BASE_URL, else OPENAI_BASE_URL, else https://api.groq.com/openai/v1
// - GROQ_CHAT_MODEL, else OPENAI_MODEL, else openai/gpt-oss-20b
//
// NOTE: this Groq account exposes chat models only (/embeddings answers
// model_not_found). Semantic embeddings are therefore unavailable; retrieval
// uses the authorized pg_trgm lexical RPC (see retrieval.ts) and the
// pgvector tables stay dormant until an embedding provider is configured.

export const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";
export const DEFAULT_GROQ_CHAT_MODEL = "openai/gpt-oss-20b";

const REQUEST_TIMEOUT_MS = 30000;

export type GroqFailure =
  | "GROQ_NOT_CONFIGURED"
  | "GROQ_RATE_LIMITED"
  | "GROQ_REJECTED"
  | "GROQ_UNREACHABLE"
  | "GROQ_MALFORMED_RESPONSE";

export function groqBaseUrl(): string {
  return process.env.GROQ_BASE_URL?.trim() || process.env.OPENAI_BASE_URL?.trim() || DEFAULT_GROQ_BASE_URL;
}

export function groqChatModel(): string {
  return process.env.GROQ_CHAT_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || DEFAULT_GROQ_CHAT_MODEL;
}

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

function groqKey(): string {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) throw new Error("GROQ_NOT_CONFIGURED" satisfies GroqFailure);
  return key;
}

const CONTRACT_INSTRUCTION = `Reply with a single JSON object and nothing else (no code fences, no prose outside the JSON) with exactly these keys:
{"answer": string, "grounded": boolean, "sources": [{"title": string, "page": number|null}], "followups": string[]}`;

export interface GroqSource {
  title: string;
  page: number | null;
}

export interface GroqTutorResult {
  answer: string;
  grounded: boolean;
  sources: GroqSource[];
  followups: string[];
}

/**
 * Generate a grounded tutor answer. The prompt (system + evidence + question)
 * is assembled by the caller; this function transports it and validates the
 * structured contract. Throws GroqFailure on any problem.
 */
export async function generateGroundedTutor(input: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}): Promise<GroqTutorResult> {
  const key = groqKey();
  let response: Response;
  try {
    response = await fetch(`${groqBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: groqChatModel(),
        messages: [
          { role: "system", content: `${input.systemPrompt}\n\n${CONTRACT_INSTRUCTION}` },
          { role: "user", content: input.userPrompt },
        ],
        temperature: 0.4,
        max_tokens: input.maxTokens ?? 1200,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") throw new Error("GROQ_UNREACHABLE");
    throw new Error("GROQ_UNREACHABLE");
  }
  if (response.status === 429) throw new Error("GROQ_RATE_LIMITED" satisfies GroqFailure);
  if (!response.ok) throw new Error("GROQ_REJECTED" satisfies GroqFailure);
  const json = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const raw = json.choices?.[0]?.message?.content ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFences(raw));
  } catch {
    throw new Error("GROQ_MALFORMED_RESPONSE" satisfies GroqFailure);
  }
  return validateTutorResult(parsed);
}

export function stripFences(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return match ? match[1] : trimmed;
}

export function validateTutorResult(parsed: unknown): GroqTutorResult {
  if (typeof parsed !== "object" || parsed === null) throw new Error("GROQ_MALFORMED_RESPONSE");
  const record = parsed as Record<string, unknown>;
  if (typeof record.answer !== "string" || record.answer.trim().length === 0) {
    throw new Error("GROQ_MALFORMED_RESPONSE");
  }
  if (typeof record.grounded !== "boolean") throw new Error("GROQ_MALFORMED_RESPONSE");
  if (!Array.isArray(record.sources)) throw new Error("GROQ_MALFORMED_RESPONSE");
  if (!Array.isArray(record.followups)) throw new Error("GROQ_MALFORMED_RESPONSE");
  const sources: GroqSource[] = record.sources.slice(0, 8).map((s) => {
    const r = (typeof s === "object" && s !== null ? s : {}) as Record<string, unknown>;
    return {
      title: typeof r.title === "string" ? r.title.slice(0, 200) : "Study material",
      page: typeof r.page === "number" && Number.isFinite(r.page) ? Math.round(r.page) : null,
    };
  });
  const followups = record.followups
    .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
    .slice(0, 4)
    .map((f) => f.slice(0, 200));
  return { answer: record.answer.slice(0, 4000), grounded: record.grounded, sources, followups };
}
