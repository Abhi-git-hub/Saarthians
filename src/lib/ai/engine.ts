import { MAX_ANSWER_CHARS } from "./policy";
import type { TutorAnswer, TutorContext, TutorIntent } from "./types";

// Deterministic tutoring engine: every sentence is built from the supplied
// context (the student's own records) plus fixed pedagogical framing. There
// is no generative model here, so there is nothing to hallucinate, no prompt
// to leak, and no chain-of-thought to expose. Pure functions over injected
// context — fully unit-testable.
export function respondToIntent(intent: TutorIntent, context: TutorContext): TutorAnswer {
  switch (intent.kind) {
    case "greet":
      return greet(context);
    case "review_mistakes":
      return reviewMistakes(context, intent.testId);
    case "revision_plan":
      return revisionPlan(context);
    case "progress_summary":
      return progressSummary(context);
    case "practice":
      return practiceSet(context);
    case "explain_topic":
      return explainTopic(context, intent.topic);
    case "help":
      return help(context);
    default:
      return help(context);
  }
}

function clamp(body: string): string {
  return body.length > MAX_ANSWER_CHARS ? `${body.slice(0, MAX_ANSWER_CHARS - 1)}…` : body;
}

function greet(context: TutorContext): TutorAnswer {
  const parts = [`Namaste! I'm your Saarthians study tutor. I work only from your own coursework — your notes, your test attempts, and your progress.`];
  if (context.progress.gradedAttempts > 0 && context.progress.averagePercent !== null) {
    parts.push(`So far you have ${context.progress.gradedAttempts} graded attempt${context.progress.gradedAttempts === 1 ? "" : "s"} averaging ${context.progress.averagePercent}%.`);
  }
  if (context.mistakes.length > 0) {
    parts.push(`Right now there ${context.mistakes.length === 1 ? "is" : "are"} ${context.mistakes.length} reviewed miss${context.mistakes.length === 1 ? "" : "es"} waiting for you.`);
  }
  return {
    body: clamp(parts.join(" ")),
    usedTools: ["greet", "progress_summary"],
    suggestions: ["Review my mistakes", "Make me a revision plan", "How am I doing?"],
  };
}

function help(context: TutorContext): TutorAnswer {
  const lines = [
    `Here's what I can actually do with your work:`,
    ``,
    `• **Review my mistakes** — walk through questions you missed, with your answers and the expected ones side by side.`,
    `• **Quiz me / practice** — turn your missed questions into a practice set.`,
    `• **Make a revision plan** — an ordered plan built from your weakest areas.`,
    `• **How am I doing?** — your average, best, and per-assessment trend.`,
    `• **Explain followed by words from your notes** — I'll find matching material you wrote.`,
    ``,
    context.noteCount > 0
      ? `You have ${context.noteCount} note${context.noteCount === 1 ? "" : "s"} I can search.`
      : `Write some notes first and I'll be able to search them for you.`,
  ];
  return {
    body: clamp(lines.join("\n")),
    usedTools: ["help"],
    suggestions: ["Review my mistakes", "Make me a revision plan", "Quiz me"],
  };
}

function reviewMistakes(context: TutorContext, testId?: string): TutorAnswer {
  const mistakes = testId ? context.mistakes.filter((mistake) => mistake.testId === testId) : context.mistakes;
  if (mistakes.length === 0) {
    return {
      body: clamp(
        testId
          ? `Good news — I found no reviewed misses on that assessment. If you attempted it recently, wait for grading, then ask again.`
          : `Nothing to review yet. Complete a graded assessment and any question you miss will show up here with your answer, the expected answer, and your teacher's feedback.`,
      ),
      usedTools: ["review_mistakes"],
      suggestions: ["How am I doing?", "Make me a revision plan"],
    };
  }

  const lines = [
    `Let's walk through ${mistakes.length === 1 ? "the miss I found" : `the ${mistakes.length} misses I found`} in your graded work:`,
    ``,
  ];
  for (const [index, mistake] of mistakes.slice(0, 6).entries()) {
    lines.push(`**${index + 1}. ${mistake.testTitle}** — ${mistake.prompt}`);
    lines.push(`Your answer: ${truncate(mistake.studentAnswer, 220)}`);
    lines.push(`Expected: ${truncate(mistake.correctAnswer, 220)}`);
    if (mistake.feedback) lines.push(`Teacher's note: ${truncate(mistake.feedback, 220)}`);
    lines.push(`Ask yourself: what was the first step where your approach diverged from the expected one?`);
    lines.push(``);
  }
  if (mistakes.length > 6) {
    lines.push(`…and ${mistakes.length - 6} more. Fix these six first, then ask me to review again.`);
    lines.push(``);
  }
  lines.push(`When you're ready, say "quiz me" and I'll turn these into practice.`);
  return {
    body: clamp(lines.join("\n")),
    usedTools: ["review_mistakes"],
    suggestions: ["Quiz me", "Make me a revision plan", "How am I doing?"],
  };
}

