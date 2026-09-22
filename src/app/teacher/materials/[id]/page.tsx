import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteMaterial, retryMaterial } from "../actions";

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "—";
  const units = ["B", "KB", "MB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

export default async function MaterialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["teacher", "admin"]);
  const supabase = await createClient();
  const { data: material } = await supabase
    .from("study_materials")
    .select("*")
    .eq("id", id)
    .eq("teacher_id", user.id)
    .single();
  if (!material) notFound();

  const saved =
    material.optimization_status === "compressed" && material.original_size_bytes > 0
      ? Math.round((1 - material.stored_size_bytes / material.original_size_bytes) * 1000) / 10
      : null;

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <Link href="/teacher/materials" style={{ color: "var(--muted)" }}>← All material</Link>
      <h1 style={{ fontSize: "clamp(32px,4.5vw,52px)", letterSpacing: "-.04em", margin: "16px 0 8px" }}>{material.title}</h1>
      <p style={{ color: "var(--muted)", margin: "0 0 24px" }}>
        {[material.subject, material.grade_level, material.chapter].filter(Boolean).join(" · ")}
      </p>

      <section style={{ border: "1px solid var(--line)", borderRadius: 16, padding: 20, display: "grid", gap: 10 }}>
        <Row label="Status" value={material.processing_status} />
        {material.processing_error && <Row label="Reason" value={material.processing_error} alert />}
        <Row label="Original" value={formatBytes(material.original_size_bytes)} />
        <Row
          label="Stored"
          value={
            material.optimization_status === "compressed"
              ? `${formatBytes(material.stored_size_bytes)} (saved ${saved}%)`
              : material.optimization_status === "stored_original"
                ? `${formatBytes(material.stored_size_bytes)} — stored without additional compression`
                : formatBytes(material.stored_size_bytes)
          }
        />
        <Row label="Pages" value={String(material.page_count || "—")} />
        <Row label="Text extraction" value={material.extraction_status} />
        <Row label="Search index" value={material.embedding_status} />
      </section>

      {material.processing_status !== "ready" && (
        <form action={retryMaterial} style={{ marginTop: 18 }}>
          <input type="hidden" name="id" value={material.id} />
          <button type="submit" style={buttonStyle}>Retry processing →</button>
        </form>
      )}
      <form action={deleteMaterial} style={{ marginTop: 12 }}>
        <input type="hidden" name="id" value={material.id} />
        <button type="submit" style={{ ...buttonStyle, background: "transparent", color: "#b42318", border: "1px solid currentColor" }}>
          Delete material
        </button>
      </form>
    </main>
  );
}

function Row({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12 }}>
      <span style={{ color: "var(--muted)", fontSize: 14 }}>{label}</span>
      <span style={{ color: alert ? "#b42318" : "var(--ink)", lineHeight: 1.6 }}>{value}</span>
    </div>
  );
}

const buttonStyle = { border: 0, borderRadius: 999, padding: "13px 20px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" };
