import type { TutorIntent } from "./types";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "with", "is",
  "are", "was", "what", "how", "why", "when", "which", "that", "this", "please",
  "me", "my", "do", "does", "can", "could", "would", "should", "i", "you", "it",
]);

// Rule-based intent classification. Deterministic and testable; the full
// message text is never sent anywhere — only the student's own records feed
// the response. Keywords route to tools; everything else falls back to help.
export function classifyIntent(raw: string): TutorIntent {
  const text = raw.toLowerCase();

  if (/(^|\b)(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/.test(text) && text.length < 40) {
    return { kind: "greet" };
  }
  // Specific intents first: a message like "help me prepare" is a revision
  // request, not a cry for the help text.
  if (/\b(plan|routine|schedule|timetable|prepare|revise|revision|study plan)\b/.test(text)) {
    return { kind: "revision_plan" };
  }
  if (/\b(progress|performance|how am i doing|my scores|my average|report)\b/.test(text)) {
    return { kind: "progress_summary" };
  }
  if (/\b(quiz|practice|test me|drill|questions for me|mock)\b/.test(text)) {
    return { kind: "practice" };
  }
  if (/\b(mistake|mistakes|wrong|incorrect|missed|review|where did i go wrong|feedback)\b/.test(text)) {
    return { kind: "review_mistakes" };
  }
  if (/\b(explain|teach|understand|meaning of|what is|what are|what does|define|concept|topic|chapter|lesson)\b/.test(text)) {
    const topic = extractTopic(text);
    if (topic) return { kind: "explain_topic", topic };
    return { kind: "help" };
  }
  if (/\b(help|what can you do|how do (you|u) work|commands|options)\b/.test(text)) {
    return { kind: "help" };
  }
  return { kind: "unknown" };
}

const TRIGGER_VERBS = new Set([
  "explain",
  "teach",
  "understand",
  "define",
  "describe",
  "tell",
  "show",
  "meaning",
  "concept",
  "topic",
  "chapter",
  "lesson",
]);

function extractTopic(text: string): string | null {
  const cleaned = text
    .replace(/[?.!,;:()"]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word) && !TRIGGER_VERBS.has(word));
  if (cleaned.length === 0) return null;
  return cleaned.slice(0, 6).join(" ");
}

// Keywords used to match the student's own notes. Exported for tests.
export function topicKeywords(topic: string): string[] {
  return topic
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word))
    .slice(0, 6);
}
