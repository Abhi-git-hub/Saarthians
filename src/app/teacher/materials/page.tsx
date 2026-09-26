import Link from "next/link";
import { getTeacherMaterials } from "@/lib/materials/service";
import { EmptyState, PageHeading, StatusPill } from "@/components/ui";

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

function statusTone(status: string): "live" | "warn" | "bad" | "idle" {
  switch (status) {
    case "ready":
      return "live";
    case "failed":
      return "bad";
    case "processing":
      return "warn";
    default:
      return "idle";
  }
}

// The five real pipeline stages, in order. Each lights up from the stored
// statuses — never animated guesses.
function stagesFor(material: {
  processing_status: string;
  optimization_status: string;
  extraction_status: string;
  embedding_status: string;
}): Array<{ label: string; state: "done" | "active" | "todo" | "failed" }> {
  const failed = material.processing_status === "failed";
  const ready = material.processing_status === "ready";
  const extracting = material.extraction_status === "complete" || ready;
  const optimized = material.optimization_status === "compressed" || material.optimization_status === "stored_original";
  return [
    { label: "Validate", state: failed && !optimized && !extracting ? "failed" : "done" },
    { label: "Optimize", state: optimized ? "done" : failed ? "failed" : "active" },
    { label: "Extract", state: extracting ? "done" : failed ? "failed" : material.processing_status === "processing" && optimized ? "active" : "todo" },
    { label: "Index", state: ready ? "done" : failed ? "failed" : extracting ? "active" : "todo" },
    { label: "Ready", state: ready ? "done" : failed ? "failed" : "todo" },
  ];
}

export default async function TeacherMaterialsPage() {
  const materials = await getTeacherMaterials();

  return (
    <main className="workspace-page">
      <div className="container">
        <PageHeading
          eyebrow="Study material · your shelf"
          title={<>Upload <em>once.</em></>}
          lede="PDFs are validated, optimized, and indexed. Only your class sees what you upload for them."
          action={<Link href="/teacher/materials/new" className="primary-button">Upload PDF →</Link>}
        />
        {materials.length > 0 ? (
          <div className="data-rows">
            {materials.map((material) => {
              const saved =
                material.optimization_status === "compressed" && material.original_size_bytes > 0
                  ? Math.round((1 - material.stored_size_bytes / material.original_size_bytes) * 1000) / 10
                  : null;
              return (
                <article key={material.id} className="data-row material-row">
                  <span className="doc-icon" aria-hidden="true">{material.mime_type?.includes("word") ? "DOC" : "PDF"}</span>
                  <span className="data-row-main">
                    <Link href={`/teacher/materials/${material.id}`}><strong>{material.title}</strong></Link>
                    <span>
                      {[material.subject, material.grade_level, material.chapter].filter(Boolean).join(" · ") || "Untagged"}
                      {material.page_count > 0 && ` · ${material.page_count} pages`}
                      {material.stored_size_bytes > 0 && ` · ${formatBytes(material.stored_size_bytes)}`}
                      {saved !== null && ` · saved ${saved}%`}
                    </span>
                    <span className="pipeline" aria-label={`Processing: ${material.processing_status}`}>
                      {stagesFor(material).map((stage) => (
                        <i key={stage.label} title={stage.label} className={`pipe is-${stage.state}`} />
                      ))}
                    </span>
                    {material.processing_status === "failed" && material.processing_error && (
                      <span className="pipeline-error">{material.processing_error}</span>
                    )}
                    {material.extraction_status === "file_only" && (
                      <span style={{ color: "var(--muted)", fontSize: 12.5 }}>Download only — text not indexed for search.</span>
                    )}
                  </span>
                  <span className="data-row-side">
                    <StatusPill tone={statusTone(material.processing_status)}>{material.processing_status}</StatusPill>
                    <Link href={`/teacher/materials/${material.id}`} className="text-link">Open →</Link>
                  </span>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Your shelf is empty."
            body="Upload the chapter your students keep asking about. It becomes visible to them only after every processing stage succeeds."
            action={{ href: "/teacher/materials/new", label: "Upload your first PDF →" }}
          />
        )}
      </div>
    </main>
  );
}
