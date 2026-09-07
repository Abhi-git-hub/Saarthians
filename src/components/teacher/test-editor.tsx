"use client";

import { useMemo, useState } from "react";
import { removeTeacherQuestion, publishTeacherTest, saveTeacherQuestion } from "@/lib/teacher-test";

type Question = {
  id: string;
  type: string;
  prompt: string;
  options_json: unknown;
  correct_answer_json: unknown;
  points: number;
  position: number;
};

function optionList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function TestEditor({ testId, initialQuestions, status }: { testId: string; initialQuestions: Question[]; status: string }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState({ type: "mcq", prompt: "", options: ["", ""], correct: 0, points: 1 });
  const isEditable = status === "draft";
  const total = useMemo(() => questions.reduce((sum, q) => sum + Number(q.points), 0), [questions]);

  async function addQuestion() {
    setPending(true); setMessage(null);
    try {
      const options = draft.type === "mcq" ? draft.options.filter(Boolean) : undefined;
      const correct = draft.type === "mcq" ? draft.correct : null;
      const id = await saveTeacherQuestion({ testId, type: draft.type, prompt: draft.prompt, options, correct, points: draft.points, position: questions.length });
      setQuestions((current) => [...current, { id, type: draft.type, prompt: draft.prompt, options_json: options ?? null, correct_answer_json: correct, points: draft.points, position: current.length }]);
      setDraft({ type: "mcq", prompt: "", options: ["", ""], correct: 0, points: 1 });
      setMessage("Question saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save the question."); }
    finally { setPending(false); }
  }

  async function deleteQuestion(id: string) {
    setPending(true); setMessage(null);
    try {
      await removeTeacherQuestion(id);
      setQuestions((current) => current.filter((q) => q.id !== id).map((q, index) => ({ ...q, position: index })));
      setMessage("Question removed.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to remove the question."); }
    finally { setPending(false); }
  }

  async function publish() {
    setPending(true); setMessage(null);
    try { await publishTeacherTest(testId); setMessage("Assessment published. Students can now access it when assigned to them."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to publish the assessment."); }
    finally { setPending(false); }
  }

  return (
    <section style={{ marginTop: 34 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", padding: "16px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div><strong>{questions.length} questions</strong><span style={{ color: "var(--muted)", marginLeft: 14 }}>{total} total points</span></div>
        {isEditable ? <button onClick={publish} disabled={pending || questions.length === 0} style={buttonStyle}>Publish assessment →</button> : <span className="eyebrow">Published</span>}
      </div>

      <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
        {questions.map((q, index) => (
          <article key={q.id} style={{ border: "1px solid var(--line)", borderRadius: 18, padding: 20, background: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
              <span className="eyebrow">Q{index + 1} · {q.type} · {q.points} pts</span>
              {isEditable && <button onClick={() => deleteQuestion(q.id)} disabled={pending} style={dangerStyle}>Delete</button>}
            </div>
            <h2 style={{ fontSize: 18, lineHeight: 1.5, margin: "12px 0 8px" }}>{q.prompt}</h2>
            {optionList(q.options_json).length > 0 && <ol style={{ margin: 0, paddingLeft: 24, color: "var(--muted)", lineHeight: 1.7 }}>{optionList(q.options_json).map((option) => <li key={option}>{option}</li>)}</ol>}
          </article>
        ))}
      </div>

      {isEditable && (
        <div style={{ marginTop: 22, border: "1px dashed var(--line)", borderRadius: 20, padding: 22, background: "rgba(255,255,255,.55)" }}>
          <span className="eyebrow">Add question</span>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <select value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))} style={fieldStyle}>
              <option value="mcq">Multiple choice</option>
              <option value="short_answer">Short answer</option>
            </select>
            <textarea value={draft.prompt} onChange={(e) => setDraft((d) => ({ ...d, prompt: e.target.value }))} placeholder="Write the question…" rows={4} style={{ ...fieldStyle, resize: "vertical" as const }} />
            {draft.type === "mcq" && (
              <div style={{ display: "grid", gap: 8 }}>
                {draft.options.map((option, index) => <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}><input value={option} onChange={(e) => setDraft((d) => ({ ...d, options: d.options.map((item, i) => i === index ? e.target.value : item) }))} placeholder={`Option ${index + 1}`} style={fieldStyle} /><input aria-label={`Correct option ${index + 1}`} checked={draft.correct === index} onChange={() => setDraft((d) => ({ ...d, correct: index }))} type="radio" name="correct" style={{ width: 18 }} /></div>)}
                <button type="button" onClick={() => setDraft((d) => ({ ...d, options: [...d.options, ""] }))} style={secondaryStyle}>+ Add option</button>
              </div>
            )}
            <label style={{ fontSize: 13, color: "var(--muted)" }}>Points<input type="number" min="0" step="0.5" value={draft.points} onChange={(e) => setDraft((d) => ({ ...d, points: Number(e.target.value) }))} style={{ ...fieldStyle, marginTop: 6 }} /></label>
            <button type="button" onClick={addQuestion} disabled={pending || !draft.prompt.trim()} style={buttonStyle}>{pending ? "Saving…" : "Save question"}</button>
          </div>
        </div>
      )}
      {message && <p role="status" style={{ marginTop: 14, color: "var(--muted)" }}>{message}</p>}
    </section>
  );
}

const fieldStyle = { width: "100%", border: "1px solid var(--line)", borderRadius: 12, padding: "11px 12px", background: "white", color: "var(--ink)", font: "inherit", boxSizing: "border-box" as const };
const buttonStyle = { border: 0, borderRadius: 999, padding: "12px 17px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" };
const secondaryStyle = { border: "1px solid var(--line)", borderRadius: 999, padding: "9px 13px", background: "white", cursor: "pointer" };
const dangerStyle = { border: "1px solid #edd0d0", borderRadius: 999, padding: "7px 11px", background: "white", color: "#934848", cursor: "pointer" };
