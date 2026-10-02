import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader, cardStyle } from "@/components/admin/ui";
import { deleteMessage, markMessageRead } from "./actions";

export default async function AdminInboxPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id,name,contact,message,created_at,read_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("ADMIN_DATA_UNAVAILABLE");
  const messages = data ?? [];
  const unread = messages.filter((m) => !m.read_at).length;

  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <Link href="/admin" style={{ color: "var(--muted)", fontSize: 13 }}>← Administration</Link>
      <div style={{ marginTop: 24 }}>
        <PageHeader
          eyebrow="Inbox"
          title="Contact messages."
        />
        <p style={{ color: "var(--muted)" }}>
          {messages.length === 0
            ? "No messages yet. New enquiries from the contact form land here."
            : `${unread} unread of ${messages.length} recent messages. Reply on the phone or email they left.`}
        </p>
      </div>
      <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
        {messages.map((message) => (
          <article key={message.id} style={{ ...cardStyle, borderLeft: message.read_at ? undefined : "4px solid var(--accent)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
              <strong>{message.name} <span style={{ color: "var(--muted)", fontWeight: 400 }}>· {message.contact}</span></strong>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>
                {new Date(message.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p style={{ whiteSpace: "pre-wrap", margin: "10px 0 0", lineHeight: 1.6 }}>{message.message}</p>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              {!message.read_at && (
                <form action={markMessageRead}>
                  <input type="hidden" name="id" value={message.id} />
                  <button type="submit" style={smallButton}>Mark read</button>
                </form>
              )}
              <form action={deleteMessage}>
                <input type="hidden" name="id" value={message.id} />
                <button type="submit" style={{ ...smallButton, color: "var(--muted)" }}>Delete</button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

const smallButton = {
  border: "1px solid var(--line)",
  background: "white",
  borderRadius: 999,
  padding: "8px 16px",
  fontWeight: 700,
  cursor: "pointer",
  color: "var(--ink)",
  font: "inherit",
  fontSize: 13,
};
