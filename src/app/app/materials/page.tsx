import Link from "next/link";
import { getStudentMaterials } from "@/lib/materials/service";

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "";
  const units = ["B", "KB", "MB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

export default async function StudentMaterialsPage() {
  const materials = await getStudentMaterials();

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <span className="eyebrow">Study material</span>
      <h1 style={{ fontSize: "clamp(40px,6vw,68px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 12px" }}>Read the chapter.</h1>
      <p style={{ color: "var(--muted)", maxWidth: 620, lineHeight: 1.7, margin: "0 0 26px" }}>Material from your teachers. Download it, study it, then ask the tutor about anything inside.</p>
      <div>
        {materials.map((material) => (
          <article key={material.id} style={{ borderTop: "1px solid var(--line)", padding: "20px 0", display: "grid", gridTemplateColumns: "1fr auto", gap: 22, alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 750, letterSpacing: "-.03em" }}>{material.title}</div>
              <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: "7px 0 0", maxWidth: 760 }}>
                {[material.subject, material.grade_level, material.chapter].filter(Boolean).join(" · ")}
                {material.page_count > 0 && ` · ${material.page_count} pages`}
                {material.stored_size_bytes > 0 && ` · ${formatBytes(material.stored_size_bytes)}`}
              </p>
              {material.description && (
                <p style={{ color: "var(--muted)", lineHeight: 1.6, margin: "7px 0 0", maxWidth: 760 }}>{material.description.slice(0, 220)}</p>
              )}
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Link href={`/app/chat?m=${material.id}`} style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>Ask tutor →</Link>
              <a href={`/api/materials/${material.id}/download`} style={{ background: "var(--accent)", color: "white", padding: "10px 16px", borderRadius: 999, fontWeight: 700, whiteSpace: "nowrap" }}>Download</a>
            </div>
          </article>
        ))}
        {!materials.length && <div style={{ borderTop: "1px solid var(--line)", padding: "28px 0", color: "var(--muted)" }}>No study material from your teachers yet.</div>}
      </div>
    </main>
  );
}
