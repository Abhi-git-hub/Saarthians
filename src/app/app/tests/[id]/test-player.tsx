"use client";

import { useMemo, useState, useTransition } from "react";
import { startTest, saveAnswer, submitTest } from "./actions";

type Question = {
  id: string;
  type: string;
  prompt: string;
  options_json: unknown;
  points: number;
  position: number;
};

export function TestPlayer({ testId, questions }: { testId: string; questions: Question[] }) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; max_score: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const started = Boolean(attemptId);
  const unanswered = useMemo(() => questions.filter((q) => !answers[q.id]).length, [answers, questions]);

  function begin() {
    startTransition(async () => {
      setMessage(null);
      const response = await startTest(testId);
      if (response.error || !response.attemptId) setMessage(response.error ?? "Unable to start test.");
      else setAttemptId(response.attemptId);
    });
  }

  function choose(questionId: string, value: string) {
    if (!attemptId || pending || result) return;
    setAnswers((current) => ({ ...current, [questionId]: value }));
    startTransition(async () => {
      const response = await saveAnswer({ attemptId, questionId, answer: value });
      if (response.error) setMessage(response.error);
    });
  }

  function finish() {
    if (!attemptId || pending || result) return;
    startTransition(async () => {
      setMessage(null);
      const response = await submitTest(attemptId, testId);
      if (response.error || !response.result) setMessage(response.error ?? "Unable to submit test.");
      else setResult({ score: Number(response.result.score), max_score: Number(response.result.max_score) });
    });
  }

  if (!started) {
    return <div style={{ marginTop: 30, border: "1px solid var(--line)", borderRadius: 22, padding: 26, background: "white" }}>
      <h2 style={{ margin: 0, fontSize: 22 }}>Ready when you are.</h2>
      <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>Starting creates a server-owned attempt. Your answers are saved as you work.</p>
      {message && <p role="alert" style={{ color: "#a33" }}>{message}</p>}
      <button type="button" onClick={begin} disabled={pending} style={buttonStyle}>{pending ? "Starting…" : "Start assessment →"}</button>
    </div>;
  }

  return <div style={{ marginTop: 30 }}>
    {questions.map((question, index) => {
      const options = Array.isArray(question.options_json) ? question.options_json.filter((option): option is string => typeof option === "string") : [];
      return <article key={question.id} style={{ border: "1px solid var(--line)", borderRadius: 20, padding: 24, background: "white", marginBottom: 14 }}>
        <span className="eyebrow">Question {index + 1} · {question.points} pts</span>
        <h2 style={{ fontSize: 20, lineHeight: 1.45, margin: "14px 0 18px" }}>{question.prompt}</h2>
        {options.length ? <div style={{ display: "grid", gap: 10 }}>{options.map((option) => <button type="button" key={option} onClick={() => choose(question.id, option)} aria-pressed={answers[question.id] === option} style={{ ...optionStyle, ...(answers[question.id] === option ? selectedOptionStyle : {}) }}>{option}</button>)}</div> : <input aria-label={`Answer to question ${index + 1}`} value={answers[question.id] ?? ""} onChange={(event) => choose(question.id, event.target.value)} placeholder="Your answer" style={inputStyle} />}
      </article>;
    })}
    {message && <p role="alert" style={{ color: "#a33" }}>{message}</p>}
    {result ? <div style={{ borderRadius: 22, padding: 26, background: "var(--accent)", color: "white" }}><span className="eyebrow" style={{ color: "#dff4c0" }}>Graded</span><h2 style={{ margin: "10px 0", fontSize: 34, letterSpacing: "-.05em" }}>{Math.round(result.score / Math.max(result.max_score, 1) * 100)}%</h2><p style={{ color: "#d5dfdb", margin: 0 }}>Score: {result.score} / {result.max_score}. Your result is stored server-side.</p></div> : <button type="button" onClick={finish} disabled={pending || unanswered > 0} style={{ ...buttonStyle, opacity: pending || unanswered > 0 ? .55 : 1 }}>{pending ? "Submitting…" : unanswered ? `${unanswered} unanswered` : "Submit assessment →"}</button>}
  </div>;
}

const inputStyle = { width: "100%", boxSizing: "border-box" as const, border: "1px solid var(--line)", borderRadius: 14, padding: "13px 14px", background: "white", color: "var(--ink)", font: "inherit" };
const optionStyle = { ...inputStyle, textAlign: "left" as const, cursor: "pointer", background: "var(--paper)" };
const selectedOptionStyle = { borderColor: "var(--accent)", boxShadow: "0 0 0 2px var(--accent) inset" };
const buttonStyle = { border: 0, borderRadius: 999, padding: "14px 20px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" };
