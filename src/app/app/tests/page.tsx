import Link from "next/link";
import { getStudentTests } from "@/lib/student";
import { lifecycleLabel, resolveTestLifecycle } from "@/lib/assessment";

export default async function TestsPage() {
  const tests = await getStudentTests();

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <span className="eyebrow">Assessments</span>
      <h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "18px 0 10px" }}>Test what you know.</h1>
      <p style={{ color: "var(--muted)", maxWidth: 650 }}>Published assessments from your learning environment. The server owns attempt state, timing, and grading.</p>
      <div style={{ display: "grid", gap: 0, marginTop: 38 }}>
        {tests.map((test) => {
          const lifecycle = resolveTestLifecycle("published", test.start_time, test.end_time);
          const windowText =
            lifecycle === "scheduled" && test.start_time
              ? ` · opens ${new Date(test.start_time).toLocaleString()}`
              : lifecycle === "closed"
                ? " · window closed"
                : test.end_time
                  ? ` · closes ${new Date(test.end_time).toLocaleString()}`
                  : "";
          return (
            <article key={test.id} style={{ borderTop: "1px solid var(--line)", padding: "22px 0", display: "flex", justifyContent: "space-between", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
              <div><h2 style={{ margin: 0, fontSize: 23, letterSpacing: "-.03em" }}>{test.title} <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)" }}>{lifecycleLabel(lifecycle)}</span></h2><p style={{ color: "var(--muted)", margin: "7px 0 0", lineHeight: 1.5 }}>{test.instructions || "No extra instructions."}{test.duration_seconds ? ` · ${Math.ceil(test.duration_seconds / 60)} min` : ""}{windowText}</p></div>
              <Link href={`/app/tests/${test.id}`} style={{ border: "1px solid var(--line)", borderRadius: 999, padding: "10px 15px", fontWeight: 700, fontSize: 13 }}>{lifecycle === "live" ? "Enter →" : "View →"}</Link>
            </article>
          );
        })}
        {!tests.length && <div style={{ borderTop: "1px solid var(--line)", padding: "28px 0", color: "var(--muted)" }}>No published tests are available yet.</div>}
      </div>
    </main>
  );
}
