"use client";

import { useMemo, useState, useTransition } from "react";
import { recordSimpleScore } from "@/lib/teacher-test";

// One screen, one job: student → subject → obtained / total → saved.
// Validation mirrors the server contract so mistakes surface instantly;
// the server re-checks everything anyway.
export function RecordMarksForm({
  roster,
}: {
  roster: Array<{ studentId: string; displayName: string; gradeLevel: string | null }>;
}) {
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [obtained, setObtained] = useState("");
  const [total, setTotal] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return roster.slice(0, 8);
    return roster.filter((s) => `${s.displayName} ${s.gradeLevel ?? ""}`.toLowerCase().includes(term)).slice(0, 8);
  }, [roster, search]);

  const picked = roster.find((s) => s.studentId === studentId) ?? null;

  function save() {
    setNotice(null);
    setDone(null);
    if (!picked) {
      setNotice("Pick a student from the list first.");
      return;
    }
    if (subject.trim().length < 1 || subject.trim().length > 100) {
      setNotice("Type the subject (1–100 characters).");
      return;
    }
    const got = Number(obtained);
    const max = Number(total);
    if (obtained.trim() === "" || !Number.isFinite(got) || got < 0) {
      setNotice("Enter marks obtained (0 or more).");
      return;
    }
    if (total.trim() === "" || !Number.isFinite(max) || max <= 0 || max > 10000) {
      setNotice("Enter total marks (more than 0).");
      return;
    }
    if (got > max) {
      setNotice(`Obtained (${got}) cannot exceed total (${max}).`);
      return;
    }
    startTransition(async () => {
      try {
        await recordSimpleScore({ studentId: picked.studentId, subject: subject.trim(), obtained: got, total: max });
        setDone(`${picked.displayName} · ${subject.trim()} · ${got} / ${max} recorded.`);
        setSubject("");
        setObtained("");
        setTotal("");
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Could not record the score.");
      }
    });
  }

  return (
    <div style={{ marginTop: 26, display: "grid", gap: 18 }}>
      <section style={{ border: "1px solid var(--line)", borderRadius: 20, padding: 22, background: "white" }}>
        <span className="eyebrow">Step 1 · Student</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or class…"
          aria-label="Search students"
          style={{ ...inputStyle, marginTop: 12 }}
        />
        <div style={{ display: "grid", marginTop: 6 }} role="listbox" aria-label="Matching students">
          {matches.map((s) => (
            <button
              key={s.studentId}
              type="button"
              role="option"
              aria-selected={picked?.studentId === s.studentId}
              onClick={() => setStudentId(s.studentId)}
              style={{
                ...rowStyle,
                ...(picked?.studentId === s.studentId ? pickedStyle : {}),
              }}
            >
              <strong>{s.displayName}</strong>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>{s.gradeLevel ?? "Class not set"}</span>
            </button>
          ))}
          {!matches.length && <p style={{ color: "var(--muted)" }}>No students match that search.</p>}
        </div>
      </section>

      <section style={{ border: "1px solid var(--line)", borderRadius: 20, padding: 22, background: "white" }}>
        <span className="eyebrow">Step 2 · Subject & marks</span>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <label style={labelStyle}>
            Subject
            <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={100} placeholder="e.g. Mathematics" style={inputStyle} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={labelStyle}>
              Obtained
              <input value={obtained} onChange={(e) => setObtained(e.target.value)} inputMode="decimal" placeholder="e.g. 42" style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Total
              <input value={total} onChange={(e) => setTotal(e.target.value)} inputMode="decimal" placeholder="e.g. 50" style={inputStyle} />
            </label>
          </div>
        </div>
      </section>

      {notice && <p role="alert" style={{ color: "#a33", margin: 0 }}>{notice}</p>}
      {done && <p role="status" style={{ color: "var(--accent)", margin: 0, fontWeight: 700 }}>{done}</p>}
      <div>
        <button type="button" onClick={save} disabled={pending} style={buttonStyle}>
          {pending ? "Recording…" : "Record marks →"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", boxSizing: "border-box" as const, border: "1px solid var(--line)", borderRadius: 14, padding: "13px 14px", background: "white", color: "var(--ink)", font: "inherit" };
const buttonStyle = { border: 0, borderRadius: 999, padding: "14px 22px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" };
const labelStyle = { display: "grid", gap: 8, fontWeight: 700, fontSize: 14 };
const rowStyle = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", width: "100%", textAlign: "left" as const, background: "transparent", border: 0, borderTop: "1px solid var(--line)", padding: "13px 4px", cursor: "pointer", font: "inherit", color: "var(--ink)" };
const pickedStyle = { background: "#eef4ee", borderRadius: 12, paddingLeft: 12, paddingRight: 12 };
