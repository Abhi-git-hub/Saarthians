// Curiosity shelf content: questions worth pausing for. These are NOT a
// game — no scores, no timers, no winners. Each item is a real,
// verifiable idea chosen to make a visitor think "wait, what?" and then
// learn something true in two sentences.

export type CuriosityCategory = "math" | "science" | "logic" | "english";

export interface CuriosityQuestion {
  id: string;
  category: CuriosityCategory;
  question: string;
  answer: string;
  whyItSticks: string;
  gradeRange: string;
}

export const CURIOSITY_CATEGORIES: Array<{ id: CuriosityCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "math", label: "Maths" },
  { id: "science", label: "Science" },
  { id: "logic", label: "Logic" },
  { id: "english", label: "English" },
];

export const CURIOSITY_QUESTIONS: CuriosityQuestion[] = [
  {
    id: "c1",
    category: "math",
    question: "What comes next: 1, 11, 21, 1211, 111221, …?",
    answer:
      "312211. Each term simply describes the previous one out loud: 'one one' becomes 11, 'two ones' becomes 21, 'one two, one one' becomes 1211 — and so on. It is called the look-and-say sequence, and it was studied seriously by a Nobel-winning mathematician.",
    whyItSticks: "Maths is sometimes just careful looking.",
    gradeRange: "Class 9–12",
  },
  {
    id: "c2",
    category: "math",
    question: "How many times do a clock's hands overlap in 12 hours — 12?",
    answer:
      "Only 11. The hour hand keeps moving while the minute hand chases it, so each meeting happens a little later — roughly every 1 hour and 5 minutes. The 12th meeting lands exactly back at 12, starting the next cycle.",
    whyItSticks: "The obvious answer is off by one. Checking beats guessing.",
    gradeRange: "Class 9–12",
  },
  {
    id: "c3",
    category: "math",
    question: "Is 0.999… (threes forever) equal to 1, or just very close?",
    answer:
      "Exactly equal. There is no number that fits between 0.999… and 1, and if two different numbers existed, something would fit between them. Algebra agrees: if x = 0.999…, then 10x − x = 9, so x = 1.",
    whyItSticks: "Infinity breaks everyday intuition — that is why we prove things.",
    gradeRange: "Class 10–12",
  },
  {
    id: "c4",
    category: "science",
    question: "Why is the sky blue but the sunset red?",
    answer:
      "Sunlight is scattered by air molecules, and blue light scatters far more than red — so the whole sky glows blue. At sunset the light travels through much more air, the blue is scattered away completely, and only the reds and oranges survive the trip.",
    whyItSticks: "One idea explains two opposite-looking facts.",
    gradeRange: "Class 9–12",
  },
  {
    id: "c5",
    category: "science",
    question: "If you dug a tunnel straight through the Earth and jumped in, where would you end up?",
    answer:
      "Back where you started — oscillating. You would fall, pick up speed, shoot past the centre, slow down, and pop out the other side just long enough to grab the edge: about 42 minutes each way if there were no air or friction. Gravity becomes your swing.",
    whyItSticks: "A silly question with a real 42-minute answer.",
    gradeRange: "Class 9–12",
  },
  {
    id: "c6",
    category: "science",
    question: "Mirrors flip left and right — so why don't they flip up and down?",
    answer:
      "They actually flip neither: a mirror reverses front and back. Your brain then imagines rotating yourself to face your reflection, and that imagined turn swaps left and right while leaving up and down alone. The mystery is in your head, not the glass.",
    whyItSticks: "Sometimes the phenomenon to explain is your own assumption.",
    gradeRange: "Class 9–12",
  },
  {
    id: "c7",
    category: "science",
    question: "Can hot water really freeze faster than cold water?",
    answer:
      "Sometimes, yes — it is called the Mpemba effect, and physicists still argue about exactly why. Evaporation, dissolved gases, and convection currents all play a role. A kitchen observation from a Tanzanian schoolboy forced textbooks to take it seriously.",
    whyItSticks: "Noticing beats memorising. A schoolboy spotted what experts missed.",
    gradeRange: "Class 10–12",
  },
  {
    id: "c8",
    category: "logic",
    question: "A bat and ball cost ₹110 together. The bat costs ₹100 more than the ball. What does the ball cost?",
    answer:
      "₹5, not ₹10. If the ball were ₹10, the bat would be ₹110 and the total ₹120. The ₹100 difference has to be split around the total: ball ₹5, bat ₹105. Most people — including university students — blurt out the wrong answer first.",
    whyItSticks: "Your first answer is a feeling. The second one is thinking.",
    gradeRange: "Class 9–12",
  },
  {
    id: "c9",
    category: "logic",
    question: "Is the sentence 'This statement is false' true or false?",
    answer:
      "It has no consistent answer: if it is true, then it is false — and if it is false, then it is true. This 2,000-year-old liar paradox shows that some questions break the system asking them, which is exactly why mathematicians built careful rules for logic itself.",
    whyItSticks: "Finding the question with no answer is also an answer.",
    gradeRange: "Class 11–12",
  },
  {
    id: "c10",
    category: "english",
    question: "Why is 'colonel' pronounced 'kernel'?",
    answer:
      "English borrowed the word twice — once from French (colonel) for spelling, once from Spanish/Italian (coronel) for sound — and kept both halves stitched together. The pronunciation is a 500-year-old fossil of two languages colliding.",
    whyItSticks: "Every strange spelling is history refusing to be deleted.",
    gradeRange: "Class 9–12",
  },
  {
    id: "c11",
    category: "english",
    question: "What is the only common English word that ends in 'mt'?",
    answer:
      "'Dreamt.' English simply never built other words on that ending, which is why spellings like 'dreamed' exist alongside it. Odd corners of a language are where its history shows.",
    whyItSticks: "Small facts, honestly earned, stick longer than lists.",
    gradeRange: "Class 9–12",
  },
  {
    id: "c12",
    category: "logic",
    question: "You pass the person in second place in a race. What place are you in now?",
    answer:
      "Second — you took their place; the leader is still ahead of you. Most people say 'first' because the mind leaps past the setup. Races, like word problems, punish skimming.",
    whyItSticks: "Slow down. The question already contains the answer.",
    gradeRange: "Class 9–12",
  },
];
