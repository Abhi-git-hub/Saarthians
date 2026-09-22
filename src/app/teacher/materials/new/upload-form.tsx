"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UploadResult =
  | { ok: true; materialId: string }
  | { ok: false; error: string };

// Uploads straight to the Route Handler (Server Actions cap payloads far
// below the 15 MB product limit) and reports the measured pipeline result.
export default function UploadForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/teacher/materials/upload", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const json = (await response.json()) as { material?: { id: string }; error?: string; materialId?: string };
      if (response.ok && json.material) {
        setResult({ ok: true, materialId: json.material.id });
        router.push(`/teacher/materials/${json.material.id}`);
        return;
      }
      setResult({ ok: false, error: prettify(json.error ?? "UPLOAD_FAILED") });
    } catch {
      setResult({ ok: false, error: "The upload could not be completed. Check your connection and retry." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 14, maxWidth: 640, marginTop: 28 }}>
      <label style={labelStyle}>Title<input name="title" required maxLength={200} placeholder="Class 10 Physics — Light" style={inputStyle} /></label>
      <label style={labelStyle}>Subject<input name="subject" maxLength={100} placeholder="Physics" style={inputStyle} /></label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <label style={labelStyle}>Class / grade<input name="gradeLevel" maxLength={50} placeholder="Class 10" style={inputStyle} /></label>
        <label style={labelStyle}>Chapter / topic<input name="chapter" maxLength={200} placeholder="Light — Reflection" style={inputStyle} /></label>
      </div>
      <label style={labelStyle}>Description<textarea name="description" maxLength={2000} rows={3} placeholder="What should students focus on?" style={inputStyle} /></label>
      <label style={labelStyle}>PDF file (max 15 MB)<input name="file" type="file" accept="application/pdf,.pdf" required style={inputStyle} /></label>
      <button type="submit" disabled={busy} style={{ ...buttonStyle, opacity: busy ? 0.6 : 1 }}>
        {busy ? "Validating, optimizing, indexing…" : "Upload and process →"}
      </button>
      {result && !result.ok && (
        <p role="alert" style={{ color: "#b42318", margin: 0, lineHeight: 1.6 }}>{result.error}</p>
      )}
      {busy && (
        <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
          Keep this tab open. Large PDFs take a minute: the file is optimized before it is stored, then read page by page.
        </p>
      )}
    </form>
  );
}

function prettify(code: string): string {
  const [kind, detail] = code.split(/: (.+)/);
  const base: Record<string, string> = {
    EMPTY_FILE: "The selected file is empty.",
    FILE_TOO_LARGE: "That PDF is over the 15 MB limit. Split it by chapter and upload in parts.",
    INVALID_METADATA: "Give the material a title (max 200 characters).",
    INVALID_PDF: "That file is not a readable PDF.",
    NOT_A_PDF: "That file is not a PDF — the file signature does not match.",
    ENCRYPTED_PDF: "Password-protected PDFs cannot be processed. Remove the password and retry.",
    EXTRACTION_FAILED: "The PDF text could not be read.",
    NO_READABLE_TEXT: "No readable text was found — scanned or image-only PDFs are not supported yet.",
    EMBEDDING_FAILED: "The search index could not be built right now. Retry in a minute.",
    STORAGE_UPLOAD_FAILED: "The file could not be stored. Retry.",
  };
  const friendly = base[kind] ?? "Processing failed. Retry, or upload a different PDF.";
  return detail ? `${friendly} (${detail})` : friendly;
}

const labelStyle = { display: "grid", gap: 8, fontSize: 14, fontWeight: 650 };
const inputStyle = { border: "1px solid var(--line)", borderRadius: 14, padding: "13px 14px", background: "white", color: "var(--ink)", font: "inherit", lineHeight: 1.6 };
const buttonStyle = { border: 0, borderRadius: 999, padding: "13px 20px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" };
