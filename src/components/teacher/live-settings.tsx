"use client";

import { useState, useTransition } from "react";
import { scheduleTeacherTest } from "@/lib/teacher-test";

// Live window + assessment PDF for one test. datetime-local values are
// converted to ISO instants; the server RPC is the authority on validity.
export function LiveSettings({
  testId,
  initialStart,
  initialEnd,
  initialAssessment,
}: {
  testId: string;
  initialStart: string | null;
  initialEnd: string | null;
  initialAssessment: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<string | null>(initialAssessment);
  const [busyFile, setBusyFile] = useState(false);

  function toLocal(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function onSchedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const start = String(form.get("start") ?? "");
    const end = String(form.get("end") ?? "");
    startTransition(async () => {
      try {
        await scheduleTeacherTest({
          testId,
          startTime: start ? new Date(start).toISOString() : null,
          endTime: end ? new Date(end).toISOString() : null,
        });
        setMessage("Live window saved. Students enter only inside the window — server time decides.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not save the window.");
      }
    });
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusyFile(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch(`/api/teacher/tests/${testId}/assessment`, { method: "POST", body: form });
      const json = (await response.json()) as { path?: string; error?: string };
      if (!response.ok) throw new Error(json.error ?? "UPLOAD_FAILED");
      setAssessment(json.path ?? "uploaded");
      setMessage("Assessment PDF attached. Students can open it only inside the live window.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusyFile(false);
      event.target.value = "";
    }
  }

  async function removeAssessment() {
    if (!window.confirm("Remove the assessment PDF?")) return;
    setMessage(null);
    const response = await fetch(`/api/teacher/tests/${testId}/assessment`, { method: "DELETE" });
    if (response.ok) {
      setAssessment(null);
      setMessage("Assessment PDF removed.");
    } else {
      setMessage("Could not remove the PDF.");
    }
  }

  return (
    <section style={{ border: "1px solid var(--line)", borderRadius: 20, padding: 22, background: "white", marginTop: 26 }}>
      <span className="eyebrow">Live window</span>
      <form onSubmit={onSchedule} style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14, alignItems: "end" }}>
        <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 650 }}>
          Opens at
          <input name="start" type="datetime-local" defaultValue={toLocal(initialStart)} style={inputStyle} />
        </label>
        <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 650 }}>
          Closes at
          <input name="end" type="datetime-local" defaultValue={toLocal(initialEnd)} style={inputStyle} />
        </label>
        <button type="submit" disabled={pending} style={buttonStyle}>{pending ? "Saving…" : "Save window →"}</button>
      </form>
      <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>Empty = open-ended. Published tests open automatically at the start and close at the end.</p>

      <div style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 18 }}>
        <span className="eyebrow">Assessment PDF (optional)</span>
        <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
          A reference PDF students may open during the live window. Never upload answer keys here.
        </p>
        {assessment ? (
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 10 }}>
            <span style={{ fontSize: 14 }}>Attached ✓</span>
            <button type="button" onClick={removeAssessment} style={ghostStyle}>Remove</button>
          </div>
        ) : (
          <label style={{ display: "inline-block", marginTop: 10, ...buttonStyle, opacity: busyFile ? 0.6 : 1 }}>
            {busyFile ? "Uploading…" : "Attach PDF →"}
            <input type="file" accept="application/pdf,.pdf" onChange={onFile} disabled={busyFile} style={{ display: "none" }} />
          </label>
        )}
      </div>
      {message && <p role="status" style={{ margin: "14px 0 0", lineHeight: 1.6 }}>{message}</p>}
    </section>
  );
}

const inputStyle = { border: "1px solid var(--line)", borderRadius: 12, padding: "10px 12px", font: "inherit", color: "var(--ink)", background: "white" };
const buttonStyle = { border: 0, borderRadius: 999, padding: "11px 18px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" };
const ghostStyle = { border: "1px solid var(--line)", borderRadius: 999, padding: "9px 15px", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 13 };
