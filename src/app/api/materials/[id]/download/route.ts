import { NextResponse } from "next/server";
import { getMaterialDownloadUrl } from "@/lib/materials/service";

// Student download: authenticate -> authorize (relationship-checked in SQL
// via RLS) -> short-lived signed URL -> redirect. Binaries never proxy
// through the app server; the URL expires in 60 seconds.
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const { url } = await getMaterialDownloadUrl(id);
    return NextResponse.redirect(url);
  } catch (error) {
    const code = error instanceof Error ? error.message : "MATERIAL_DOWNLOAD_FAILED";
    const status = code === "MATERIAL_NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ error: code }, { status });
  }
}
