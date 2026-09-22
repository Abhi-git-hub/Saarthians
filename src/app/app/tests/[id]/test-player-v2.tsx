"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { startTestV2, saveAnswerV2, submitTestV2, logSecurityEventV2 } from "./actions-v2";

type Question = { id: string; type: string; prompt: string; options_json: unknown; points: number; position: number };

type Props = {
  testId: string;
  durationSeconds: number | null;
  deadlineAt: string | null;
  questions: Question[];
  initialAttemptId: string | null;
  initialStartedAt: string | null;
  initialDeadlineAt: string | null;
  initialAnswers: Record<string, unknown>;
};

// Deterministic shuffle: stable per attempt across refreshes, so the
// anti-cheating order cannot be reshuffled by reloading. Grading is by
// question id, so order never affects scoring.
function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], seed: string): T[] {
  const random = mulberry32(hashSeed(seed));
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type SubmitReason = "manual" | "auto_deadline" | "auto_leave";

export function TestPlayerV2({ testId, durationSeconds, deadlineAt, questions, initialAttemptId, initialStartedAt, initialDeadlineAt, initialAnswers }: Props) {
  const [attemptId, setAttemptId] = useState(initialAttemptId);
  const [startedAt, setStartedAt] = useState(initialStartedAt);
  const [attemptDeadline, setAttemptDeadline] = useState(initialDeadlineAt ?? deadlineAt);
  const [answers, setAnswers] = useState(initialAnswers);
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [result, setResult] = useState<{ score: number; max_score: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const lastSaveAt = useRef<Record<string, number>>({});
  const lastEventAt = useRef<Record<string, number>>({});
  const finalizedRef = useRef(false);

  const seed = attemptId ?? `pending-${testId}`;
  const orderedQuestions = useMemo(() => shuffled(questions, `q-${seed}`), [questions, seed]);
  const orderedOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const q of questions) {
      const options = Array.isArray(q.options_json) ? q.options_json.filter((x): x is string => typeof x === "string") : [];
      map[q.id] = shuffled(options, `o-${seed}-${q.id}`);
    }
    return map;
  }, [questions, seed]);

  const answered = useMemo(() => orderedQuestions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length, [answers, orderedQuestions]);
  const question = orderedQuestions[current];

  // Server-authoritative clock: the attempt deadline (duration ∩ live window,
  // stamped by the RPC) wins; duration-only countdown is a fallback display.
  const clockTarget = useMemo(() => {
    if (!attemptId || result) return null;
    const deadlineMs = attemptDeadline ? new Date(attemptDeadline).getTime() : null;
    const durationMs =
      startedAt && durationSeconds ? new Date(startedAt).getTime() + durationSeconds * 1000 : null;
    return deadlineMs ?? durationMs;
  }, [attemptId, result, attemptDeadline, startedAt, durationSeconds]);

  useEffect(() => {
    if (clockTarget === null) return;
    const tick = () => setRemaining(Math.max(0, Math.ceil((clockTarget - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [clockTarget]);

  type SecurityEvent =
    | "visibility_hidden"
    | "visibility_visible"
    | "focus_blur"
    | "focus_focus"
    | "fullscreen_exit"
    | "fullscreen_enter"
    | "heartbeat"
    | "leave_finalize"
    | "signout_finalize"
    | "deadline_finalize";

  function logEvent(event: SecurityEvent, metadata?: Record<string, unknown>) {
    if (!attemptId || result) return;
    const now = Date.now();
    if (event !== "heartbeat" && now - (lastEventAt.current[event] ?? 0) < 5000) return;
    lastEventAt.current[event] = now;
    void logSecurityEventV2({ attemptId, event, metadata });
  }

  // Deadline auto-submit: the RPC stamps submitted_at at the deadline and
  // records auto_deadline even if this request arrives late.
  useEffect(() => {
    if (remaining !== 0 || !attemptId || result || finalizedRef.current) return;
    finalizedRef.current = true;
    void logSecurityEventV2({ attemptId, event: "deadline_finalize" });
    startTransition(async () => {
      const response = await submitTestV2(attemptId, testId, "auto_deadline");
      if (response.result) setResult({ score: Number(response.result.score), max_score: Number(response.result.max_score) });
      else setMessage(response.error ?? "Time expired. The server is finalizing your attempt.");
    });
  }, [remaining, attemptId, result, testId]);

  // Telemetry: heartbeats prove presence; visibility/focus/fullscreen events
  // are evidence rows, never gates. Refresh resumes (answers are server-side);
  // pagehide only logs — the deadline RPCs do the finalizing.
  useEffect(() => {
    if (!attemptId || result) return;
    const heartbeat = window.setInterval(() => logEvent("heartbeat"), 30000);
    const onVisibility = () => {
      logEvent(document.hidden ? "visibility_hidden" : "visibility_visible");
    };
    const onBlur = () => logEvent("focus_blur");
    const onFocus = () => logEvent("focus_focus");
    const onFullscreen = () => {
      logEvent(document.fullscreenElement ? "fullscreen_enter" : "fullscreen_exit");
    };
    const onPageHide = () => {
      try {
        const payload = JSON.stringify({ attemptId, reason: "auto_leave" });
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/attempts/finalize", new Blob([payload], { type: "application/json" }));
        }
      } catch {
        // Best effort only.
      }
      logEvent("leave_finalize");
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("pagehide", onPageHide);
    try {
      window.sessionStorage.setItem("saarthians-active-attempt", JSON.stringify({ attemptId, testId }));
    } catch {
      // Storage may be unavailable; sign-out finalize degrades gracefully.
    }
    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("pagehide", onPageHide);
      try {
        window.sessionStorage.removeItem("saarthians-active-attempt");
      } catch {
        // Ignore.
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, result]);

  useEffect(() => {
    if (result) {
      try {
        window.sessionStorage.removeItem("saarthians-active-attempt");
      } catch {
        // Ignore.
      }
    }
  }, [result]);

  const begin = () => startTransition(async () => {
    const response = await startTestV2(testId);
    if (response.error || !response.attemptId) setMessage(response.error ?? "Unable to start test.");
    else {
      setAttemptId(response.attemptId);
      setStartedAt(response.startedAt);
      if (response.deadlineAt) setAttemptDeadline(response.deadlineAt);
    }
  });

  const save = (questionId: string, answer: unknown) => {
    // Client-side mutation throttle: at most one save per question per 1.5s.
    // The server independently enforces ownership and the deadline.
    const now = Date.now();
    if (now - (lastSaveAt.current[questionId] ?? 0) < 1500) return;
    lastSaveAt.current[questionId] = now;
    startTransition(async () => {
      const response = await saveAnswerV2({ attemptId: attemptId!, questionId, answer });
      if (response.error) setMessage(response.error);
    });
  };

  const submit = (reason: SubmitReason = "manual") => startTransition(async () => {
    finalizedRef.current = true;
    const response = await submitTestV2(attemptId!, testId, reason);
    if (response.result) setResult({ score: Number(response.result.score), max_score: Number(response.result.max_score) });
    else setMessage(response.error ?? "Unable to submit assessment.");
  });

  const enterFocusMode = () => {
    const root = document.documentElement;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else if (root.requestFullscreen) {
      void root.requestFullscreen().catch(() => setMessage("Fullscreen was blocked by the browser. You can continue normally."));
    }
  };

  if (!orderedQuestions.length) return <div style={card}><h2>No questions yet.</h2><p style={muted}>Ask your teacher to add questions before publishing.</p></div>;
  if (!attemptId) return <div style={card}><span className="eyebrow">Ready</span><h2 style={{ margin: "12px 0 8px" }}>A focused assessment, one question at a time.</h2><p style={muted}>{attemptDeadline ? `Submit before ${new Date(attemptDeadline).toLocaleString()} — the server clock decides.` : durationSeconds ? `You have ${Math.ceil(durationSeconds / 60)} minutes once you start.` : "There is no time limit."} Your answers are saved as you work. Leaving refreshes safely; signing out submits.</p><button type="button" onClick={begin} disabled={pending} style={button}>{pending ? "Starting…" : "Start assessment →"}</button>{message && <p role="alert" style={error}>{message}</p>}</div>;
  if (result) return <div style={{ ...card, background: "var(--accent)", color: "white" }}><span className="eyebrow" style={{ color: "#dff4c0" }}>Assessment complete</span><h2 style={{ fontSize: 52, margin: "12px 0 6px" }}>{Math.round(result.score / Math.max(result.max_score, 1) * 100)}%</h2><p style={{ color: "#d5dfdb" }}>Score: {result.score} / {result.max_score}.</p><Link href="/app/results" style={{ display: "inline-flex", marginTop: 14, borderRadius: 999, padding: "10px 15px", background: "white", color: "var(--ink)", fontWeight: 700 }}>View results →</Link></div>;

  const options = orderedOptions[question.id] ?? [];
  const value = typeof answers[question.id] === "string" ? String(answers[question.id]) : "";
  const clock = remaining === null ? "No timer" : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  return <div style={{ marginTop: 30 }}><div style={bar}><span>Question {current + 1} of {orderedQuestions.length} · {answered} answered</span><span style={{ display: "flex", gap: 10, alignItems: "center" }}><button type="button" onClick={enterFocusMode} style={ghost}>Focus mode</button><strong aria-live="polite">{clock}</strong></span></div><div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 220px", gap: 18, marginTop: 16 }}><article style={card}><span className="eyebrow">Question {current + 1} · {question.points} pts</span><h2 style={{ fontSize: 27, lineHeight: 1.4 }}>{question.prompt}</h2>{options.length ? <div style={{ display: "grid", gap: 10 }}>{options.map((option) => <button key={option} type="button" onClick={() => { setAnswers((a) => ({ ...a, [question.id]: option })); save(question.id, option); }} aria-pressed={value === option} style={{ ...optionStyle, ...(value === option ? selected : {}) }}>{option}</button>)}</div> : <textarea rows={8} value={value} onChange={(e) => setAnswers((a) => ({ ...a, [question.id]: e.target.value }))} onBlur={(e) => save(question.id, e.target.value)} style={textarea} placeholder="Write your answer here…" />}<div style={actions}><button type="button" disabled={current === 0} onClick={() => setCurrent((n) => n - 1)} style={secondary}>← Previous</button><span style={muted}>{pending ? "Saving…" : "Saved"}</span>{current < orderedQuestions.length - 1 ? <button type="button" onClick={() => setCurrent((n) => n + 1)} style={button}>Next →</button> : <button type="button" onClick={() => submit("manual")} disabled={pending || answered !== orderedQuestions.length} style={{ ...button, opacity: pending || answered !== orderedQuestions.length ? .55 : 1 }}>{answered !== orderedQuestions.length ? `${orderedQuestions.length - answered} unanswered` : "Submit assessment →"}</button>}</div>{message && <p role="alert" style={error}>{message}</p>}</article><aside style={{ ...card, padding: 18, marginTop: 0, position: "sticky", top: 80, alignSelf: "start" }}><span className="eyebrow">Navigator</span><div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 7, marginTop: 14 }}>{orderedQuestions.map((q, i) => <button key={q.id} type="button" onClick={() => setCurrent(i)} aria-label={`Go to question ${i + 1}`} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "8px 0", background: i === current ? "var(--accent)" : answers[q.id] !== undefined && answers[q.id] !== "" ? "#eaf0e8" : "white", color: i === current ? "white" : "var(--ink)", cursor: "pointer", fontWeight: 700 }}>{i + 1}</button>)}</div></aside></div></div>;
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
const ghost = { border: "1px solid var(--line)", borderRadius: 999, padding: "6px 12px", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 12 };
const actions = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginTop: 24 };
const error = { color: "#a33" };
