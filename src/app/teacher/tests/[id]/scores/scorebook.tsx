"use client";

import { useState, useTransition } from "react";
import { recordStudentScore, setTestMaxMarks } from "@/lib/teacher-test";

// Scorebook: one row per assigned student, marks saved individually.
// Corrections overwrite that student's record for this test (the RPC keeps
// a single graded attempt per student per test).
export function Scorebook({
  testId,
  maxMarks,
  roster,
}: {
  testId: string;
  maxMarks: number | null;
  roster: Array<{
    studentId: string;
    displayName: string;
    recorded: { score: number | null; max: number | null; at: string | null } | null;
  }>;
}) {
  const [pending, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [notices, setNotices] = useState<Record<string, string>>({});
  const [maxDraft, setMaxDraft] = useState(maxMarks === null ? "" : String(maxMarks));
  const [ceiling, setCeiling] = useState<number | null>(maxMarks);
  const [maxNotice, setMaxNotice] = useState<string | null>(null);

  function saveMax() {
    const value = maxDraft.trim() === "" ? null : Number(maxDraft);
    if (value !== null && (!Number.isFinite(value) || value <= 0 || value > 10000)) {
      setMaxNotice("Enter max marks between 1 and 10000, or leave empty.");
      return;
    }
    setMaxNotice(null);
    startTransition(async () => {
      try {
        await setTestMaxMarks({ testId, maxMarks: value });
        setCeiling(value);
        setMaxNotice(value === null ? "Max marks cleared." : `Max marks set to ${value}.`);
      } catch (error) {
        setMaxNotice(error instanceof Error ? error.message : "Could not save max marks.");
      }
    });
  }

  function saveScore(studentId: string) {
    const raw = (drafts[studentId] ?? "").trim();
    if (raw === "") {
      setNotices((n) => ({ ...n, [studentId]: "Enter marks first." }));
      return;
    }
    const score = Number(raw);
    if (!Number.isFinite(score) || score < 0) {
      setNotices((n) => ({ ...n, [studentId]: "Marks must be 0 or more." }));
      return;
    }
    if (ceiling !== null && score > ceiling) {
      setNotices((n) => ({ ...n, [studentId]: `Above max marks (${ceiling}).` }));
      return;
    }
    setSavingId(studentId);
    startTransition(async () => {
      try {
        await recordStudentScore({ testId, studentId, score });
        setNotices((n) => ({ ...n, [studentId]: `Saved ${score}${ceiling !== null ? ` / ${ceiling}` : ""}.` }));
        setDrafts((d) => ({ ...d, [studentId]: "" }));
      } catch (error) {
        setNotices((n) => ({ ...n, [studentId]: error instanceof Error ? error.message : "Could not save." }));
      } finally {
        setSavingId(null);
      }
    });
  }

  return (
    <div style={{ marginTop: 26, display: "grid", gap: 18 }}>
      <section style={{ border: "1px solid var(--line)", borderRadius: 20, padding: 22, background: "white" }}>
        <span className="eyebrow">Step 1 · Max marks</span>
        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={maxDraft}
            onChange={(e) => setMaxDraft(e.target.value)}
            inputMode="decimal"
            placeholder={ceiling === null ? "e.g. 50" : String(ceiling)}
            aria-label="Max marks for this test"
            style={inputStyle}
          />
          <button type="button" onClick={saveMax} disabled={pending} style={buttonStyle}>Save max →</button>
        </div>
        {maxNotice && <p role="status" style={{ color: "var(--muted)", margin: "10px 0 0" }}>{maxNotice}</p>}
      </section>

      <section style={{ border: "1px solid var(--line)", borderRadius: 20, padding: 22, background: "white" }}>
        <span className="eyebrow">Step 2 · Student scores</span>
        {!roster.length && <p style={{ color: "var(--muted)" }}>No assigned students yet.</p>}
        <div style={{ display: "grid", marginTop: 6 }}>
          {roster.map((row) => {
            const notice = notices[row.studentId];
            const recorded = row.recorded;
            return (
              <article key={row.studentId} style={{ borderTop: "1px solid var(--line)", padding: "16px 0", display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 17 }}>{row.displayName}</strong>
                  <span style={{ color: "var(--muted)", fontSize: 13 }}>
                    {recorded && recorded.score !== null
                      ? `Recorded: ${recorded.score}${recorded.max !== null ? ` / ${recorded.max}` : ""}`
                      : "No score yet"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    value={drafts[row.studentId] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [row.studentId]: e.target.value }))}
                    inputMode="decimal"
                    placeholder={ceiling !== null ? `0 – ${ceiling}` : "Marks"}
                    aria-label={`Marks for ${row.displayName}`}
                    style={{ ...inputStyle, maxWidth: 160 }}
                  />
                  <button
                    type="button"
                    onClick={() => saveScore(row.studentId)}
                    disabled={pending && savingId === row.studentId}
                    style={buttonStyle}
                  >
                    {pending && savingId === row.studentId ? "Saving…" : "Save score →"}
                  </button>
                </div>
                {notice && <p role="status" style={{ color: "var(--muted)", margin: 0, fontSize: 14 }}>{notice}</p>}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const inputStyle = { border: "1px solid var(--line)", borderRadius: 14, padding: "12px 14px", background: "white", color: "var(--ink)", font: "inherit", lineHeight: 1.5 };
const buttonStyle = { border: 0, borderRadius: 999, padding: "12px 18px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" };
