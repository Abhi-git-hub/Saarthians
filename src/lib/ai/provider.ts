import type { MaterialEvidence } from "./retrieval";
import { formatEvidenceForPrompt } from "./retrieval";
import { generateGroundedTutor, isGeminiConfigured } from "./gemini";
import type { ProviderResult, TutorContext, TutorIntent } from "./types";

// Gemini-backed provider. The chat UI never imports this module directly —
// actions.ts routes through `resolveTutorAnswer`, so authorization, context
// selection, persistence, and budgeting are unchanged by the provider.
//
// Knowledge hierarchy (explicit in the system prompt):
//   1. teacher's authorized study materials (retrieved chunks)
//   2. student's own notes
//   3. student's results / mistakes / progress
//   4. general model knowledge, only when permitted and clearly labeled

const SYSTEM_PROMPT = `You are Saarthians Tutor, a study tutor for school students (classes 9-12, NEET/JEE).
Prefer knowledge in this order:
1. The STUDY MATERIAL excerpts below (authoritative teacher content).
2. The student's own notes.
3. The student's mistakes and progress.
4. Your general knowledge, ONLY when the material does not cover the question.

Grounding rules (no exceptions):
- Distinguish "From your study material..." from "As a general explanation...".
- If the material lacks evidence, say so plainly instead of guessing.
- Never fabricate page numbers, quotations, teacher statements, or citations.
- Only cite sources from the provided excerpts, using their exact titles and pages.
- Do NOT reveal private chain-of-thought. Give: explanation, concise reasoning
  summary, steps where helpful, grounded source references, and uncertainty.
- Keep answers focused and student-friendly. No disallowed content.`;

function buildUserPrompt(intent: TutorIntent, context: TutorContext, evidence: MaterialEvidence[]): string {
  const parts: string[] = [];
  if (evidence.length > 0) {
    parts.push(`STUDY MATERIAL EXCERPTS (ranked by relevance):\n${formatEvidenceForPrompt(evidence)}`);
  } else {
    parts.push("STUDY MATERIAL EXCERPTS: none retrieved for this question.");
  }
  if (context.notes.length > 0) {
    const notes = context.notes
      .slice(0, 5)
      .map((n) => `- "${n.title}": ${n.excerpt.slice(0, 300)}`)
      .join("\n");
    parts.push(`STUDENT NOTES:\n${notes}`);
  }
  if (context.mistakes.length > 0) {
    const mistakes = context.mistakes
      .slice(0, 5)
      .map((m) => `- [${m.testTitle}] ${m.prompt.slice(0, 200)} (answered: ${m.studentAnswer.slice(0, 100)}; correct: ${m.correctAnswer.slice(0, 100)})`)
      .join("\n");
    parts.push(`RECENT MISTAKES:\n${mistakes}`);
  }
  if (context.progress.averagePercent !== null) {
    parts.push(`PROGRESS: ${context.progress.gradedAttempts} graded attempts, average ${context.progress.averagePercent}%.`);
  }
  parts.push(`STUDENT QUESTION (intent: ${intent.kind}):\n${describeIntent(intent)}`);
  return parts.join("\n\n");
}

function describeIntent(intent: TutorIntent): string {
  switch (intent.kind) {
    case "greet":
      return "The student greeted the tutor. Welcome them briefly and suggest what to ask.";
    case "review_mistakes":
      return "The student wants to review their mistakes. Use the recent mistakes and material excerpts.";
    case "revision_plan":
      return "The student wants a revision plan. Base it on mistakes, progress, and material excerpts.";
    case "progress_summary":
      return "The student wants a progress summary. Summarize the progress signals honestly.";
    case "explain_topic":
      return `Explain this topic: ${intent.topic}. Ground it in the material excerpts when relevant.`;
    case "practice":
      return "The student wants practice questions. Create a few from the material excerpts and mistakes.";
    case "help":
      return "The student asked what the tutor can do. Explain capabilities briefly.";
    case "unknown":
      return "Answer helpfully using the hierarchy above.";
  }
}

export function isProviderConfigured(): boolean {
  return isGeminiConfigured();
}

export async function generateWithProvider(
  intent: TutorIntent,
  context: TutorContext,
  evidence: MaterialEvidence[] = [],
): Promise<ProviderResult> {
  if (!isGeminiConfigured()) throw new Error("GEMINI_NOT_CONFIGURED");
  const result = await generateGroundedTutor({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: buildUserPrompt(intent, context, evidence),
  });
  const usedTools = evidence.length > 0 ? ["material_retrieval", "gemini_tutor"] : ["gemini_tutor"];
  const sourceLines = result.sources.map((s) =>
    s.page !== null ? `Source: ${s.title} (page ${s.page})` : `Source: ${s.title}`,
  );
  const body = sourceLines.length > 0 ? `${result.answer}\n\n${sourceLines.join("\n")}` : result.answer;
  return {
    body,
    usedTools,
    suggestions: result.followups,
    mode: result.grounded && evidence.length > 0 ? "gemini_grounded" : "gemini_general",
    grounded: result.grounded,
    sources: result.sources,
  };
}