function revisionPlan(context: TutorContext): TutorAnswer {
  if (context.mistakes.length === 0 && context.progress.gradedAttempts === 0) {
    return {
      body: clamp(
        `I need something to plan from. Attempt a test first — once it's graded, I'll build you an ordered plan from exactly the questions you missed, weakest area first.`,
      ),
      usedTools: ["revision_plan"],
      suggestions: ["How am I doing?", "What can you do?"],
    };
  }

  const byTest = new Map<string, { title: string; count: number }>();
  for (const mistake of context.mistakes) {
    const existing = byTest.get(mistake.testId);
    if (existing) existing.count += 1;
    else byTest.set(mistake.testId, { title: mistake.testTitle, count: 1 });
  }
  const ranked = [...byTest.values()].sort((a, b) => b.count - a.count);

  const lines = [`Here is your revision order — weakest area first, based on your actual misses:`];
  lines.push(``);
  ranked.slice(0, 5).forEach((row, index) => {
    lines.push(`**Step ${index + 1}: ${row.title}** — ${row.count} miss${row.count === 1 ? "" : "es"} to revisit. Re-read your note on it, redo each question closed-book, then check against the expected answers in your review.`);
  });
  if (ranked.length === 0) {
    lines.push(`**Step 1: consolidate.** No misses on record — pick your lowest average assessment and redo its hardest questions closed-book.`);
  }
  lines.push(``);
  lines.push(`One sitting per step. Tell me when a step is done and I'll point you at the next one.`);
  return {
    body: clamp(lines.join("\n")),
    usedTools: ["revision_plan", "review_mistakes"],
    suggestions: ["Review my mistakes", "Quiz me"],
  };
}

function progressSummary(context: TutorContext): TutorAnswer {
  const progress = context.progress;
  if (progress.gradedAttempts === 0) {
    return {
      body: clamp(`No graded work yet, so there's nothing to summarize honestly. Attempt a published test and I'll track your average, best, and per-assessment trend here.`),
      usedTools: ["progress_summary"],
      suggestions: ["What can you do?", "Make me a revision plan"],
    };
  }
  const lines = [
    `From your ${progress.gradedAttempts} graded attempt${progress.gradedAttempts === 1 ? "" : "s"}:`,
    ``,
    `• Average: ${progress.averagePercent === null ? "—" : `${progress.averagePercent}%`}`,
    `• Best: ${progress.bestPercent === null ? "—" : `${progress.bestPercent}%`}`,
  ];
  for (const row of progress.perTest.slice(0, 6)) {
    lines.push(
      `• ${row.title}: ${row.attempts} attempt${row.attempts === 1 ? "" : "s"}, latest ${row.latestPercent === null ? "—" : `${row.latestPercent}%`}, best ${row.bestPercent === null ? "—" : `${row.bestPercent}%`}`,
    );
  }
  lines.push(``);
  lines.push(
    context.mistakes.length > 0
      ? `The fastest way up from here: clear your ${context.mistakes.length} reviewed miss${context.mistakes.length === 1 ? "" : "es"}. Say "review my mistakes" and we'll start.`
      : `Clean sheet — no reviewed misses. Keep the streak going.`,
  );
  return {
    body: clamp(lines.join("\n")),
    usedTools: ["progress_summary"],
    suggestions: ["Review my mistakes", "Make me a revision plan"],
  };
}

function practiceSet(context: TutorContext): TutorAnswer {
  if (context.mistakes.length === 0) {
    return {
      body: clamp(
        context.progress.gradedAttempts === 0
          ? `Attempt a test first — practice sets are built from questions real students actually missed, starting with you.`
          : `Nothing outstanding: every reviewed question so far earned full marks. Attempt another test and I'll build your next set from whatever slips.`,
      ),
      usedTools: ["practice"],
      suggestions: ["How am I doing?", "Make me a revision plan"],
    };
  }
  const lines = [
    `Your practice set — ${Math.min(context.mistakes.length, 5)} question${Math.min(context.mistakes.length, 5) === 1 ? "" : "s"} you missed before. Cover the answers, attempt each, then check yourself in your result review:`,
    ``,
  ];
  for (const [index, mistake] of context.mistakes.slice(0, 5).entries()) {
    lines.push(`**P${index + 1} (${mistake.testTitle}, ${mistake.points} pts).** ${mistake.prompt}`);
  }
  lines.push(``);
  lines.push(`Work them closed-book. When done, open each attempt's review to compare — and tell me which ones still feel shaky.`);
  return {
    body: clamp(lines.join("\n")),
    usedTools: ["practice", "review_mistakes"],
    suggestions: ["Review my mistakes", "Make me a revision plan"],
  };
}

function explainTopic(context: TutorContext, topic: string): TutorAnswer {
  if (context.notes.length > 0) {
    const lines = [
      `Here's what **you** have written about "${topic}":`,
      ``,
    ];
    for (const note of context.notes.slice(0, 3)) {
      lines.push(`**${note.title}** — ${truncate(note.excerpt, 240)}`);
      lines.push(``);
    }
    lines.push(`Re-read the matched note above, then explain the idea back in one paragraph in a new note. If nothing matched, tell me which class or chapter it's from and I'll point you at the right place to start.`);
    return {
      body: clamp(lines.join("\n")),
      usedTools: ["explain_topic", "notes_search"],
      suggestions: ["Review my mistakes", "Quiz me"],
    };
  }
  return {
    body: clamp(
      `I explain from your own coursework, and you don't have any notes I can search yet. Write a note on "${topic}" first — even a rough one — and then ask me again; I'll pull it straight back up with the parts that matter.`,
    ),
    usedTools: ["explain_topic"],
    suggestions: ["What can you do?", "How am I doing?"],
  };
}

function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean || "—";
}
