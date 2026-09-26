import UploadForm from "./upload-form";

export default function NewMaterialPage() {
  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <span className="eyebrow">Study material</span>
      <h1 style={{ fontSize: "clamp(36px,5vw,56px)", lineHeight: 1, letterSpacing: "-.05em", margin: "16px 0 12px" }}>
        Upload a chapter.
      </h1>
      <p style={{ color: "var(--muted)", maxWidth: 640, lineHeight: 1.7, margin: 0 }}>
        The PDF is validated, optimized to save storage, and indexed for search — only after every stage
        succeeds does it become visible to your class.
      </p>
      <UploadForm />
    </main>
  );
}
