// AI tutor domain types.
//
// The tutor is a deterministic, data-grounded study engine by default: every
// statement it produces is derived from the student's own authorized records
// (graded mistakes, notes, progress signals). There are no hidden prompts and
// no model chain-of-thought to leak. An external provider can be plugged in
// later behind the provider interface without changing the pipeline.

export type TutorIntent =
  | { kind: "greet" }
  | { kind: "review_mistakes"; testId?: string }
  | { kind: "revision_plan" }
  | { kind: "progress_summary" }
  | { kind: "explain_topic"; topic: string }
  | { kind: "practice" }
  | { kind: "help" }
  | { kind: "unknown" };

export type GradedMistake = {
  testId: string;
  testTitle: string;
  questionId: string;
  prompt: string;
  points: number;
  studentAnswer: string;
  correctAnswer: string;
  feedback: string | null;
  submittedAt: string | null;
};

export type NoteSnippet = {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
};

export type ProgressSummary = {
  gradedAttempts: number;
  averagePercent: number | null;
  bestPercent: number | null;
  perTest: Array<{ testId: string; title: string; attempts: number; latestPercent: number | null; bestPercent: number | null }>;
};

export type TutorContext = {
  mistakes: GradedMistake[];
  notes: NoteSnippet[];
  progress: ProgressSummary;
  noteCount: number;
};

export type TutorAnswer = {
  // Markdown-lite body shown to the student. Must only contain facts present
  // in the provided context plus deterministic pedagogical framing.
  body: string;
  // Machine-readable record of which tools/context fed the answer (auditable).
  usedTools: string[];
  // Suggested follow-ups the UI may render as chips.
  suggestions: string[];
};

export type TutorSource = {
  title: string;
  page: number | null;
};

export type TutorAnswerMode = "gemini_grounded" | "gemini_general" | "fallback";

export type ProviderResult = {
  body: string;
  usedTools: string[];
  suggestions: string[];
  /** Which engine produced the answer; absent for legacy deterministic answers. */
  mode?: TutorAnswerMode;
  /** Whether the provider claims the answer is grounded in retrieved evidence. */
  grounded?: boolean;
  /** Source references the provider returned (never fabricated by us). */
  sources?: TutorSource[];
};
