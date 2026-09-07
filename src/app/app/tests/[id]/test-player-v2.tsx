"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { startTestV2, saveAnswerV2, submitTestV2 } from "./actions-v2";

type Question = { id: string; type: string; prompt: string; options_json: unknown; points: number; position: number };

type Props = { testId: string; durationSeconds: number | null; questions: Question[]; initialAttemptId: string | null; initialStartedAt: string | null; initialAnswers: Record<string, unknown> };

export function TestPlayerV2({ testId, durationSeconds, questions, initialAttemptId, initialStartedAt, initialAnswers }: Props) {
  const [attemptId, setAttemptId] = useState(initialAttemptId);
  const [startedAt, setStartedAt] = useState(initialStartedAt);
  const [answers, setAnswers] = useState(initialAnswers);
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [result, setResult] = useState<{ score: number; max_score: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const answered = useMemo(() => questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length, [answers, questions]);
  const question = questions[current];

  useEffect(() => {
    if (!attemptId || !startedAt || !durationSeconds || result) return;
    const tick = () => setRemaining(Math.max(0, Math.ceil((new Date(startedAt).getTime() + durationSeconds * 1000 - Date.now()) / 1000)));
    tick(); const id = window.setInterval(tick, 1000); return () => window.clearInterval(id);
  }, [attemptId, startedAt, durationSeconds, result]);

  useEffect(() => {
    if (remaining !== 0 || !attemptId || result) return;
    startTransition(async () => {
      const response = await submitTestV2(attemptId, testId);
      if (response.result) setResult({ score: Number(response.result.score), max_score: Number(response.result.max_score) });
      else setMessage(response.error ?? "Time expired. We couldn't submit the assessment.");
    });
  }, [remaining, attemptId, result, testId]);

  const begin = () => startTransition(async () => {
    const response = await startTestV2(testId);
    if (response.error || !response.attemptId) setMessage(response.error ?? "Unable to start test.");
    else { setAttemptId(response.attemptId); setStartedAt(response.startedAt); }
  });
  const save = (questionId: string, answer: unknown) => startTransition(async () => {
    const response = await saveAnswerV2({ attemptId: attemptId!, questionId, answer });
    if (response.error) setMessage(response.error);
  });
  const submit = () => startTransition(async () => {
    const response = await submitTestV2(attemptId!, testId);
    if (response.result) setResult({ score: Number(response.result.score), max_score: Number(response.result.max_score) });
    else setMessage(response.error ?? "Unable to submit assessment.");
  });

  if (!questions.length) return <div style={card}><h2>No questions yet.</h2><p style={muted}>Ask your teacher to add questions before publishing.</p></div>;
  if (!attemptId) return <div style={card}><span className="eyebrow">Ready</span><h2 style={{ margin: "12px 0 8px" }}>A focused assessment, one question at a time.</h2><p style={muted}>{durationSeconds ? `You have ${Math.ceil(durationSeconds / 60)} minutes once you start.` : "There is no time limit."} Your answers are saved as you work.</p><button type="button" onClick={begin} disabled={pending} style={button}>{pending ? "Starting…" : "Start assessment →"}</button>{message && <p role="alert" style={error}>{message}</p>}</div>;
  if (result) return <div style={{ ...card, background: "var(--accent)", color: "white" }}><span className="eyebrow" style={{ color: "#dff4c0" }}>Assessment complete</span><h2 style={{ fontSize: 52, margin: "12px 0 6px" }}>{Math.round(result.score / Math.max(result.max_score, 1) * 100)}%</h2><p style={{ color: "#d5dfdb" }}>Score: {result.score} / {result.max_score}.</p><Link href="/app/results" style={{ display: "inline-flex", marginTop: 14, borderRadius: 999, padding: "10px 15px", background: "white", color: "var(--ink)", fontWeight: 700 }}>View results →</Link></div>;

  const options = Array.isArray(question.options_json) ? question.options_json.filter((x): x is string => typeof x === "string") : [];
  const value = typeof answers[question.id] === "string" ? String(answers[question.id]) : "";
  const clock = remaining === null ? "No timer" : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  return <div style={{ marginTop: 30 }}><div style={bar}><span>Question {current + 1} of {questions.length} · {answered} answered</span><strong aria-live="polite">{clock}</strong></div><div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 220px", gap: 18, marginTop: 16 }}><article style={card}><span className="eyebrow">Question {current + 1} · {question.points} pts</span><h2 style={{ fontSize: 27, lineHeight: 1.4 }}>{question.prompt}</h2>{options.length ? <div style={{ display: "grid", gap: 10 }}>{options.map((option) => <button key={option} type="button" onClick={() => { setAnswers((a) => ({ ...a, [question.id]: option })); save(question.id, option); }} aria-pressed={value === option} style={{ ...optionStyle, ...(value === option ? selected : {}) }}>{option}</button>)}</div> : <textarea rows={8} value={value} onChange={(e) => setAnswers((a) => ({ ...a, [question.id]: e.target.value }))} onBlur={(e) => save(question.id, e.target.value)} style={textarea} placeholder="Write your answer here…" />}<div style={actions}><button type="button" disabled={current === 0} onClick={() => setCurrent((n) => n - 1)} style={secondary}>← Previous</button><span style={muted}>{pending ? "Saving…" : "Saved"}</span>{current < questions.length - 1 ? <button type="button" onClick={() => setCurrent((n) => n + 1)} style={button}>Next →</button> : <button type="button" onClick={submit} disabled={pending || answered !== questions.length} style={{ ...button, opacity: pending || answered !== questions.length ? .55 : 1 }}>{answered !== questions.length ? `${questions.length - answered} unanswered` : "Submit assessment →"}</button>}</div>{message && <p role="alert" style={error}>{message}</p>}</article><aside style={{ ...card, padding: 18, marginTop: 0, position: "sticky", top: 80, alignSelf: "start" }}><span className="eyebrow">Navigator</span><div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 7, marginTop: 14 }}>{questions.map((q, i) => <button key={q.id} type="button" onClick={() => setCurrent(i)} aria-current={i === current ? "step" : undefined} style={{ aspectRatio: "1", borderRadius: 10, border: i === current ? "2px solid var(--accent)" : "1px solid var(--line)", background: answers[q.id] !== undefined && answers[q.id] !== "" ? "#eaf0e8" : "white", fontWeight: 700 }}>{i + 1}</button>)}</div></aside></div></div>;
}

const card = { marginTop: 30, border: "1px solid var(--line)", borderRadius: 22, padding: 26, background: "white" };
const bar = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", border: "1px solid var(--line)", borderRadius: 16, background: "var(--paper)", fontSize: 13, color: "var(--muted)" };
const muted = { color: "var(--muted)", lineHeight: 1.6 };
const input = { width: "100%", boxSizing: "border-box" as const, border: "1px solid var(--line)", borderRadius: 14, padding: "13px 14px", background: "white", color: "var(--ink)", font: "inherit" };
const optionStyle = { ...input, textAlign: "left" as const, cursor: "pointer", background: "var(--paper)" };
const selected = { borderColor: "var(--accent)", boxShadow: "0 0 0 2px var(--accent) inset" };
const textarea = { ...input, resize: "vertical" as const, lineHeight: 1.6 };
const button = { border: 0, borderRadius: 999, padding: "13px 18px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" };
const secondary = { ...button, color: "var(--ink)", background: "var(--paper)", border: "1px solid var(--line)" };
const actions = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginTop: 24 };
const error = { color: "#a33" };
