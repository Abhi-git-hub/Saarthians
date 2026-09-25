import Link from "next/link";
import { getStudentAttempts, getStudentTests } from "@/lib/student";

// Assessments are conducted offline in class. This page shows published
// tests and the score your teacher recorded for each — no online answering.
export default async function TestsPage() {
  const [tests, attempts] = await Promise.all([getStudentTests(), getStudentAttempts()]);

  const latestByTest = new Map<string, { score: number | null; max: number | null }>();
  for (const attempt of attempts) {
    if (!latestByTest.has(attempt.test_id)) {
      latestByTest.set(attempt.test_id, {
        score: attempt.score === null ? null : Number(attempt.score),
        max: attempt.max_score === null ? null : Number(attempt.max_score),
      });
    }
  }

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <span className="eyebrow">Assessments</span>
      <h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "18px 0 10px" }}>Your test scores.</h1>
      <p style={{ color: "var(--muted)", maxWidth: 650, lineHeight: 1.65 }}>Tests happen in class. Your teacher records each score here — ask in class if a score looks wrong.</p>
      <div style={{ display: "grid", gap: 0, marginTop: 38 }}>
        {tests.map((test) => {
          const record = latestByTest.get(test.id);
          const scored = record && record.score !== null && record.max !== null;
          return (
            <article key={test.id} style={{ borderTop: "1px solid var(--line)", padding: "22px 0", display: "flex", justifyContent: "space-between", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 23, letterSpacing: "-.03em" }}>{test.title}</h2>
                <p style={{ color: "var(--muted)", margin: "7px 0 0", lineHeight: 1.5 }}>
                  {test.instructions || "Class test."}
                  {scored ? ` · Scored ${record.score} / ${record.max}` : " · Score pending"}
                </p>
              </div>
              <Link href="/app/results" style={{ border: "1px solid var(--line)", borderRadius: 999, padding: "10px 15px", fontWeight: 700, fontSize: 13 }}>Results →</Link>
            </article>
          );
        })}
        {!tests.length && (
          <div style={{ borderTop: "1px solid var(--line)", padding: "28px 0" }}>
            <strong style={{ fontSize: 17 }}>No tests on record yet.</strong>
            <p style={{ color: "var(--muted)", margin: "8px 0 0", lineHeight: 1.6 }}>When your teacher records your first class-test score, it will appear here and in Results.</p>
          </div>
        )}
      </div>
    </main>
  );
}
