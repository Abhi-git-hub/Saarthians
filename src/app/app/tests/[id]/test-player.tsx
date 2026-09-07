"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { startTest, saveAnswer, submitTest } from "./actions";

type Question = {
  id: string;
  type: string;
  prompt: string;
  options_json: unknown;
  points: number;
  position: number;
};

type Props = {
  testId: string;
  durationSeconds: number | null;
  questions: Question[];
  initialAttemptId: string | null;
  initialStartedAt: string | null;
  initialAnswers: Record<string, unknown>;
};

export function TestPlayer({ testId, durationSeconds, questions, initialAttemptId, initialStartedAt, initialAnswers }: Props) {
  const [attemptId, setAttemptId] = useState<string | null>(initialAttemptId);
  const [startedAt, setStartedAt] = useState<string | null>(initialStartedAt);
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);
  const [current, setCurrent] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ score: number; max_score: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const question = questions[current];
  const answeredCount = useMemo(() => questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length, [answers, questions]);
  const unanswered = questions.length - answeredCount;

  useEffect(() => {
    if (!attemptId || !startedAt || !durationSeconds || result) return;
    const end = new Date(startedAt).getTime() + durationSeconds * 1000;
    const tick = () => {
      if (Date.now() >= end) {
        startTransition(async () => {
          const response = await submitTest(attemptId, testId);
          if (response.result) setResult({ score: Number(response.result.score), max_score: Number(response.result.max_score) });
          else setMessage(response.error ?? "Time expired. We couldn't submit the assessment.");
        });
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [attemptId, startedAt, durationSeconds, result, testId]);

  const remaining = useMemo(() => {
    if (!startedAt || !durationSeconds) return null;
    return Math.max(0, Math.ceil((new Date(startedAt).getTime() + durationSeconds * 1000 - Date.now()) / 1000));
  }, [startedAt, durationSeconds]);

  function begin() {
    startTransition(async () => {
      setMessage(null);
      const response = await startTest(testId);
      if (response.error || !response.attemptId) setMessage(response.error ?? "Unable to start test.");
      else {
        setAttemptId(response.attemptId);
        setStartedAt(response.startedAt ?? new Date().toISOString());
      }
    });
  }

  function updateLocal(value: unknown) {
    if (!attemptId || result || !question) return;
    setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: value }));
  }

  function persist(questionId: string, value: unknown) {
    if (!attemptId || result) return;
    setSaving(true);
    startTransition(async () => {
      const response = await saveAnswer({ attemptId, questionId, answer: value });
      setSaving(false);
      if (response.error) setMessage(response.error);
    });
  }

  function finish() {
    if (!attemptId || pending || result) return;
    startTransition(async () => {
      setMessage(null);
      const response = await submitTest(attemptId, testId);
      if (response.error || !response.result) setMessage(response.error ?? "Unable to submit assessment.");
      else setResult({ score: Number(response.result.score), max_score: Number(response.result.max_score) });
    });
  }

  if (!questions.length) {
    return <div style={cardStyle}><h2 style={{ marginTop: 0 }}>This assessment has no questions yet.</h2><p style={{ color: "var(--muted)" }}>Ask your teacher to add questions before publishing it.</p></div>;
  }

  if (!attemptId) {
    return <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", flexWrap: "wrap" }}>
        <div><span className="eyebrow">Ready</span><h2 style={{ margin: "12px 0 8px", fontSize: 26 }}>Work at your pace, within the clock.</h2><p style={{ color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{durationSeconds ? `You have ${Math.ceil(durationSeconds / 60)} minutes once you start.` : "There is no time limit on this assessment."} Your answers are saved as you work and the final score is calculated on the server.</p></div>
        <button type="button" onClick={begin} disabled={pending} style={buttonStyle}>{pending ? "Starting…" : "Start assessment →"}</button>
      </div>
      {message && <p role="alert" style={errorStyle}>{message}</p>}
    </div>;
  }

  if (result) {
    return <div style={{ ...cardStyle, background: "var(--accent)", color: "white" }}>
      <span className="eyebrow" style={{ color: "#dff4c0" }}>Assessment complete</span>
      <h2 style={{ fontSize: 52, letterSpacing: "-.06em", margin: "14px 0 6px" }}>{Math.round(result.score / Math.max(result.max_score, 1) * 100)}%</h2>
      <p style={{ margin: 0, color: "#d5dfdb" }}>Score: {result.score} / {result.max_score}. Your result is stored server-side.</p>
      <Link href="/app/results" style={{ display: "inline-flex", marginTop: 22, borderRadius: 999, padding: "11px 16px", background: "white", color: "var(--ink)", fontWeight: 700 }}>View all results →</Link>
    </div>;
  }

  const options = Array.isArray(question.options_json) ? question.options_json.filter((option): option is string => typeof option === "string") : [];
  const selected = typeof answers[question.id] === "string" ? String(answers[question.id]) : "";
  const formatted = remaining === null ? "No timer" : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;

  return <div style={{ marginTop: 30 }}>
    <div style={{ position: "sticky", top: 12, zIndex: 2, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 16, background: "rgba(247,248,244,.96)", backdropFilter: "blur(12px)" }}>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>Question {current + 1} of {questions.length} · {answeredCount} answered</span>
      <span aria-live="polite" style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{formatted}</span>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 220px", gap: 18, marginTop: 16 }}>
      <article style={cardStyle}>
        <span className="eyebrow">Question {current + 1} · {question.points} pts</span>
        <h2 style={{ fontSize: 26, lineHeight: 1.4, margin: "14px 0 22px" }}>{question.prompt}</h2>
        {options.length ? <div style={{ display: "grid", gap: 10 }}>{options.map((option) => <button type="button" key={option} disabled={pending} onClick={() => { updateLocal(option); persist(question.id, option); }} aria-pressed={selected === option} style={{ ...optionStyle, ...(selected === option ? selectedOptionStyle : {}) }}>{option}</button>)}</div> : <textarea aria-label={`Answer to question ${current + 1}`} value={selected} onChange={(event) => updateLocal(event.target.value)} onBlur={(event) => persist(question.id, event.target.value)} rows={7} placeholder="Write your answer here…" style={textareaStyle} />}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 24 }}>
          <button type="button" disabled={current === 0} onClick={() => setCurrent((n) => n - 1)} style={secondaryButtonStyle}>← Previous</button>
          <span style={{ alignSelf: "center", color: "var(--muted)", fontSize: 13 }}>{saving ? "Saving…" : "Saved automatically"}</span>
          {current < questions.length - 1 ? <button type="button" onClick={() => setCurrent((n) => n + 1)} style={buttonStyle}>Next →</button> : <button type="button" onClick={finish} disabled={pending || unanswered > 0} style={{ ...buttonStyle, opacity: pending || unanswered > 0 ? .55 : 1 }}>{pending ? "Submitting…" : unanswered ? `${unanswered} unanswered` : "Submit assessment →"}</button>}
        </div>
        {message && <p role="alert" style={errorStyle}>{message}</p>}
      </article>

      <aside style={{ ...cardStyle, padding: 18, alignSelf: "start", position: "sticky", top: 80 }}>
        <span className="eyebrow">Navigator</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 7, marginTop: 14 }}>
          {questions.map((q, index) => <button type="button" key={q.id} aria-label={`Go to question ${index + 1}`} aria-current={index === current ? "step" : undefined} onClick={() => setCurrent(index)} style={{ width: "100%", aspectRatio: "1", borderRadius: 10, border: index === current ? "2px solid var(--accent)" : "1px solid var(--line)", background: answers[q.id] !== undefined && answers[q.id] !== "" ? "#eaf0e8" : "white", color: "var(--ink)", fontWeight: 700 }}>{index + 1}</button>)}
        </div>
        <p style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.5, marginBottom: 0 }}>Your progress is tied to this server-owned attempt, so you can leave and resume later while the timer continues.</p>
      </aside>
    </div>
  </div>;
}

const cardStyle = { marginTop: 30, border: "1px solid var(--line)", borderRadius: 22, padding: 26, background: "white" };
const inputBase = { width: "100%", boxSizing: "border-box" as const, border: "1px solid var(--line)", borderRadius: 14, padding: "13px 14px", background: "white", color: "var(--ink)", font: "inherit" };
const optionStyle = { ...inputBase, textAlign: "left" as const, cursor: "pointer", background: "var(--paper)" };
const selectedOptionStyle = { borderColor: "var(--accent)", boxShadow: "0 0 0 2px var(--accent) inset" };
const textareaStyle = { ...inputBase, resize: "vertical" as const, lineHeight: 1.6 };
const buttonStyle = { border: 0, borderRadius: 999, padding: "13px 18px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" };
const secondaryButtonStyle = { ...buttonStyle, background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" };
const errorStyle = { color: "#a33", marginBottom: 0 };
