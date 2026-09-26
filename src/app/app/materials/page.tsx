import { getStudentMaterials } from "@/lib/materials/service";
import { EmptyState, PageHeading } from "@/components/ui";

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "";
  const units = ["B", "KB", "MB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

export default async function StudentMaterialsPage() {
  const materials = await getStudentMaterials();

  return (
    <main className="workspace-page">
      <div className="container">
        <PageHeading
          eyebrow="Study material · document library"
          title={<>Read the <em>chapter.</em></>}
          lede="Material from your teachers. Download it and study it — your class sees only its own chapters."
        />
        {materials.length > 0 ? (
          <div className="data-rows doc-rows">
            {materials.map((material) => (
              <article key={material.id} className="data-row doc-row">
                <span className="doc-icon" aria-hidden="true">PDF</span>
                <span className="data-row-main">
                  <strong>{material.title}</strong>
                  <span>
                    {[material.subject, material.grade_level, material.chapter].filter(Boolean).join(" · ")}
                    {material.page_count > 0 && ` · ${material.page_count} pages`}
                    {material.stored_size_bytes > 0 && ` · ${formatBytes(material.stored_size_bytes)}`}
                  </span>
                  {material.description && <span className="doc-desc">{material.description.slice(0, 220)}</span>}
                </span>
                <span className="data-row-side">
                  <a href={`/api/materials/${material.id}/download`} className="primary-button doc-download">Download</a>
                </span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No chapters on your shelf yet."
            body="When your teacher uploads study material for your class, it will appear here — downloadable."
            action={{ href: "/app/notes", label: "Review your notes instead →" }}
          />
        )}
      </div>
    </main>
  );
}
