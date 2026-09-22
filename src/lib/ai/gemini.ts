// Server-only Gemini client (plain fetch, no SDK).
//
// Deliberately dependency-free: the Cloudflare Workers / OpenNext runtime
// always has fetch, and a raw REST adapter avoids pulling a Node-oriented SDK
// into the Edge bundle. The API key travels in the `x-goog-api-key` header
// (never in the URL, never to the browser) and is read only here.
//
// Models:
// - Chat/reasoning: GEMINI_MODEL, default `gemini-2.5-flash` — verified live
//   2026-09-23 via models.list + generateContent; low-latency, inexpensive,
//   supports JSON-mode structured output.
// - Embeddings: `gemini-embedding-001` with outputDimensionality 768 —
//   `text-embedding-004` no longer exists on this API (absent from
//   models.list 2026-09-23). Matryoshka truncation to 768 dims is pinned
//   because the pgvector index stores vector(768); mixing models or
//   dimensions would corrupt recall.

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
export const GEMINI_EMBEDDING_DIMS = 768;

const REQUEST_TIMEOUT_MS = 25000;
const MAX_EMBED_CHARS = 8000;

export type GeminiFailure =
  | "GEMINI_NOT_CONFIGURED"
  | "GEMINI_RATE_LIMITED"
  | "GEMINI_REJECTED"
  | "GEMINI_UNREACHABLE"
  | "GEMINI_MALFORMED_RESPONSE";

export function geminiChatModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function geminiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_NOT_CONFIGURED" satisfies GeminiFailure);
  return key;
}

async function geminiFetch(path: string, body: unknown): Promise<Response> {
  const key = geminiKey();
  let response: Response;
  try {
    response = await fetch(`${GEMINI_API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") throw new Error("GEMINI_UNREACHABLE");
    throw new Error("GEMINI_UNREACHABLE");
  }
  return response;
}

export type GeminiEmbedTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" | "SEMANTIC_SIMILARITY";

/** Embed up to 100 texts with the pinned embedding model at 768 dims. */
export async function embedTexts(texts: string[], taskType: GeminiEmbedTask = "SEMANTIC_SIMILARITY"): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length > 100) throw new Error("GEMINI_REJECTED");
  const response = await geminiFetch(`models/${GEMINI_EMBEDDING_MODEL}:batchEmbedContents`, {
    requests: texts.map((text) => ({
      model: `models/${GEMINI_EMBEDDING_MODEL}`,
      content: { parts: [{ text: text.slice(0, MAX_EMBED_CHARS) }] },
      taskType,
      outputDimensionality: GEMINI_EMBEDDING_DIMS,
    })),
  });
  if (response.status === 429) throw new Error("GEMINI_RATE_LIMITED" satisfies GeminiFailure);
  if (!response.ok) throw new Error("GEMINI_REJECTED" satisfies GeminiFailure);
  const json = (await response.json()) as {
    embeddings?: { values?: number[] }[];
  };
  if (!json.embeddings || json.embeddings.length !== texts.length) {
    throw new Error("GEMINI_MALFORMED_RESPONSE" satisfies GeminiFailure);
  }
  return json.embeddings.map((embedding, i) => {
    const values = embedding?.values;
    if (!values || values.length !== GEMINI_EMBEDDING_DIMS) {
      throw new Error(`GEMINI_MALFORMED_RESPONSE: embedding ${i} has wrong dimensions` as never);
    }
    return values;
  });
}

export interface GeminiSource {
  title: string;
  page: number | null;
}

export interface GeminiTutorResult {
  answer: string;
  grounded: boolean;
  sources: GeminiSource[];
  followups: string[];
}

const TUTOR_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    answer: { type: "STRING" },
    grounded: { type: "BOOLEAN" },
    sources: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { title: { type: "STRING" }, page: { type: "INTEGER" } },
        required: ["title"],
      },
    },
    followups: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["answer", "grounded", "sources", "followups"],
};

/**
 * Generate a grounded tutor answer. The prompt (system + evidence + question)
 * is assembled by the caller; this function only transports it and validates
 * the structured contract. Returns the parsed result or throws GeminiFailure.
 */
export async function generateGroundedTutor(input: {
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens?: number;
}): Promise<GeminiTutorResult> {
  const response = await geminiFetch(`models/${geminiChatModel()}:generateContent`, {
    system_instruction: { parts: [{ text: input.systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: input.userPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: TUTOR_RESPONSE_SCHEMA,
      maxOutputTokens: input.maxOutputTokens ?? 1200,
      temperature: 0.4,
    },
  });
  if (response.status === 429) throw new Error("GEMINI_RATE_LIMITED" satisfies GeminiFailure);
  if (!response.ok) throw new Error("GEMINI_REJECTED" satisfies GeminiFailure);
  const json = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("GEMINI_MALFORMED_RESPONSE" satisfies GeminiFailure);
  }
  return validateTutorResult(parsed);
}

export function validateTutorResult(parsed: unknown): GeminiTutorResult {
  if (typeof parsed !== "object" || parsed === null) throw new Error("GEMINI_MALFORMED_RESPONSE");
  const record = parsed as Record<string, unknown>;
  if (typeof record.answer !== "string" || record.answer.trim().length === 0) {
    throw new Error("GEMINI_MALFORMED_RESPONSE");
  }
  if (typeof record.grounded !== "boolean") throw new Error("GEMINI_MALFORMED_RESPONSE");
  if (!Array.isArray(record.sources)) throw new Error("GEMINI_MALFORMED_RESPONSE");
  if (!Array.isArray(record.followups)) throw new Error("GEMINI_MALFORMED_RESPONSE");
  const sources: GeminiSource[] = record.sources.slice(0, 8).map((s) => {
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
