import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MAX_PDF_BYTES } from "@/lib/materials/pdf";
import { processMaterialUpload } from "@/lib/materials/service";

// Teacher PDF upload. Multipart form handling lives in a Route Handler
// because Server Actions cap payload size well below the 15 MB product limit.
// The pipeline (validate -> optimize -> store -> extract -> index) runs
// synchronously in the request; the material row records every stage so the
// UI can report processing / ready / failed honestly.

const metadataSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).default(""),
  subject: z.string().trim().max(100).default(""),
  gradeLevel: z.string().trim().max(50).default(""),
  chapter: z.string().trim().max(200).default(""),
});

export async function POST(request: Request) {
  let user;
  try {
    user = await requireRole(["teacher", "admin"]);
  } catch {
    return NextResponse.json({ error: "AUTHORIZATION_REQUIRED" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "INVALID_UPLOAD" }, { status: 400 });
  }

  const parsed = metadataSchema.safeParse({
    title: form.get("title"),
    description: form.get("description") ?? "",
    subject: form.get("subject") ?? "",
    gradeLevel: form.get("gradeLevel") ?? "",
    chapter: form.get("chapter") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_METADATA" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || typeof file === "string" || file.size === 0) {
    return NextResponse.json({ error: "EMPTY_FILE" }, { status: 400 });
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "FILE_TOO_LARGE", maxBytes: MAX_PDF_BYTES }, { status: 413 });
  }

  const filename = typeof (file as File).name === "string" ? (file as File).name : "material.pdf";
  const supabase = await createClient();
  const { data: material, error: createError } = await supabase
    .from("study_materials")
    .insert({
      teacher_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      subject: parsed.data.subject,
      grade_level: parsed.data.gradeLevel,
      chapter: parsed.data.chapter,
      original_filename: filename.slice(0, 200),
      processing_status: "uploading",
    })
    .select("id")
    .single();
  if (createError || !material) {
    return NextResponse.json({ error: "MATERIAL_CREATE_FAILED" }, { status: 500 });
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await processMaterialUpload(supabase, {
      materialId: material.id,
      teacherId: user.id,
      bytes,
      filename,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "PROCESSING_FAILED";
    return NextResponse.json({ error: code, materialId: material.id }, { status: 422 });
  }

  const { data: row } = await supabase
    .from("study_materials")
    .select(
      "id,title,processing_status,original_size_bytes,stored_size_bytes,compression_ratio,optimization_status,page_count,extraction_status,embedding_status",
    )
    .eq("id", material.id)
    .single();
  return NextResponse.json({ material: row }, { status: 201 });
}
