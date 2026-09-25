"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { provisionAccount } from "./users/actions";

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
  const router = useRouter();
  const [form, setForm] = useState({ ...emptyForm, role: initialRole });
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  function updateField<Key extends keyof typeof emptyForm>(key: Key, value: string) {
    setForm((v) => ({ ...v, [key]: value }));
    setFieldErrors((v) => {
      if (!v[key]) return v;
      const next = { ...v };
      delete next[key];
      return next;
    });
  }

  // Instant client-side check mirroring the server contract (single source
  // of truth stays server-side; this only surfaces obvious misses without a
  // roundtrip). Returns per-field messages, empty when the form is sendable.
  function clientCheck(values: typeof emptyForm): Record<string, string> {
    const errors: Record<string, string> = {};
    if (values.displayName.trim().length < 1) errors.displayName = "Enter the full name.";
    else if (values.displayName.trim().length > 120) errors.displayName = "Keep the name under 120 characters.";
    const username = values.username.trim().toLowerCase();
    if (username.length < 3) errors.username = "Username needs at least 3 characters.";
    else if (username.length > 30) errors.username = "Keep the username under 30 characters.";
    else if (!/^[a-z0-9](?:[a-z0-9._-]{2,29})$/.test(username))
      errors.username = "Only lowercase letters, numbers, dots, hyphens and underscores — no spaces.";
    if (values.password.length < 10) errors.password = "Password needs at least 10 characters.";
    else if (values.password.length > 128) errors.password = "Keep the password under 128 characters.";
    if (values.phone.trim().length > 32) errors.phone = "Keep the phone number under 32 characters.";
    if (values.role === "student" && values.gradeLevel.trim().length > 40)
      errors.gradeLevel = "Keep the class under 40 characters.";
    if (values.role === "teacher" && values.subject.trim().length > 120)
      errors.subject = "Keep the subject under 120 characters.";
    if (values.role !== "student" && values.role !== "teacher") errors.role = "Choose student or teacher.";
    return errors;
  }

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return initialUsers;
    return initialUsers.filter((item) => `${item.display_name} ${item.username ?? ""} ${item.role}`.toLowerCase().includes(normalized));
  }, [initialUsers, query]);

  // Provisioning always goes through the provisionAccount server action:
  // server-side requireRole(["admin"]) + Zod validation first, then the single
  // audited provision-user Edge Function invoked with the admin session. The
  // browser never calls the Edge Function directly.
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problems = clientCheck(form);
    setFieldErrors(problems);
    if (Object.keys(problems).length > 0) {
      setFeedback({ kind: "error", text: "Check the highlighted details and try again." });
      return;
    }
    setPending(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.set("username", form.username);
      formData.set("displayName", form.displayName);
      formData.set("password", form.password);
      formData.set("role", form.role);
      formData.set("phone", form.phone);
      formData.set("gradeLevel", form.gradeLevel);
      formData.set("subject", form.subject);
      const result = await provisionAccount(formData);
      if ("error" in result) {
        setFeedback({ kind: "error", text: result.error });
        if (result.fields) setFieldErrors(result.fields);
        return;
      }
      setFeedback({ kind: "success", text: `Account @${result.username ?? form.username} is active and ready to use.` });
      setForm({ ...emptyForm, role: initialRole });
      router.refresh();
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
        <form onSubmit={submit} className="provision-form" noValidate>
          <div className="field-grid two">
            <label className="field-label">Full name
              <input maxLength={120} value={form.displayName} onChange={(e) => updateField("displayName", e.target.value)} aria-invalid={Boolean(fieldErrors.displayName)} aria-describedby={fieldErrors.displayName ? "err-displayName" : undefined} />
              {fieldErrors.displayName && <span id="err-displayName" role="alert" className="std-form-error">{fieldErrors.displayName}</span>}
            </label>
            <label className="field-label">Username
              <input minLength={3} maxLength={30} autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false} value={form.username} onChange={(e) => updateField("username", e.target.value.toLowerCase().replace(/\s+/g, ""))} placeholder="e.g. ananya.sharma" aria-invalid={Boolean(fieldErrors.username)} aria-describedby={fieldErrors.username ? "err-username" : "username-hint"} />
              <span id="username-hint" className="std-form-hint">Lowercase letters, numbers, dots only — becomes {form.username ? `${form.username}@accounts.saarthians.online` : "…@accounts.saarthians.online"}</span>
              {fieldErrors.username && <span id="err-username" role="alert" className="std-form-error">{fieldErrors.username}</span>}
            </label>
          </div>
          <div className="field-grid two">
            <label className="field-label">Role<select value={form.role} onChange={(e) => updateField("role", e.target.value)} aria-invalid={Boolean(fieldErrors.role)}><option value="student">Student</option><option value="teacher">Teacher</option></select>
              {fieldErrors.role && <span role="alert" className="std-form-error">{fieldErrors.role}</span>}
            </label>
            <label className="field-label">Initial password
              <span className="password-row">
                <input minLength={10} maxLength={128} type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(e) => updateField("password", e.target.value)} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "err-password" : "password-hint"} />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
              <span id="password-hint" className="std-form-hint">At least 10 characters{form.password ? ` · ${form.password.length} entered` : ""}.</span>
              {fieldErrors.password && <span id="err-password" role="alert" className="std-form-error">{fieldErrors.password}</span>}
            </label>
          </div>
          <div className="field-grid two">
            <label className="field-label">Phone <span>optional</span>
              <input maxLength={32} inputMode="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} aria-invalid={Boolean(fieldErrors.phone)} />
              {fieldErrors.phone && <span role="alert" className="std-form-error">{fieldErrors.phone}</span>}
            </label>
            {roleIsStudent ? (
              <label className="field-label">Class / grade <span>optional</span>
                <input maxLength={40} value={form.gradeLevel} onChange={(e) => updateField("gradeLevel", e.target.value)} placeholder="e.g. Class 10" aria-invalid={Boolean(fieldErrors.gradeLevel)} />
                {fieldErrors.gradeLevel && <span role="alert" className="std-form-error">{fieldErrors.gradeLevel}</span>}
              </label>
            ) : (
              <label className="field-label">Teaching subject <span>optional</span>
                <input maxLength={120} value={form.subject} onChange={(e) => updateField("subject", e.target.value)} placeholder="e.g. Mathematics" aria-invalid={Boolean(fieldErrors.subject)} />
                {fieldErrors.subject && <span role="alert" className="std-form-error">{fieldErrors.subject}</span>}
              </label>
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
