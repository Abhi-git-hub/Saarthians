// Saarthians Learning Lab — deterministic question engine.
//
// Public mini-games must be fast, deterministic, cheap, and playable with AI
// offline. Everything here is static data + pure functions: no network, no
// secrets, no randomness outside seeded PRNGs (tests stay flake-free).

export type LabCategory = "math" | "science" | "logic" | "english";

export interface LabQuestion {
  id: string;
  category: LabCategory;
  difficulty: 1 | 2 | 3;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  skill: string;
  gradeRange: string;
}

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

/** Deterministic shuffle; same seed always yields the same order. */
export function shuffled<T>(items: readonly T[], seed: string): T[] {
  const random = mulberry32(hashSeed(seed));
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Pick up to `count` questions, optionally filtered, in seeded order. */
export function pickQuestions(
  bank: readonly LabQuestion[],
  options: { category?: LabCategory; count: number; seed: string },
): LabQuestion[] {
  const pool = options.category ? bank.filter((q) => q.category === options.category) : [...bank];
  return shuffled(pool, options.seed).slice(0, Math.max(0, options.count));
}

export interface ScoreReport {
  correct: number;
  total: number;
  accuracy: number | null;
  breakdown: Array<{ id: string; correct: boolean }>;
}

export function scoreQuiz(
  questions: readonly LabQuestion[],
  answers: Record<string, number>,
): ScoreReport {
  const breakdown = questions.map((q) => ({ id: q.id, correct: answers[q.id] === q.correctIndex }));
  const correct = breakdown.filter((b) => b.correct).length;
  return {
    correct,
    total: questions.length,
    accuracy: questions.length > 0 ? Math.round((correct / questions.length) * 100) : null,
    breakdown,
  };
}

// Honest performance labels. Never IQ, genius claims, or pseudo-diagnosis.
export function performanceLabel(accuracy: number | null): string {
  if (accuracy === null) return "No questions attempted.";
  if (accuracy >= 85) return "Strong conceptual accuracy.";
  if (accuracy >= 60) return "Solid thinking — a little polish will sharpen it.";
  if (accuracy >= 35) return "Good instincts. Concepts will click with practice.";
  return "A brave start. Every Saarthian begins exactly here.";
}

/** Deterministic daily pick: all visitors on the same UTC date get the same question. */
export function dailyQuestion(bank: readonly LabQuestion[], dateISO: string): LabQuestion {
  if (bank.length === 0) throw new Error("EMPTY_BANK");
  const day = dateISO.slice(0, 10);
  let total = 0;
  for (let i = 0; i < day.length; i += 1) total = (total * 31 + day.charCodeAt(i)) >>> 0;
  return bank[total % bank.length];
}

// ---------------------------------------------------------------------------
// Question bank (static, faculty-tone, classes 9–12). Answers never leave
// this module except through gameplay validation.
// ---------------------------------------------------------------------------

export const QUESTION_BANK: LabQuestion[] = [
  // Math
  { id: "m1", category: "math", difficulty: 1, prompt: "What is 17 × 6?", options: ["102", "112", "96", "107"], correctIndex: 0, explanation: "17 × 6 = (10 × 6) + (7 × 6) = 60 + 42 = 102.", skill: "Mental arithmetic", gradeRange: "Class 9–10" },
  { id: "m2", category: "math", difficulty: 1, prompt: "If 3x + 7 = 22, what is x?", options: ["4", "5", "6", "15"], correctIndex: 1, explanation: "3x = 22 − 7 = 15, so x = 5.", skill: "Linear equations", gradeRange: "Class 9–10" },
  { id: "m3", category: "math", difficulty: 2, prompt: "Next in the sequence: 2, 6, 12, 20, 30, …?", options: ["40", "42", "36", "44"], correctIndex: 1, explanation: "Differences grow by 2 each time: +4, +6, +8, +10, so next is +12 → 42.", skill: "Pattern recognition", gradeRange: "Class 9–12" },
  { id: "m4", category: "math", difficulty: 2, prompt: "What is 15% of 240?", options: ["30", "36", "24", "42"], correctIndex: 1, explanation: "10% is 24 and 5% is 12; 24 + 12 = 36.", skill: "Percentages", gradeRange: "Class 9–10" },
  { id: "m5", category: "math", difficulty: 2, prompt: "Simplify: (2³ × 2⁴) ÷ 2⁵", options: ["2", "4", "8", "1"], correctIndex: 1, explanation: "Add exponents on top: 2⁷ ÷ 2⁵ = 2² = 4.", skill: "Exponents", gradeRange: "Class 9–10" },
  { id: "m6", category: "math", difficulty: 3, prompt: "The roots of x² − 7x + 12 = 0 are:", options: ["3 and 4", "2 and 6", "1 and 12", "−3 and −4"], correctIndex: 0, explanation: "Need two numbers with sum 7 and product 12: 3 and 4.", skill: "Quadratic equations", gradeRange: "Class 10–11" },
  { id: "m7", category: "math", difficulty: 1, prompt: "What is the HCF of 24 and 36?", options: ["6", "12", "8", "18"], correctIndex: 1, explanation: "24 = 2³ × 3 and 36 = 2² × 3²; common factors give 2² × 3 = 12.", skill: "Number systems", gradeRange: "Class 9–10" },
  { id: "m8", category: "math", difficulty: 3, prompt: "If log₁₀ 2 ≈ 0.301, log₁₀ 8 ≈ ?", options: ["0.903", "0.602", "2.408", "0.301"], correctIndex: 0, explanation: "8 = 2³, so log 8 = 3 × log 2 ≈ 3 × 0.301 = 0.903.", skill: "Logarithms", gradeRange: "Class 11" },
  // Science
  { id: "s1", category: "science", difficulty: 1, prompt: "Which gas do plants absorb for photosynthesis?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], correctIndex: 1, explanation: "Plants take in carbon dioxide and release oxygen while making glucose.", skill: "Life processes", gradeRange: "Class 9–10" },
  { id: "s2", category: "science", difficulty: 1, prompt: "SI unit of force?", options: ["Joule", "Watt", "Newton", "Pascal"], correctIndex: 2, explanation: "Force is measured in newtons; joule is energy, watt is power, pascal is pressure.", skill: "Units & motion", gradeRange: "Class 9" },
  { id: "s3", category: "science", difficulty: 2, prompt: "An object moves at constant velocity. Net force on it is:", options: ["Zero", "Equal to its mass", "Increasing", "Equal to its speed"], correctIndex: 0, explanation: "Newton's first law: no acceleration means no net force.", skill: "Laws of motion", gradeRange: "Class 9–11" },
  { id: "s4", category: "science", difficulty: 2, prompt: "pH of a neutral solution at 25°C?", options: ["0", "1", "7", "14"], correctIndex: 2, explanation: "Neutral means [H⁺] = [OH⁻], which happens at pH 7.", skill: "Acids & bases", gradeRange: "Class 10" },
  { id: "s5", category: "science", difficulty: 2, prompt: "Which organelle is called the powerhouse of the cell?", options: ["Ribosome", "Nucleus", "Mitochondria", "Golgi body"], correctIndex: 2, explanation: "Mitochondria release energy from food through respiration.", skill: "Cell biology", gradeRange: "Class 9–10" },
  { id: "s6", category: "science", difficulty: 3, prompt: "A ray of light bends towards the normal when it:", options: ["Speeds up", "Slows down", "Reflects", "Disperses"], correctIndex: 1, explanation: "Entering a denser medium slows light down, bending it towards the normal.", skill: "Light & optics", gradeRange: "Class 10" },
  { id: "s7", category: "science", difficulty: 1, prompt: "Chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], correctIndex: 2, explanation: "Au comes from aurum, the Latin word for gold. Ag is silver.", skill: "Elements", gradeRange: "Class 9–10" },
  { id: "s8", category: "science", difficulty: 3, prompt: "Which process releases oxygen as a by-product in plants?", options: ["Respiration", "Transpiration", "Photolysis of water", "Fermentation"], correctIndex: 2, explanation: "During the light reaction, splitting water releases oxygen.", skill: "Photosynthesis", gradeRange: "Class 10–11" },
  // Logic
  { id: "l1", category: "logic", difficulty: 1, prompt: "Book is to Reading as Fork is to:", options: ["Drawing", "Eating", "Writing", "Cooking"], correctIndex: 1, explanation: "A fork is the tool used for eating, as a book is the object of reading.", skill: "Analogies", gradeRange: "Class 9–12" },
  { id: "l2", category: "logic", difficulty: 2, prompt: "2, 3, 5, 9, 17, … what comes next?", options: ["26", "33", "34", "25"], correctIndex: 1, explanation: "Each term doubles the previous and subtracts 1: 17 × 2 − 1 = 33.", skill: "Sequences", gradeRange: "Class 9–12" },
  { id: "l3", category: "logic", difficulty: 2, prompt: "All sprinters are athletes. Some athletes are coaches. Which must be true?", options: ["Some sprinters are coaches", "Some coaches are athletes", "All coaches are sprinters", "No sprinter is a coach"], correctIndex: 1, explanation: "'Some athletes are coaches' converts to 'some coaches are athletes'. Nothing links sprinters to coaches.", skill: "Deduction", gradeRange: "Class 11–12" },
  { id: "l4", category: "logic", difficulty: 1, prompt: "If yesterday was Wednesday, what day is day-after-tomorrow?", options: ["Friday", "Saturday", "Sunday", "Monday"], correctIndex: 2, explanation: "Today is Thursday; tomorrow Friday; day-after-tomorrow Sunday.", skill: "Calendar reasoning", gradeRange: "Class 9–12" },
  { id: "l5", category: "logic", difficulty: 2, prompt: "A, C, F, J, O, … what comes next?", options: ["T", "U", "S", "V"], correctIndex: 1, explanation: "Gaps between letters grow: +2, +3, +4, +5, so O + 6 = U.", skill: "Letter series", gradeRange: "Class 9–12" },
  { id: "l6", category: "logic", difficulty: 3, prompt: "Five friends sit in a row. A is left of B, B is left of C, C is left of D, D is left of E. Who sits in the middle?", options: ["A", "B", "C", "E"], correctIndex: 2, explanation: "The order is fixed A-B-C-D-E, so C is exactly in the middle.", skill: "Ordering", gradeRange: "Class 9–12" },
  { id: "l7", category: "logic", difficulty: 2, prompt: "Which number does NOT belong: 3, 5, 7, 9, 11?", options: ["3", "5", "9", "11"], correctIndex: 2, explanation: "All others are prime; 9 = 3 × 3 is composite.", skill: "Odd-one-out", gradeRange: "Class 9–10" },
  { id: "l8", category: "logic", difficulty: 3, prompt: "If all blooms are flowers and some flowers fade quickly, then:", options: ["All blooms fade quickly", "Some blooms may fade quickly", "No bloom fades quickly", "All flowers are blooms"], correctIndex: 1, explanation: "Blooms are a subset of flowers, so the 'some fade' group may include blooms — but it is not guaranteed for all.", skill: "Syllogisms", gradeRange: "Class 11–12" },
  // English
  { id: "e1", category: "english", difficulty: 1, prompt: "Choose the correctly spelt word:", options: ["Occassion", "Occasion", "Ocassion", "Ocasion"], correctIndex: 1, explanation: "Double 'c', single 's': occasion.", skill: "Spelling", gradeRange: "Class 9–10" },
  { id: "e2", category: "english", difficulty: 1, prompt: "She ___ to school every day.", options: ["go", "goes", "going", "gone"], correctIndex: 1, explanation: "Third-person singular in simple present takes 'goes'.", skill: "Subject-verb agreement", gradeRange: "Class 9–10" },
  { id: "e3", category: "english", difficulty: 2, prompt: "'Ephemeral' most nearly means:", options: ["Eternal", "Short-lived", "Fragile", "Mysterious"], correctIndex: 1, explanation: "Ephemeral describes things that last a very short time.", skill: "Vocabulary", gradeRange: "Class 10–12" },
  { id: "e4", category: "english", difficulty: 2, prompt: "Identify the passive sentence:", options: ["She wrote a letter.", "A letter was written by her.", "She is writing a letter.", "She writes letters."],
    correctIndex: 1, explanation: "Passive voice moves the receiver to the front: 'was written by'.", skill: "Voice", gradeRange: "Class 9–10" },
  { id: "e5", category: "english", difficulty: 2, prompt: "'To bite the dust' means:", options: ["To eat quickly", "To fail or be defeated", "To work in a field", "To hide from danger"], correctIndex: 1, explanation: "The idiom means to suffer defeat or failure.", skill: "Idioms", gradeRange: "Class 10–12" },
  { id: "e6", category: "english", difficulty: 3, prompt: "Choose the sentence with correct punctuation:", options: ["Its raining, take an umbrella.", "It's raining; take an umbrella.", "Its' raining take an umbrella.", "It's raining take, an umbrella."],
    correctIndex: 1, explanation: "'It's' = it is; the semicolon cleanly joins two related clauses.", skill: "Punctuation", gradeRange: "Class 9–12" },
  { id: "e7", category: "english", difficulty: 1, prompt: "Antonym of 'ancient':", options: ["Old", "Modern", "Historic", "Classic"], correctIndex: 1, explanation: "'Ancient' (very old) opposes 'modern'.", skill: "Antonyms", gradeRange: "Class 9–10" },
  { id: "e8", category: "english", difficulty: 3, prompt: "'The committee ___ divided on this issue.' (collective noun, members acting separately)", options: ["is", "are", "was", "has been"],     correctIndex: 1, explanation: "When members act as individuals, the collective noun takes a plural verb: 'are'.", skill: "Collective nouns", gradeRange: "Class 11–12" },
];
