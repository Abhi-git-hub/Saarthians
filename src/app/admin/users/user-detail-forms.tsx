"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserStatus, updateUserProfile } from "./actions";
import { buttonStyle, cardStyle, fieldStyle } from "@/components/admin/ui";

function useAction<T extends FormData>(fn: (form: T) => Promise<{ ok: true } | { error: string }>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function run(formData: FormData) {
    setError(null);
    setDone(null);
    startTransition(async () => {
      const result = await fn(formData as T);
      if ("error" in result) setError(result.error);
      else {
        setDone("Saved.");
        router.refresh();
      }
    });
  }

  return { pending, error, done, run, clear: () => { setError(null); setDone(null); } };
}

export function ProfileEditForm({
  userId,
  displayName,
  phone,
  gradeLevel,
  subject,
  role,
}: {
  userId: string;
  displayName: string;
  phone: string | null;
  gradeLevel: string | null;
  subject: string | null;
  role: string;
}) {
  const { pending, error, done, run } = useAction(updateUserProfile);
  return (
    <form action={run} style={{ ...cardStyle, display: "grid", gap: 12 }}>
      <input type="hidden" name="userId" value={userId} />
      <span className="eyebrow">Profile</span>
      <label style={labelStyle}>
        Display name
        <input name="displayName" required maxLength={120} defaultValue={displayName} style={fieldStyle} />
      </label>
      <label style={labelStyle}>
        Phone <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span>
        <input name="phone" maxLength={32} inputMode="tel" defaultValue={phone ?? ""} style={fieldStyle} />
      </label>
      {role === "student" && (
        <label style={labelStyle}>
          Class / grade <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span>
          <input name="gradeLevel" maxLength={40} defaultValue={gradeLevel ?? ""} style={fieldStyle} />
        </label>
      )}
      {role === "teacher" && (
        <label style={labelStyle}>
          Teaching subject <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span>
          <input name="subject" maxLength={120} defaultValue={subject ?? ""} style={fieldStyle} />
        </label>
      )}
      {error && <p role="alert" style={errorStyle}>{error}</p>}
      {done && <p role="status" style={okStyle}>{done}</p>}
      <div><button disabled={pending} style={buttonStyle}>{pending ? "Saving…" : "Save profile"}</button></div>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
        Role, status, and username change through their own protected paths — not here.
      </p>
    </form>
  );
}

export function StatusForm({ userId, status, isSelf }: { userId: string; status: string; isSelf: boolean }) {
  const { pending, error, done, run } = useAction(setUserStatus);

  function submit(formData: FormData) {
    const next = String(formData.get("status") ?? "");
    if ((next === "suspended" || next === "pending") && status === "active") {
      const confirmed = window.confirm(
        next === "suspended"
          ? "Suspend this account? They will be signed out of protected areas immediately on next check."
          : "Move this account back to pending? They will not be able to sign in until re-activated.",
      );
      if (!confirmed) return;
    }
    run(formData);
  }

  return (
    <form action={submit} style={{ ...cardStyle, display: "grid", gap: 12 }}>
      <input type="hidden" name="userId" value={userId} />
      <span className="eyebrow">Account status</span>
      {isSelf ? (
        <p style={{ color: "var(--muted)", margin: 0, fontSize: 14 }}>
          You cannot change your own status. Ask another administrator.
        </p>
      ) : (
        <>
          <label style={labelStyle}>
            Status
            <select name="status" defaultValue={status} style={fieldStyle}>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
          {error && <p role="alert" style={errorStyle}>{error}</p>}
          {done && <p role="status" style={okStyle}>{done}</p>}
          <div><button disabled={pending} style={buttonStyle}>{pending ? "Saving…" : "Apply status"}</button></div>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            Suspended and pending accounts are rejected by server authorization — not merely hidden.
          </p>
        </>
      )}
    </form>
  );
}

const labelStyle = { display: "grid", gap: 8, fontSize: 14, fontWeight: 700 };
const errorStyle = { color: "#a33", margin: 0 };
const okStyle = { color: "var(--accent)", margin: 0, fontWeight: 650 };
