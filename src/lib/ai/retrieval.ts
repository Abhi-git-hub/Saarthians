import { createClient } from "@/lib/supabase/server";
import { embedTexts } from "./gemini";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

// Authorized semantic retrieval over study-material chunks.
//
// Security: this module never filters in JavaScript. The query embedding is
// passed to the `match_material_chunks` RPC, which enforces authorization
// inside SQL (owner teacher / actively-assigned student / admin) and only
// ranks chunks of READY materials the caller may see.

export interface MaterialEvidence {
  chunkId: string;
  materialId: string;
  title: string;
  page: number;
  text: string;
  distance: number;
}

export interface RetrievalOptions {
  query: string;
  /** "Ask tutor about this PDF": restrict ranking to one material. */
  materialId?: string | null;
  limit?: number;
  threshold?: number;
}

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 8;
const DEFAULT_THRESHOLD = 0.45;
const MAX_EVIDENCE_CHARS = 6000;

export async function retrieveMaterialEvidence(
  supabase: ServerClient,
  options: RetrievalOptions,
): Promise<MaterialEvidence[]> {
  const query = options.query.trim();
  if (!query) return [];
  const limit = Math.min(Math.max(options.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;

  const [embedding] = await embedTexts([query], "RETRIEVAL_QUERY");
  const vectorLiteral = `[${embedding.join(",")}]`;
  const { data, error } = await supabase.rpc("match_material_chunks", {
    p_query: vectorLiteral,
    p_material_id: options.materialId ?? null,
    p_limit: limit,
    p_threshold: threshold,
  });
  if (error) throw new Error(`RETRIEVAL_FAILED: ${error.message}`);
  if (!Array.isArray(data)) return [];

  const evidence: MaterialEvidence[] = [];
  let budget = MAX_EVIDENCE_CHARS;
  for (const row of data) {
    const record = row as Record<string, unknown>;
    if (typeof record.chunk_id !== "string" || typeof record.chunk_text !== "string") continue;
    const text = record.chunk_text.slice(0, Math.max(budget, 0));
    if (!text) break;
    budget -= text.length;
    evidence.push({
      chunkId: record.chunk_id,
      materialId: typeof record.material_id === "string" ? record.material_id : "",
      title: typeof record.material_title === "string" ? record.material_title : "Study material",
      page: typeof record.page_number === "number" ? record.page_number : 1,
      text,
      distance: typeof record.distance === "number" ? record.distance : 1,
    });
  }
  return evidence;
}

/** Render evidence as a compact, cited block for the model prompt. */
export function formatEvidenceForPrompt(evidence: MaterialEvidence[]): string {
  return evidence
    .map((chunk, i) => `[${i + 1}] "${chunk.title}" (page ${chunk.page}):\n${chunk.text}`)
    .join("\n\n");
}
