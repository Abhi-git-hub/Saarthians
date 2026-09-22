import Link from "next/link";
import { getTeacherMaterials } from "@/lib/materials/service";

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

function statusLabel(status: string): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "processing":
      return "Processing…";
    case "failed":
      return "Failed";
    default:
      return "Uploading…";
  }
}

export default async function TeacherMaterialsPage() {
  const materials = await getTeacherMaterials();

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "end", flexWrap: "wrap" }}>
        <div><span className="eyebrow">Study material</span><h1 style={{ fontSize: "clamp(40px,6vw,68px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 12px" }}>Upload once.</h1><p style={{ color: "var(--muted)", maxWidth: 620, lineHeight: 1.7, margin: 0 }}>PDFs are validated, optimized, and indexed. Your students and the AI tutor read from the same canonical file.</p></div>
        <Link href="/teacher/materials/new" style={{ background: "var(--accent)", color: "white", padding: "13px 18px", borderRadius: 999, fontWeight: 700 }}>Upload PDF →</Link>
      </div>
      <div style={{ marginTop: 26 }}>
        {materials.map((material) => {
          const saved =
            material.optimization_status === "compressed" && material.original_size_bytes > 0
              ? Math.round((1 - material.stored_size_bytes / material.original_size_bytes) * 1000) / 10
              : null;
          return (
            <article key={material.id} style={{ borderTop: "1px solid var(--line)", padding: "20px 0", display: "grid", gridTemplateColumns: "1fr auto", gap: 22, alignItems: "start" }}>
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <Link href={`/teacher/materials/${material.id}`} style={{ fontSize: 22, fontWeight: 750, letterSpacing: "-.03em" }}>{material.title}</Link>
                  <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)" }}>{statusLabel(material.processing_status)}</span>
                </div>
                <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: "7px 0 0", maxWidth: 760 }}>
                  {[material.subject, material.grade_level, material.chapter].filter(Boolean).join(" · ") || "Untagged"}
                  {material.page_count > 0 && ` · ${material.page_count} pages`}
                  {material.stored_size_bytes > 0 && ` · ${formatBytes(material.stored_size_bytes)}`}
                  {saved !== null && ` · saved ${saved}%`}
                </p>
                {material.processing_status === "failed" && material.processing_error && (
                  <p style={{ color: "#b42318", lineHeight: 1.6, margin: "7px 0 0", maxWidth: 760 }}>{material.processing_error}</p>
                )}
              </div>
              <Link href={`/teacher/materials/${material.id}`} style={{ color: "var(--muted)" }}>Open →</Link>
            </article>
          );
        })}
        {!materials.length && <div style={{ borderTop: "1px solid var(--line)", padding: "28px 0", color: "var(--muted)" }}>No PDFs yet. Upload the chapter your students keep asking about.</div>}
      </div>
    </main>
  );
}
