import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { getAdminProfile } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, StatusBadge, cardStyle } from "@/components/admin/ui";
import { ProfileEditForm, StatusForm } from "../user-detail-forms";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getAuthenticatedUser();
  const profile = await getAdminProfile(id);
  if (!profile) notFound();

  const supabase = await createClient();
  const relQuery = profile.role === "teacher"
    ? supabase.from("teacher_student").select("student_id,status,created_at,profiles:student_id(id,display_name,status)").eq("teacher_id", id)
    : supabase.from("teacher_student").select("teacher_id,status,created_at,profiles:teacher_id(id,display_name,status)").eq("student_id", id);
  const [{ data: relationships }] = await Promise.all([relQuery]);
  const { data: attempts } = profile.role === "student"
    ? await supabase.from("test_attempts").select("id,test_id,status,score,max_score,submitted_at,tests(title)").eq("student_id", id).order("created_at", { ascending: false }).limit(8)
    : { data: [] as Record<string, unknown>[] };
  const { data: tests } = profile.role === "teacher"
    ? await supabase.from("tests").select("id,title,status,created_at").eq("teacher_id", id).order("created_at", { ascending: false }).limit(8)
    : { data: [] as Record<string, unknown>[] };
  const relationshipRows = (relationships ?? []) as Record<string, unknown>[];
  const attemptRows = (attempts ?? []) as unknown as Record<string, unknown>[];
  const testRows = (tests ?? []) as unknown as Record<string, unknown>[];

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <Link href="/admin/users" style={{ color: "var(--muted)", fontSize: 13 }}>← Users</Link>
      <div style={{ marginTop: 24, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <PageHeader eyebrow={profile.role} title={profile.display_name || "Unnamed"} />
        <StatusBadge status={profile.status} />
      </div>
      <p style={{ color: "var(--muted)", fontSize: 13 }}>
        {profile.username ? `@${profile.username} · ` : ""}Joined {new Date(profile.created_at).toLocaleString()} · Updated {new Date(profile.updated_at).toLocaleString()}
      </p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14, marginTop: 24 }}>
        <ProfileEditForm
          userId={profile.id}
          displayName={profile.display_name}
          phone={profile.phone}
          gradeLevel={profile.grade_level}
          subject={profile.subject}
          role={profile.role}
        />
        <StatusForm userId={profile.id} status={profile.status} isSelf={viewer?.id === profile.id} />
      </section>

      <section style={{ ...cardStyle, marginTop: 14 }}>
        <span className="eyebrow">{profile.role === "teacher" ? "Assigned students" : "Assigned teachers"}</span>
        <div style={{ display: "grid", marginTop: 8 }}>
          {relationshipRows.map((row) => {
            const other = (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles) as { id: string; display_name: string; status: string } | null;
            return (
              <div key={String(row.student_id ?? row.teacher_id)} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--line)", padding: "12px 0" }}>
                <Link href={`/admin/users/${other?.id ?? ""}`} style={{ fontWeight: 650 }}>{other?.display_name || "Unnamed"}</Link>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>{String(row.status ?? "")}</span>
              </div>
            );
          })}
          {!(relationshipRows).length && <p style={{ color: "var(--muted)" }}>No relationships yet. Manage them under Relationships.</p>}
        </div>
        <Link href="/admin/relationships" style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>Manage relationships →</Link>
      </section>

      {profile.role === "student" && (
        <section style={{ ...cardStyle, marginTop: 14 }}>
          <span className="eyebrow">Recent activity</span>
          <div style={{ display: "grid", marginTop: 8 }}>
            {attemptRows.map((attempt) => {
              const test = (Array.isArray(attempt.tests) ? attempt.tests[0] : attempt.tests) as { title: string } | null;
              return (
                <div key={String(attempt.id)} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--line)", padding: "12px 0" }}>
                  <span><strong>{test?.title ?? "Assessment"}</strong> <span style={{ color: "var(--muted)", fontSize: 13 }}>· {String(attempt.status)}</span></span>
                  <span style={{ fontWeight: 700 }}>{attempt.score === null ? "—" : `${attempt.score}/${attempt.max_score}`}</span>
                </div>
              );
            })}
            {!attemptRows.length && <p style={{ color: "var(--muted)" }}>No attempts yet.</p>}
          </div>
        </section>
      )}

      {profile.role === "teacher" && (
        <section style={{ ...cardStyle, marginTop: 14 }}>
          <span className="eyebrow">Tests created</span>
          <div style={{ display: "grid", marginTop: 8 }}>
            {testRows.map((test) => (
              <div key={String(test.id)} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--line)", padding: "12px 0" }}>
                <strong>{String(test.title)}</strong>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>{String(test.status)}</span>
              </div>
            ))}
            {!testRows.length && <p style={{ color: "var(--muted)" }}>No tests yet.</p>}
          </div>
        </section>
      )}
    </main>
  );
}
