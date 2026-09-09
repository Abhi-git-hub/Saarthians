"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { assignRelationship, unassignRelationship } from "../users/actions";
import { buttonStyle, cardStyle, fieldStyle } from "@/components/admin/ui";
import type { AdminRelationship } from "@/lib/admin";

export function RelationshipManager({
  rows,
  teachers,
  students,
}: {
  rows: AdminRelationship[];
  teachers: { id: string; display_name: string; username: string | null }[];
  students: { id: string; display_name: string; username: string | null }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function assign(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await assignRelationship(formData);
      if ("error" in result) setError(result.error);
      else router.refresh();
    });
  }

  function unassign(teacherId: string, studentId: string) {
    if (!window.confirm("Remove this student from this teacher? Published tests from that teacher will stop being visible to the student.")) return;
    setError(null);
    const form = new FormData();
    form.set("teacherId", teacherId);
    form.set("studentId", studentId);
    startTransition(async () => {
      const result = await unassignRelationship(form);
      if ("error" in result) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <>
      <form action={assign} style={{ ...cardStyle, marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, alignItems: "end" }}>
        <label style={labelStyle}>
          Teacher
          <select name="teacherId" required defaultValue="" style={fieldStyle}>
            <option value="" disabled>Select teacher…</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.display_name || "Unnamed"}{t.username ? ` (@${t.username})` : ""}</option>)}
          </select>
        </label>
        <label style={labelStyle}>
          Student
          <select name="studentId" required defaultValue="" style={fieldStyle}>
            <option value="" disabled>Select student…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.display_name || "Unnamed"}{s.username ? ` (@${s.username})` : ""}</option>)}
          </select>
        </label>
        <div><button disabled={pending} style={buttonStyle}>{pending ? "Assigning…" : "Assign →"}</button></div>
      </form>
      {error && <p role="alert" style={{ color: "#a33" }}>{error}</p>}

      <section style={{ marginTop: 16, display: "grid", gap: 10 }}>
        {rows.map((row) => (
          <article key={`${row.teacher_id}:${row.student_id}`} style={{ ...cardStyle, display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
            <div>
              <strong>{row.student_name || "Unnamed student"}</strong>
              <span style={{ color: "var(--muted)" }}> learns from </span>
              <strong>{row.teacher_name || "Unnamed teacher"}</strong>
              <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
                since {new Date(row.created_at).toLocaleDateString()} · {row.status}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Link href={`/admin/users/${row.student_id}`} style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>Student →</Link>
              <button disabled={pending} onClick={() => unassign(row.teacher_id, row.student_id)} style={dangerStyle}>
                Remove
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

const labelStyle = { display: "grid", gap: 8, fontSize: 13, fontWeight: 700 };
const dangerStyle = { border: "1px solid #edd0d0", borderRadius: 999, padding: "8px 13px", background: "white", color: "#934848", cursor: "pointer", fontSize: 13, fontWeight: 700 } as const;
