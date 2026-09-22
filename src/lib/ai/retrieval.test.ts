import { describe, expect, it, vi } from "vitest";
import { formatEvidenceForPrompt, retrieveMaterialEvidence } from "./retrieval";

function mockSupabase(rows: unknown[] | null, error: { message: string } | null = null) {
  return {
    rpc: vi.fn().mockResolvedValue({ data: rows, error }),
  };
}

describe("retrieveMaterialEvidence", () => {
  it("queries the lexical RPC and maps rows to evidence", async () => {
    const supabase = mockSupabase([
      {
        chunk_id: "c1",
        material_id: "m1",
        material_title: "Physics Ch 3",
        page_number: 4,
        chunk_text: "Newton's laws...",
        similarity: 0.5,
      },
      {
        chunk_id: "c2",
        material_id: "m1",
        material_title: "Physics Ch 3",
        page_number: 5,
        chunk_text: "unrelated filler",
        similarity: 0.01,
      },
    ]);
    const evidence = await retrieveMaterialEvidence(supabase as never, { query: "newton laws" });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "match_material_chunks_lexical",
      expect.objectContaining({ p_query: "newton laws", p_limit: 5, p_material_id: null }),
    );
    expect(evidence).toEqual([
      {
        chunkId: "c1",
        materialId: "m1",
        title: "Physics Ch 3",
        page: 4,
        text: "Newton's laws...",
        distance: 0.5,
      },
    ]);
  });

  it("scopes retrieval to one material and clamps limits", async () => {
    const supabase = mockSupabase([]);
    await retrieveMaterialEvidence(supabase as never, { query: "qq", materialId: "m9", limit: 99 });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "match_material_chunks_lexical",
      expect.objectContaining({ p_material_id: "m9", p_limit: 8 }),
    );
  });

  it("returns empty for blank queries and surfaces RPC failures", async () => {
    const supabase = mockSupabase(null, { message: "denied" });
    expect(await retrieveMaterialEvidence(supabase as never, { query: "   " })).toEqual([]);
    expect(await retrieveMaterialEvidence(supabase as never, { query: "x" })).toEqual([]);
    await expect(retrieveMaterialEvidence(supabase as never, { query: "qq" })).rejects.toThrow("RETRIEVAL_FAILED");
  });
});

describe("formatEvidenceForPrompt", () => {
  it("renders cited blocks", () => {
    const text = formatEvidenceForPrompt([
      { chunkId: "c", materialId: "m", title: "T", page: 2, text: "body", distance: 0.1 },
    ]);
    expect(text).toContain('"T" (page 2)');
    expect(text).toContain("body");
  });
});
