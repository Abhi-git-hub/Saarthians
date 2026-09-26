import { describe, expect, it, vi } from "vitest";
import { processMaterialUpload, retryMaterialProcessing } from "./service";
import { extractPdfTextRobust, optimizePdf, validatePdfUpload } from "./pdf";
import { isOcrConfigured, ocrPdfPages } from "./ocr";

vi.mock("./pdf", () => ({
  validatePdfUpload: vi.fn(),
  optimizePdf: vi.fn(),
  extractPdfTextRobust: vi.fn(),
  chunkExtractedPages: vi.fn(),
}));

vi.mock("./ocr", () => ({
  isOcrConfigured: vi.fn().mockReturnValue(false),
  ocrPdfPages: vi.fn(),
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
  vi.mocked(validatePdfUpload).mockResolvedValue({ bytes: BYTES, filename: "notes.pdf", pageCount: 3, kind: "pdf" });
  vi.mocked(optimizePdf).mockResolvedValue({
    bytes: new Uint8Array([9, 9]),
    status: "compressed",
    originalSize: 100,
    storedSize: 40,
    compressionRatio: 0.6,
  });
  vi.mocked(extractPdfTextRobust).mockResolvedValue({
    pages: [
      { pageNumber: 1, text: "alpha beta" },
      { pageNumber: 2, text: "" },
      { pageNumber: 3, text: "gamma delta" },
    ],
    source: "pdfjs",
    diagnostics: "pdfjs ok",
  });
  vi.mocked(chunkExtractedPages).mockReturnValue([
    { pageNumber: 1, chunkIndex: 0, text: "alpha beta" },
    { pageNumber: 3, chunkIndex: 1, text: "gamma delta" },
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
    // No embedding provider is configured: nothing is written to the vector
    // table, and the material still goes ready with an honest skipped status.
    expect(inserts.some((i) => i.table === "study_material_embeddings")).toBe(false);
    const final = updates[updates.length - 1];
    expect(final.patch).toMatchObject({
      processing_status: "ready",
      embedding_status: "skipped",
    });
    const sized = updates.find((u) => u.patch.original_size_bytes === 3);
    expect(sized?.patch).toMatchObject({
      stored_size_bytes: 2,
      compression_ratio: 1 / 3,
      optimization_status: "compressed",
      page_count: 3,
    });
  });

  it("falls back to the original file when the rewrite loses text", async () => {
    mockHappyPipeline();
    // Optimized bytes extract to almost nothing: keep the original instead.
    vi.mocked(extractPdfTextRobust)
      .mockResolvedValueOnce({
        pages: [{ pageNumber: 1, text: "alpha beta gamma delta epsilon" }],
        source: "pdfjs",
        diagnostics: "pdfjs ok",
      })
      .mockResolvedValueOnce({ pages: [{ pageNumber: 1, text: "" }], source: "pdfjs", diagnostics: "empty" });
    const { supabase, updates, storage } = mockDb();
    await processMaterialUpload(supabase as never, {
      materialId: "m6",
      teacherId: "t1",
      bytes: BYTES,
      filename: "notes.pdf",
    });
    // Stored bytes are the original (3 bytes), not the optimized (2 bytes).
    expect(storage.uploaded[0].bytes).toEqual(BYTES);
    expect(updates.some((u) => u.patch.optimization_status === "stored_original")).toBe(true);
    const final = updates[updates.length - 1];
    expect(final.patch.processing_status).toBe("ready");
  });

  it("fails invalid PDFs and image-only PDFs without going ready", async () => {
    const { supabase, updates } = mockDb();
    vi.mocked(validatePdfUpload).mockRejectedValue(new Error("NOT_A_PDF"));
    await expect(
      processMaterialUpload(supabase as never, { materialId: "m2", teacherId: "t1", bytes: BYTES, filename: "x.pdf" }),
    ).rejects.toThrow("INVALID_PDF");
    expect(updates[updates.length - 1].patch.processing_status).toBe("failed");

    const second = mockDb();
    vi.mocked(validatePdfUpload).mockResolvedValue({ bytes: BYTES, filename: "x.pdf", pageCount: 1, kind: "pdf" });
    vi.mocked(optimizePdf).mockResolvedValue({ bytes: BYTES, status: "stored_original", originalSize: 10, storedSize: 10, compressionRatio: 0 });
    vi.mocked(extractPdfTextRobust).mockRejectedValue(new Error("NO_READABLE_TEXT: pages=1, pdfjs_chars=0, scraped_chars=0, text_streams=0. Scanned or image-only PDFs are not supported yet."));
    await expect(
      processMaterialUpload(second.supabase as never, { materialId: "m3", teacherId: "t1", bytes: BYTES, filename: "x.pdf" }),
    ).rejects.toThrow("NO_READABLE_TEXT");
    const failedPatch = second.updates[second.updates.length - 1].patch;
    expect(failedPatch.processing_status).toBe("failed");
    expect(second.updates.some((u) => u.patch.extraction_status === "no_text")).toBe(true);
  });

  it("records chunk ids for future embedding backfill", async () => {
    mockHappyPipeline();
    const { supabase, inserts } = mockDb();
    await processMaterialUpload(supabase as never, {
      materialId: "m4",
      teacherId: "t1",
      bytes: BYTES,
      filename: "x.pdf",
    });
    const chunkInsert = inserts.find((i) => i.table === "study_material_chunks");
    const ids = (chunkInsert?.rows as { id: string }[]).map((r) => r.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it("stores Word documents as-is for download without indexing", async () => {
    const { supabase, updates, inserts, storage } = mockDb();
    vi.mocked(validatePdfUpload).mockResolvedValue({ bytes: BYTES, filename: "notes.docx", pageCount: 0, kind: "docx" });
    const result = await processMaterialUpload(supabase as never, {
      materialId: "m9",
      teacherId: "t1",
      bytes: BYTES,
      filename: "notes.docx",
    });
    expect(result).toEqual({ materialId: "m9" });
    expect(storage.uploaded[0].path).toBe("t1/m9/material.docx");
    expect(inserts.some((i) => i.table === "study_material_chunks")).toBe(false);
    const row = updates.find((u) => u.patch.extraction_status === "file_only");
    expect(row?.patch).toMatchObject({ processing_status: "ready" });
  });

  it("routes scanned documents through OCR and flags the origin", async () => {
    const { supabase, updates, inserts } = mockDb();
    vi.mocked(validatePdfUpload).mockResolvedValue({ bytes: BYTES, filename: "scan.pdf", pageCount: 2, kind: "pdf" });
    vi.mocked(optimizePdf).mockResolvedValue({ bytes: BYTES, status: "stored_original", originalSize: 10, storedSize: 10, compressionRatio: 0 });
    vi.mocked(extractPdfTextRobust).mockRejectedValue(new Error("NO_READABLE_TEXT: pages=2, pdfjs_chars=0"));
    vi.mocked(isOcrConfigured).mockReturnValue(true);
    vi.mocked(ocrPdfPages).mockResolvedValue([
      { pageNumber: 1, text: "transcribed page one content here yes" },
      { pageNumber: 2, text: "transcribed page two content here yes" },
    ]);
    vi.mocked(chunkExtractedPages).mockReturnValue([
      { pageNumber: 1, chunkIndex: 0, text: "transcribed page one content here yes" },
    ]);
    const result = await processMaterialUpload(supabase as never, {
      materialId: "m7",
      teacherId: "t1",
      bytes: BYTES,
      filename: "scan.pdf",
    });
    expect(result).toEqual({ materialId: "m7" });
    expect(vi.mocked(ocrPdfPages)).toHaveBeenCalledWith(BYTES);
    expect(updates.some((u) => u.patch.processing_status === "needs_ocr")).toBe(true);
    expect(inserts.some((i) => i.table === "study_material_chunks")).toBe(true);
    const final = updates[updates.length - 1];
    expect(final.patch).toMatchObject({ processing_status: "ready", embedding_status: "skipped" });
    const withOcr = updates.find((u) => u.patch.extraction_status === "ocr");
    expect(withOcr).toBeDefined();
    vi.mocked(isOcrConfigured).mockReturnValue(false);
  });

  it("fails clearly when scans cannot be converted and no key exists", async () => {
    const { supabase, updates } = mockDb();
    vi.mocked(validatePdfUpload).mockResolvedValue({ bytes: BYTES, filename: "scan.pdf", pageCount: 1, kind: "pdf" });
    vi.mocked(extractPdfTextRobust).mockRejectedValue(new Error("NO_READABLE_TEXT: pages=1"));
    vi.mocked(isOcrConfigured).mockReturnValue(false);
    await expect(
      processMaterialUpload(supabase as never, { materialId: "m8", teacherId: "t1", bytes: BYTES, filename: "scan.pdf" }),
    ).rejects.toThrow("GEMINI_API_KEY");
    expect(updates[updates.length - 1].patch.processing_status).toBe("failed");
    expect(vi.mocked(ocrPdfPages)).not.toHaveBeenCalled();
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
