"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Delightful uploader: big drop zone, immediate file chip, then an honest
// staged display (Validate → Optimize → Extract → Index → Ready) that
// advances while the server works and resolves to the REAL measured result.
// Stages are activity indicators, not fake progress percentages.

const STAGES = ["Validate", "Optimize", "Extract", "Index", "Ready"] as const;

type UploadResult = { ok: true; materialId: string } | { ok: false; error: string };

export default function UploadForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);

  function pick(files: FileList | null) {
    const next = files?.[0] ?? null;
    if (next) {
      setFile(next);
      setResult(null);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    setResult(null);
    setStage(0);
    // Advance the activity indicator while the server works. Timings are
    // illustrative of pipeline order only — completion comes from the
    // response, never from this timer.
    const ticker = window.setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 2)), 4000);
    const startedAt = Date.now();
    const fileSizeMb = file ? (file.size / 1024 / 1024).toFixed(1) : "?";
    try {
      const form = new FormData(event.currentTarget);
      form.set("file", file);
      const response = await fetch("/api/teacher/materials/upload", { method: "POST", body: form });
      const contentType = response.headers.get("content-type") ?? "";
      // A non-JSON answer (proxy/edge HTML error page) used to surface as a
      // cryptic connection failure — report what actually came back instead.
      const json = contentType.includes("application/json")
        ? ((await response.json()) as { material?: { id: string }; error?: string })
        : null;
      window.clearInterval(ticker);
      if (response.ok && json?.material) {
        setStage(STAGES.length - 1);
        setResult({ ok: true, materialId: json.material.id });
        window.setTimeout(() => router.push(`/teacher/materials/${json.material!.id}`), 900);
        return;
      }
      if (json?.error) {
        setResult({ ok: false, error: prettify(json.error) });
        return;
      }
      setResult({
        ok: false,
        error: `The server answered HTTP ${response.status} without details after ${Math.round((Date.now() - startedAt) / 1000)}s (file ${fileSizeMb} MB). Note this down and retry — if it repeats, contact support with the time.`,
      });
    } catch {
      window.clearInterval(ticker);
      const secs = Math.round((Date.now() - startedAt) / 1000);
      setResult({
        ok: false,
        error: `The upload was interrupted after ${secs}s (file ${fileSizeMb} MB). Check your connection and retry — your file was not stored. Large files on slow networks need an uninterrupted tab.`,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="upload-form">
      <div className="upload-grid">
        <label className="upload-field">Title<input name="title" required maxLength={200} placeholder="Class 10 Physics — Light" /></label>
        <label className="upload-field">Subject<input name="subject" maxLength={100} placeholder="Physics" /></label>
        <label className="upload-field">Class / grade<input name="gradeLevel" maxLength={50} placeholder="Class 10" /></label>
        <label className="upload-field">Chapter / topic<input name="chapter" maxLength={200} placeholder="Light — Reflection" /></label>
      </div>
      <label className="upload-field">Description<textarea name="description" maxLength={2000} rows={2} placeholder="What should students focus on?" /></label>
      <div
        className={`dropzone${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Drop a PDF or Word file here or choose one"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
      >
        <input
          ref={fileRef}
          name="file"
          type="file"
          accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
          required={!file}
          hidden
          onChange={(e) => pick(e.target.files)}
        />
        {file ? (
          <span className="dropzone-file"><b>{file.name}</b><i>{(file.size / 1024 / 1024).toFixed(1)} MB · {file.name.toLowerCase().endsWith(".docx") ? "Word" : "PDF"}</i></span>
        ) : (
          <span className="dropzone-empty"><b>Drop your PDF or Word file here</b><i>or click to choose · max 15 MB · PDFs are indexed for search + tutor; Word files are stored for download</i></span>
        )}
      </div>
      {(busy || (result?.ok ?? false)) && (
        <ol className="pipeline-steps" aria-label="Processing stages">
          {STAGES.map((label, i) => (
            <li key={label} className={i < stage ? "is-done" : i === stage ? "is-active" : ""} aria-current={i === stage ? "step" : undefined}>
              <b>{String(i + 1).padStart(2, "0")}</b> {label}
            </li>
          ))}
        </ol>
      )}
      <button type="submit" disabled={busy || !file} className="primary-button upload-submit">
        {busy ? "Working through the pipeline…" : result?.ok ? "Ready — opening your material…" : "Upload and process →"}
      </button>
      {result && !result.ok && <p role="alert" className="upload-error">{result.error}</p>}
      {busy && (
        <p className="upload-note">Keep this tab open. Large PDFs take a minute: the file is optimized before it is stored, then read page by page.</p>
      )}
    </form>
  );
}

function prettify(code: string): string {
  const [kind, detail] = code.split(/: (.+)/);
  // NO_READABLE_TEXT carries measured diagnostics + next steps generated by
  // our own pipeline (never user input) — show it whole, not the generic.
  if (kind === "NO_READABLE_TEXT" && detail) return detail;
  // Inner validation codes already read as complete sentences.
  if (detail && /^(LEGACY_DOC|NOT_A_FILE|INVALID_EXTENSION|NOT_A_PDF|ENCRYPTED_PDF|EMPTY_FILE|FILE_TOO_LARGE):?\s*/.test(detail)) {
    return detail.replace(/^(LEGACY_DOC|NOT_A_FILE|INVALID_EXTENSION|NOT_A_PDF|ENCRYPTED_PDF|EMPTY_FILE|FILE_TOO_LARGE):?\s*/, "");
  }
  const base: Record<string, string> = {
    EMPTY_FILE: "The selected file is empty.",
    FILE_TOO_LARGE: "That PDF is over the 15 MB limit. Split it by chapter and upload in parts.",
    INVALID_METADATA: "Give the material a title (max 200 characters).",
    INVALID_PDF: "That file is not a readable PDF or Word document.",
    LEGACY_DOC: "Old .doc files cannot be stored — open it in Word or Docs and save as .docx first.",
    NOT_A_FILE: "That file is neither a PDF nor a Word document. Upload a .pdf or .docx file.",
    INVALID_EXTENSION: "Upload a .pdf or .docx file.",
    NOT_A_PDF: "That file is not a PDF — the file signature does not match.",
    ENCRYPTED_PDF: "Password-protected PDFs cannot be processed. Remove the password and retry.",
    EXTRACTION_FAILED: "The PDF text could not be read.",
    NO_READABLE_TEXT: "No readable text was found — scanned or image-only PDFs are not supported yet.",
    OCR_FAILED: "Text conversion failed for this scanned file. Retry in a minute, or upload a text-based PDF.",
    EMBEDDING_FAILED: "The search index could not be built right now. Retry in a minute.",
    STORAGE_UPLOAD_FAILED: "The file could not be stored. Retry.",
  };
  const friendly = base[kind] ?? "Processing failed. Retry, or upload a different PDF.";
  return detail ? `${friendly} (${detail})` : friendly;
}
