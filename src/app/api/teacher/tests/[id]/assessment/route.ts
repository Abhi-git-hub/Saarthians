import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MAX_PDF_BYTES, optimizePdf, validatePdfUpload } from "@/lib/materials/pdf";

// Assessment PDF namespace: assessments/<teacher_id>/<test_id>/test.pdf
// Students can read it only inside the published window (storage policy);
// answer keys must never be uploaded here — questions live in the database.
const ASSESSMENT_BUCKET = "assessments";

async function ownTest(testId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tests")
    .select("id,teacher_id")
    .eq("id", testId)
    .single();
  if (error || !data) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (data.teacher_id !== userId && profile?.role !== "admin") return null;
  return supabase;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let user;
  try {
    user = await requireRole(["teacher", "admin"]);
  } catch {
    return NextResponse.json({ error: "AUTHORIZATION_REQUIRED" }, { status: 403 });
  }
  const supabase = await ownTest(id, user.id);
  if (!supabase) return NextResponse.json({ error: "TEST_NOT_FOUND" }, { status: 404 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "INVALID_UPLOAD" }, { status: 400 });
  }
  const file = form.get("file");
  if (!file || typeof file === "string" || file.size === 0) {
    return NextResponse.json({ error: "EMPTY_FILE" }, { status: 400 });
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "FILE_TOO_LARGE", maxBytes: MAX_PDF_BYTES }, { status: 413 });
  }
  const filename = typeof (file as File).name === "string" ? (file as File).name : "test.pdf";

  let bytes: Uint8Array;
  try {
    const validated = await validatePdfUpload({ bytes: new Uint8Array(await file.arrayBuffer()), filename });
    bytes = (await optimizePdf(validated.bytes)).bytes;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "INVALID_PDF" }, { status: 422 });
  }

  const path = `${user.id}/${id}/test.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(ASSESSMENT_BUCKET)
    .upload(path, bytes, { contentType: "application/pdf", upsert: true });
  if (uploadError) return NextResponse.json({ error: "STORAGE_UPLOAD_FAILED" }, { status: 500 });

  const { error: updateError } = await supabase.from("tests").update({ assessment_pdf_path: path }).eq("id", id);
  if (updateError) return NextResponse.json({ error: "ASSESSMENT_LINK_FAILED" }, { status: 500 });
  return NextResponse.json({ path }, { status: 201 });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let user;
  try {
    user = await requireRole(["teacher", "admin"]);
  } catch {
    return NextResponse.json({ error: "AUTHORIZATION_REQUIRED" }, { status: 403 });
  }
  const supabase = await ownTest(id, user.id);
  if (!supabase) return NextResponse.json({ error: "TEST_NOT_FOUND" }, { status: 404 });
  await supabase.storage.from(ASSESSMENT_BUCKET).remove([`${user.id}/${id}/test.pdf`]);
  await supabase.from("tests").update({ assessment_pdf_path: null }).eq("id", id);
  return NextResponse.json({ ok: true });
}
