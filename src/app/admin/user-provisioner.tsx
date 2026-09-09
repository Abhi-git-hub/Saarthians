"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type AdminManagedUser = {
  id: string;
  display_name: string;
  username: string | null;
  role: "student" | "teacher" | "admin";
  status: "active" | "suspended" | "pending";
  phone: string | null;
  grade_level: string | null;
  subject: string | null;
  created_at: string;
};

const emptyForm = { displayName: "", username: "", role: "student", password: "", phone: "", gradeLevel: "", subject: "" };

export function AdminUserProvisioner({ initialUsers, initialRole = "student" }: { initialUsers: AdminManagedUser[]; initialRole?: "student" | "teacher" }) {
  const [form, setForm] = useState({ ...emptyForm, role: initialRole });
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return initialUsers;
    return initialUsers.filter((item) => `${item.display_name} ${item.username ?? ""} ${item.role}`.toLowerCase().includes(normalized));
  }, [initialUsers, query]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFeedback(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke("provision-user", {
        body: form,
      });
      if (error || !data?.ok) {
        setFeedback({ kind: "error", text: data?.error ?? "We couldn't provision that account." });
        return;
      }
      setFeedback({ kind: "success", text: `Account @${data.user.username} is active and ready to use.` });
      setForm({ ...emptyForm, role: initialRole });
      window.location.reload();
    } catch {
      setFeedback({ kind: "error", text: "We couldn't provision that account. Please try again." });
    } finally {
      setPending(false);
    }
  }

  const roleIsStudent = form.role === "student";

  return (
    <div className="provision-stack">
      <section className="surface-card" aria-labelledby="provision-title">
        <div className="section-heading"><div><span className="eyebrow">New account</span><h2 id="provision-title">Provision a workspace.</h2></div><span className="section-badge">Admin only</span></div>
        <form onSubmit={submit} className="provision-form">
          <div className="field-grid two">
            <label className="field-label">Full name<input required maxLength={120} value={form.displayName} onChange={(e) => setForm((v) => ({ ...v, displayName: e.target.value }))} /></label>
            <label className="field-label">Username<input required minLength={3} maxLength={30} autoCapitalize="none" autoCorrect="off" value={form.username} onChange={(e) => setForm((v) => ({ ...v, username: e.target.value.toLowerCase() }))} placeholder="e.g. ananya.sharma" /></label>
          </div>
          <div className="field-grid two">
            <label className="field-label">Role<select value={form.role} onChange={(e) => setForm((v) => ({ ...v, role: e.target.value as "student" | "teacher" }))}><option value="student">Student</option><option value="teacher">Teacher</option></select></label>
            <label className="field-label">Initial password<input required minLength={10} maxLength={128} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} /></label>
          </div>
          <div className="field-grid two">
            <label className="field-label">Phone <span>optional</span><input maxLength={32} inputMode="tel" value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} /></label>
            {roleIsStudent ? (
              <label className="field-label">Class / grade <span>optional</span><input maxLength={40} value={form.gradeLevel} onChange={(e) => setForm((v) => ({ ...v, gradeLevel: e.target.value }))} placeholder="e.g. Class 10" /></label>
            ) : (
              <label className="field-label">Teaching subject <span>optional</span><input maxLength={120} value={form.subject} onChange={(e) => setForm((v) => ({ ...v, subject: e.target.value }))} placeholder="e.g. Mathematics" /></label>
            )}
          </div>
          {feedback && <p className={feedback.kind === "error" ? "form-error" : "form-success"} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.text}</p>}
          <div className="form-actions"><p>Credentials are shown only while you enter them. Keep the assigned password private.</p><button className="primary-button" disabled={pending}>{pending ? "Provisioning…" : "Create account →"}</button></div>
        </form>
      </section>

      <section className="surface-card" aria-labelledby="user-list-title">
        <div className="section-heading"><div><span className="eyebrow">Directory</span><h2 id="user-list-title">People in Saarthians.</h2></div><input className="search-input" aria-label="Search users" placeholder="Search name or username" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div className="user-table" role="table" aria-label="Saarthians user directory">
          {filteredUsers.map((item) => (
            <div className="user-row" key={item.id} role="row">
              <div className="user-avatar" aria-hidden="true">{item.display_name.slice(0, 1).toUpperCase()}</div>
              <div className="user-main"><strong>{item.display_name}</strong><span>{item.username ? `@${item.username}` : "No username"}</span></div>
              <span className={`role-chip ${item.role}`}>{item.role}</span>
              <span className={`status-chip ${item.status}`}>{item.status}</span>
              <span className="user-detail">{item.role === "student" ? item.grade_level ?? "Student" : item.subject ?? "Teacher"}</span>
            </div>
          ))}
          {!filteredUsers.length && <div className="empty-state">No profiles match that search.</div>}
        </div>
      </section>
    </div>
  );
}
