import Link from "next/link";
import { getStudentTests } from "@/lib/student";

export default async function TestsPage() {
  const tests = await getStudentTests();

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <span className="eyebrow">Assessments</span>
      <h1 style={{ fontSize: "clamp(42px,6vw,70px)", lineHeight: .95, letterSpacing: "-.06em", margin: "18px 0 10px" }}>Test what you know.</h1>
      <p style={{ color: "var(--muted)", maxWidth: 650 }}>Published assessments from your learning environment. The server will own attempt state and grading.</p>
      <div style={{ display: "grid", gap: 0, marginTop: 38 }}>
        {tests.map((test) => (
          <article key={test.id} style={{ borderTop: "1px solid var(--line)", padding: "22px 0", display: "flex", justifyContent: "space-between", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <div><h2 style={{ margin: 0, fontSize: 23, letterSpacing: "-.03em" }}>{test.title}</h2><p style={{ color: "var(--muted)", margin: "7px 0 0", lineHeight: 1.5 }}>{test.instructions || "No extra instructions."}{test.duration_seconds ? ` · ${Math.ceil(test.duration_seconds / 60)} min` : ""}</p></div>
            <Link href={`/app/tests/${test.id}`} style={{ border: "1px solid var(--line)", borderRadius: 999, padding: "10px 15px", fontWeight: 700, fontSize: 13 }}>View test →</Link>
          </article>
        ))}
        {!tests.length && <div style={{ borderTop: "1px solid var(--line)", padding: "28px 0", color: "var(--muted)" }}>No published tests are available yet.</div>}
      </div>
    </main>
  );
}
