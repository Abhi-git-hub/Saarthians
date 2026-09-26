import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isOcrConfigured, ocrPdfPages } from "./ocr";
import { chunkExtractedPages, extractPdfTextRobust, optimizePdf, validatePdfUpload } from "./pdf";
import type { ExtractedPage } from "./pdf";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

// Study-material pipeline. The PDF binary lives in private Supabase Storage;
// metadata, chunks, and embeddings live in PostgreSQL. A material is READY
// only after validation + optimization + extraction + indexing all succeed.

export const MATERIAL_BUCKET = "study-materials";

export type MaterialMetadata = {
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  chapter: string;
};

async function markMaterial(
  supabase: ServerClient,
  materialId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from("study_materials").update(patch).eq("id", materialId);
  if (error) throw new Error(`MATERIAL_UPDATE_FAILED: ${error.message}`);
}

async function failMaterial(supabase: ServerClient, materialId: string, reason: string): Promise<never> {
  await markMaterial(supabase, materialId, {
    processing_status: "failed",
    processing_error: reason.slice(0, 500),
    updated_at: new Date().toISOString(),
  });
  throw new Error(reason);
}

/**
 * Run the full pipeline for an uploaded file. The caller must have created
 * the material row (status `uploading`) and authorized the teacher.
 */
export async function processMaterialUpload(
  supabase: ServerClient,
  input: { materialId: string; teacherId: string; bytes: Uint8Array; filename: string },
): Promise<{ materialId: string }> {
  const { materialId, teacherId } = input;
  await markMaterial(supabase, materialId, { processing_status: "processing", processing_error: null });

  let validated;
  try {
    validated = await validatePdfUpload({ bytes: input.bytes, filename: input.filename });
  } catch (error) {
    return failMaterial(supabase, materialId, error instanceof Error ? `INVALID_PDF: ${error.message}` : "INVALID_PDF");
  }

  // Word documents and unreadable-but-valid files are stored verbatim and
  // served for download. They carry extraction_status 'file_only', produce
  // no chunks, and therefore never enter tutor retrieval (which ranks
  // chunks only) — the product stays honest about what is searchable.
  if (validated.kind === "docx") {
    const docPath = `${teacherId}/${materialId}/material.docx`;
    const { error: docUploadError } = await supabase.storage
      .from(MATERIAL_BUCKET)
      .upload(docPath, validated.bytes, { contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", upsert: true });
    if (docUploadError) {
      return failMaterial(supabase, materialId, `STORAGE_UPLOAD_FAILED: ${docUploadError.message}`);
    }
    await markMaterial(supabase, materialId, {
      original_filename: validated.filename,
      storage_path: docPath,
      mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      original_size_bytes: validated.bytes.length,
      stored_size_bytes: validated.bytes.length,
      compression_ratio: 0,
      optimization_status: "skipped",
      page_count: 0,
      extraction_status: "file_only",
      processing_status: "ready",
      processing_error: null,
      embedding_status: "skipped",
      updated_at: new Date().toISOString(),
    });
    return { materialId };
  }

  // Extract from the ORIGINAL bytes first: the optimizer rewrite can disturb
  // exotic files, so the canonical text always comes from a verified source.
  // Scanned (image-only) documents route to vision OCR instead of failing,
  // and the OCR origin stays flagged on the row forever.
  let originalText: { pages: ExtractedPage[]; source: string; diagnostics: string };
  let ocrUsed = false;
  try {
    originalText = await extractPdfTextRobust(validated.bytes);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "NO_READABLE_TEXT";
    if (!reason.startsWith("NO_READABLE_TEXT") || !isOcrConfigured()) {
      await markMaterial(supabase, materialId, { extraction_status: "no_text" });
      return failMaterial(
        supabase,
        materialId,
        isOcrConfigured()
          ? reason
          : `${reason} Scanned documents need text conversion (server setting GEMINI_API_KEY); otherwise upload a text-based PDF.`,
      );
    }
    await markMaterial(supabase, materialId, { processing_status: "needs_ocr", extraction_status: "pending" });
    try {
      const ocrPages = await ocrPdfPages(validated.bytes);
      originalText = {
        pages: ocrPages.map((p) => ({ pageNumber: p.pageNumber, text: p.text })),
        source: "ocr",
        diagnostics: `ocr ok: ${ocrPages.length} pages transcribed from images`,
      };
      ocrUsed = true;
    } catch (ocrError) {
      await markMaterial(supabase, materialId, { extraction_status: "no_text" });
      return failMaterial(
        supabase,
        materialId,
        ocrError instanceof Error ? `OCR_FAILED: ${ocrError.message} (${reason})` : `OCR_FAILED (${reason})`,
      );
    }
  }

  const optimized = await optimizePdf(validated.bytes);

  // Verify the rewrite preserved the text: re-extract from the optimized
  // bytes and keep whichever file the extractor reads better. The stored
  // bytes and the indexed text always come from the same source. Skipped
  // for OCR text, which was read from the original's images (visually
  // identical in either file).
  let storedBytes = optimized.bytes;
  let storedText = originalText;
  let optimizationNote = optimized.status;
  if (optimized.status === "compressed" && !ocrUsed) {
    try {
      const recheck = await extractPdfTextRobust(optimized.bytes);
      const originalChars = originalText.pages.reduce((sum, page) => sum + page.text.length, 0);
      const recheckChars = recheck.pages.reduce((sum, page) => sum + page.text.length, 0);
      if (recheckChars >= originalChars * 0.9) {
        storedText = recheck;
      } else {
        storedBytes = validated.bytes;
        optimizationNote = "stored_original";
      }
    } catch {
      storedBytes = validated.bytes;
      optimizationNote = "stored_original";
    }
  }

  const storagePath = `${teacherId}/${materialId}/material.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(MATERIAL_BUCKET)
    .upload(storagePath, storedBytes, { contentType: "application/pdf", upsert: true });
  if (uploadError) {
    return failMaterial(supabase, materialId, `STORAGE_UPLOAD_FAILED: ${uploadError.message}`);
  }

  await markMaterial(supabase, materialId, {
    original_filename: validated.filename,
    storage_path: storagePath,
    mime_type: "application/pdf",
    original_size_bytes: validated.bytes.length,
    stored_size_bytes: storedBytes.length,
    compression_ratio: storedBytes.length < validated.bytes.length
      ? (validated.bytes.length - storedBytes.length) / validated.bytes.length
      : 0,
    optimization_status: optimizationNote === "compressed" ? "compressed" : optimizationNote === "stored_original" ? "stored_original" : "skipped",
    page_count: validated.pageCount,
  });

  await markMaterial(supabase, materialId, {
    extraction_status: ocrUsed ? "ocr" : "complete",
    processing_error: null,
  });

  const pages = storedText.pages;

  const chunks = chunkExtractedPages(pages);
  if (chunks.length === 0) {
    return failMaterial(supabase, materialId, "CHUNKING_FAILED: no indexable content was produced.");
  }
  // Client-generated ids keep the chunk -> embedding mapping exact regardless
  // of the order Postgres returns inserted rows in.
  const chunkRows = chunks.map((chunk) => ({
    id: crypto.randomUUID(),
    material_id: materialId,
    page_number: chunk.pageNumber,
    chunk_index: chunk.chunkIndex,
    text: chunk.text,
    metadata_json: {},
  }));
  const { error: chunkError } = await supabase.from("study_material_chunks").insert(chunkRows);
  if (chunkError) {
    return failMaterial(supabase, materialId, `INDEXING_FAILED: ${chunkError.message}`);
  }

  // No embedding provider is configured (Groq exposes chat models only), so
  // semantic vectors cannot be built. The material is still fully usable:
  // validated, optimized, stored, text-extracted, chunked, downloadable, and
  // searchable through authorized lexical retrieval. The pgvector tables stay
  // in schema for the day an embedding provider arrives.
  await markMaterial(supabase, materialId, {
    processing_status: "ready",
    processing_error: null,
    embedding_status: "skipped",
    embedding_model: "",
    updated_at: new Date().toISOString(),
  });
  return { materialId };
}

/** Re-run extraction + indexing from the stored canonical file. */
export async function retryMaterialProcessing(
  supabase: ServerClient,
  input: { materialId: string; teacherId: string; storagePath: string },
): Promise<{ materialId: string }> {
  const { data, error } = await supabase.storage.from(MATERIAL_BUCKET).download(input.storagePath);
  if (error || !data) throw new Error(`MATERIAL_RETRY_FAILED: ${error?.message ?? "download failed"}`);
  // Remove previous chunks (embeddings cascade) so the retry re-indexes cleanly.
  const { error: clearError } = await supabase
    .from("study_material_chunks")
    .delete()
    .eq("material_id", input.materialId);
  if (clearError) throw new Error(`MATERIAL_RETRY_FAILED: ${clearError.message}`);
  const bytes = new Uint8Array(await data.arrayBuffer());
  // Derive the filename from the stored path so type detection (pdf vs
  // docx) works on retry exactly as on first upload.
  const storedName = input.storagePath.split("/").pop() ?? "material.pdf";
  return processMaterialUpload(supabase, {
    materialId: input.materialId,
    teacherId: input.teacherId,
    bytes,
    filename: storedName,
  });
}

export async function getTeacherMaterials() {
  const user = await requireRole(["teacher", "admin"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_materials")
    .select(
      "id,title,subject,grade_level,chapter,processing_status,processing_error,original_size_bytes,stored_size_bytes,compression_ratio,optimization_status,page_count,extraction_status,embedding_status,mime_type,created_at,updated_at",
    )
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error("MATERIALS_LOAD_FAILED");
  return data;
}

export async function getStudentMaterials() {
  await requireRole(["student"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_materials")
    .select("id,title,description,subject,grade_level,chapter,page_count,stored_size_bytes,created_at")
    .eq("processing_status", "ready")
    .order("created_at", { ascending: false });
  if (error) throw new Error("MATERIALS_LOAD_FAILED");
  return data;
}

/** Load a material the student may access (RLS enforces the relationship). */
export async function getAuthorizedMaterial(materialId: string) {
  await requireRole(["student"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_materials")
    .select("id,title,description,subject,grade_level,chapter,page_count,stored_size_bytes,teacher_id")
    .eq("id", materialId)
    .eq("processing_status", "ready")
    .single();
  if (error || !data) throw new Error("MATERIAL_NOT_FOUND");
  return data;
}

/** Short-lived download URL after authorization. */
export async function getMaterialDownloadUrl(materialId: string): Promise<{ url: string; filename: string }> {
  const material = await getAuthorizedMaterial(materialId);
  const supabase = await createClient();
  const { data: row, error: rowError } = await supabase
    .from("study_materials")
    .select("storage_path,title")
    .eq("id", material.id)
    .single();
  if (rowError || !row?.storage_path) throw new Error("MATERIAL_NOT_FOUND");
  const { data, error } = await supabase.storage
    .from(MATERIAL_BUCKET)
    .createSignedUrl(row.storage_path, 60);
  if (error || !data) throw new Error("MATERIAL_DOWNLOAD_FAILED");
  return { url: data.signedUrl, filename: `${row.title.slice(0, 80)}.pdf` };
}

