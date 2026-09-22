import { describe, expect, it, vi } from "vitest";
import { processMaterialUpload, retryMaterialProcessing } from "./service";
import { embedTexts } from "@/lib/ai/gemini";
import { extractPdfPages, optimizePdf, validatePdfUpload } from "./pdf";

vi.mock("./pdf", () => ({
  validatePdfUpload: vi.fn(),
  optimizePdf: vi.fn(),
  extractPdfPages: vi.fn(),
  chunkExtractedPages: vi.fn(),
}));

vi.mock("@/lib/ai/gemini", () => ({
  embedTexts: vi.fn(),
}));

import { chunkExtractedPages } from "./pdf";

type UpdateCall = { table: string; patch: Record<string, unknown> };

function mockDb() {
  const updates: UpdateCall[] = [];
  const inserts: { table: string; rows: unknown[] }[] = [];
  const storage = {
    uploaded: [] as { path: string; bytes: Uint8Array }[],
    removed: [] as string[][],
  };
  const supabase = {
    from: (table: string) => ({
      update: (patch: Record<string, unknown>) => ({
        eq: () => {
          updates.push({ table, patch });
          return Promise.resolve({ error: null });
        },
      }),
      insert: (rows: unknown) => {
        inserts.push({ table, rows: rows as unknown[] });
        return Promise.resolve({ error: null });
      },
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      select: () => ({}) ,
      eq: () => ({}),
      single: () => Promise.resolve({ data: null, error: null }),
    }),
    storage: {
      from: () => ({
        upload: async (path: string, bytes: Uint8Array) => {
          storage.uploaded.push({ path, bytes });
          return { data: { path }, error: null };
        },
        download: async () => ({ data: new Blob(["%PDF-fake"]), error: null }),
        remove: async (paths: string[]) => {
          storage.removed.push(paths);
          return { error: null };
        },
        createSignedUrl: async () => ({ data: { signedUrl: "https://signed" }, error: null }),
      }),
    },
  };
  return { supabase, updates, inserts, storage };
}

const BYTES = new Uint8Array([1, 2, 3]);

function mockHappyPipeline() {
  vi.mocked(validatePdfUpload).mockResolvedValue({ bytes: BYTES, filename: "notes.pdf", pageCount: 3 });
  vi.mocked(optimizePdf).mockResolvedValue({
    bytes: new Uint8Array([9, 9]),
    status: "compressed",
    originalSize: 100,
    storedSize: 40,
    compressionRatio: 0.6,
  });
  vi.mocked(extractPdfPages).mockResolvedValue([
    { pageNumber: 1, text: "alpha beta" },
    { pageNumber: 2, text: "" },
    { pageNumber: 3, text: "gamma delta" },
  ]);
  vi.mocked(chunkExtractedPages).mockReturnValue([
    { pageNumber: 1, chunkIndex: 0, text: "alpha beta" },
    { pageNumber: 3, chunkIndex: 1, text: "gamma delta" },
  ]);
  vi.mocked(embedTexts).mockResolvedValue([
    Array.from({ length: 768 }, () => 0.1),
    Array.from({ length: 768 }, () => 0.2),
  ]);
}

describe("processMaterialUpload", () => {
  it("runs the full pipeline and marks the material ready", async () => {
    mockHappyPipeline();
    const { supabase, updates, inserts, storage } = mockDb();
    const result = await processMaterialUpload(supabase as never, {
      materialId: "m1",
      teacherId: "t1",
      bytes: BYTES,
      filename: "notes.pdf",
    });
    expect(result).toEqual({ materialId: "m1" });
    expect(storage.uploaded[0].path).toBe("t1/m1/material.pdf");
    expect(storage.uploaded[0].bytes).toEqual(new Uint8Array([9, 9]));
    const chunkInsert = inserts.find((i) => i.table === "study_material_chunks");
    expect(chunkInsert?.rows).toHaveLength(2);
    const embeddingInsert = inserts.find((i) => i.table === "study_material_embeddings");
    expect(embeddingInsert?.rows).toHaveLength(2);
    const chunkIds = new Set((chunkInsert?.rows as { id: string }[]).map((r) => r.id));
    for (const row of embeddingInsert?.rows as { chunk_id: string }[]) {
      expect(chunkIds.has(row.chunk_id)).toBe(true);
    }
    expect(vi.mocked(embedTexts)).toHaveBeenCalledWith(["alpha beta", "gamma delta"], "RETRIEVAL_DOCUMENT");
    const final = updates[updates.length - 1];
    expect(final.patch).toMatchObject({
      processing_status: "ready",
      embedding_status: "complete",
      embedding_model: "gemini-embedding-001",
    });
    const sized = updates.find((u) => u.patch.original_size_bytes === 100);
    expect(sized?.patch).toMatchObject({
      stored_size_bytes: 40,
      compression_ratio: 0.6,
      optimization_status: "compressed",
      page_count: 3,
    });
  });

  it("fails invalid PDFs and image-only PDFs without going ready", async () => {
    const { supabase, updates } = mockDb();
    vi.mocked(validatePdfUpload).mockRejectedValue(new Error("NOT_A_PDF"));
    await expect(
      processMaterialUpload(supabase as never, { materialId: "m2", teacherId: "t1", bytes: BYTES, filename: "x.pdf" }),
    ).rejects.toThrow("INVALID_PDF");
    expect(updates[updates.length - 1].patch.processing_status).toBe("failed");

    const second = mockDb();
    vi.mocked(validatePdfUpload).mockResolvedValue({ bytes: BYTES, filename: "x.pdf", pageCount: 1 });
    vi.mocked(optimizePdf).mockResolvedValue({ bytes: BYTES, status: "stored_original", originalSize: 10, storedSize: 10, compressionRatio: 0 });
    vi.mocked(extractPdfPages).mockResolvedValue([{ pageNumber: 1, text: "" }]);
    await expect(
      processMaterialUpload(second.supabase as never, { materialId: "m3", teacherId: "t1", bytes: BYTES, filename: "x.pdf" }),
    ).rejects.toThrow("NO_READABLE_TEXT");
    const failedPatch = second.updates[second.updates.length - 1].patch;
    expect(failedPatch.processing_status).toBe("failed");
    expect(second.updates.some((u) => u.patch.extraction_status === "no_text")).toBe(true);
  });

  it("marks embedding failures instead of fake-ready", async () => {
    mockHappyPipeline();
    vi.mocked(embedTexts).mockRejectedValue(new Error("GEMINI_RATE_LIMITED"));
    const { supabase, updates, inserts } = mockDb();
    await expect(
      processMaterialUpload(supabase as never, { materialId: "m4", teacherId: "t1", bytes: BYTES, filename: "x.pdf" }),
    ).rejects.toThrow("EMBEDDING_FAILED");
    expect(inserts.some((i) => i.table === "study_material_embeddings")).toBe(false);
    expect(updates[updates.length - 1].patch.processing_status).toBe("failed");
  });
});

describe("retryMaterialProcessing", () => {
  it("downloads the stored file and re-runs the pipeline", async () => {
    mockHappyPipeline();
    const { supabase, inserts } = mockDb();
    await retryMaterialProcessing(supabase as never, {
      materialId: "m5",
      teacherId: "t1",
      storagePath: "t1/m5/material.pdf",
    });
    expect(inserts.some((i) => i.table === "study_material_chunks")).toBe(true);
  });
});
