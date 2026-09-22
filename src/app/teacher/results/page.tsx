import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getTeacherResults } from "@/lib/teacher";
import { attemptStateLabel, resolveAttemptState } from "@/lib/assessment";

export default async function TeacherResultsPage() {
  const user = await requireRole(["teacher", "admin"]);
  const results = await getTeacherResults(user.id);

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <Link href="/teacher" style={{ color: "var(--muted)", fontSize: 13 }}>← Teacher workspace</Link>
      <span className="eyebrow" style={{ display: "flex", marginTop: 28 }}>Results</span>
      <h1 style={{ fontSize: "clamp(40px,6vw,68px)", lineHeight: .95, letterSpacing: "-.06em", margin: "16px 0 12px" }}>See where learning lands.</h1>
      <p style={{ color: "var(--muted)", maxWidth: 620, lineHeight: 1.7 }}>Finalized attempts for your tests, with how each was submitted and focus-loss signals. Focus signals are deterrent evidence, not proof of cheating.</p>

      {results.length === 0 ? (
        <section style={{ marginTop: 36, border: "1px solid var(--line)", borderRadius: 20, padding: 28, background: "white" }}>
          <span className="eyebrow">No graded attempts</span>
          <h2 style={{ margin: "12px 0 8px", fontSize: 24 }}>Results will appear here.</h2>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.65 }}>Student submissions become visible after the server-side grading workflow marks an attempt as graded or reviewed.</p>
        </section>
      ) : (
        <section style={{ marginTop: 36, display: "grid", gap: 12 }}>
          {results.map((result) => {
            const test = Array.isArray(result.tests) ? result.tests[0] : result.tests;
            const profile = Array.isArray(result.profiles) ? result.profiles[0] : result.profiles;
            const pct = result.max_score && Number(result.max_score) > 0 ? Math.round((Number(result.score ?? 0) / Number(result.max_score)) * 100) : 0;
            const state = attemptStateLabel(resolveAttemptState(result.status, result.submission_reason));
            const signals: string[] = [];
            if (result.signals.focusLoss > 0) signals.push(`${result.signals.focusLoss} focus ${result.signals.focusLoss === 1 ? "loss" : "losses"}`);
            if (result.signals.fullscreenExits > 0) signals.push(`${result.signals.fullscreenExits} fullscreen exits`);
            return (
              <article key={result.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center", border: "1px solid var(--line)", borderRadius: 18, padding: 22, background: "white" }}>
                <div>
                  <strong style={{ fontSize: 18 }}>{profile?.display_name || "Student"}</strong>
                  <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 5 }}>{test?.title || "Assessment"} · {state}{signals.length > 0 ? ` · ${signals.join(" · ")}` : ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ fontSize: 18 }}>{pct}%</strong>
                  <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{result.status}</div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
