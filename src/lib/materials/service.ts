import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { chunkExtractedPages, extractPdfPages, optimizePdf, validatePdfUpload } from "./pdf";

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

  const optimized = await optimizePdf(validated.bytes);
  const storagePath = `${teacherId}/${materialId}/material.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(MATERIAL_BUCKET)
    .upload(storagePath, optimized.bytes, { contentType: "application/pdf", upsert: true });
  if (uploadError) {
    return failMaterial(supabase, materialId, `STORAGE_UPLOAD_FAILED: ${uploadError.message}`);
  }

  await markMaterial(supabase, materialId, {
    original_filename: validated.filename,
    storage_path: storagePath,
    mime_type: "application/pdf",
    original_size_bytes: optimized.originalSize,
    stored_size_bytes: optimized.storedSize,
    compression_ratio: optimized.compressionRatio,
    optimization_status: optimized.status === "compressed" ? "compressed" : optimized.status === "stored_original" ? "stored_original" : "skipped",
    page_count: validated.pageCount,
  });

  let pages;
  try {
    pages = await extractPdfPages(optimized.bytes);
  } catch {
    return failMaterial(supabase, materialId, "EXTRACTION_FAILED: the PDF text could not be read.");
  }
  const usableText = pages.some((page) => page.text.length > 0);
  if (!usableText) {
    await markMaterial(supabase, materialId, { extraction_status: "no_text" });
    return failMaterial(
      supabase,
      materialId,
      "NO_READABLE_TEXT: scanned or image-only PDFs are not supported yet.",
    );
  }
  await markMaterial(supabase, materialId, { extraction_status: "complete" });

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
  return processMaterialUpload(supabase, {
    materialId: input.materialId,
    teacherId: input.teacherId,
    bytes,
    filename: "material.pdf",
  });
}

export async function getTeacherMaterials() {
  const user = await requireRole(["teacher", "admin"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("study_materials")
    .select(
      "id,title,subject,grade_level,chapter,processing_status,processing_error,original_size_bytes,stored_size_bytes,compression_ratio,optimization_status,page_count,extraction_status,embedding_status,created_at,updated_at",
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

