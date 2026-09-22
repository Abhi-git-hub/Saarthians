"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteConversation, sendChatMessage } from "./actions";

export type UIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  mode?: "grounded" | "general" | "fallback";
};

function modeLabel(mode: NonNullable<UIMessage["mode"]>): string {
  switch (mode) {
    case "grounded":
      return "Grounded in your material";
    case "general":
      return "General explanation";
    case "fallback":
      return "Study engine";
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Minimal safe renderer for the tutor's markdown-lite (bold + line breaks).
// User and assistant content is HTML-escaped first, so stored content can
// never inject markup.
function renderBody(content: string): string {
  return escapeHtml(content)
    .split("\n")
    .map((line) => {
      const bolded = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return bolded === "" ? "<br />" : `<p>${bolded}</p>`;
    })
    .join("");
}

export function ChatClient({
  conversationId,
  initialMessages,
  hasConversations,
  materialScope,
}: {
  conversationId: string | null;
  initialMessages: UIMessage[];
  hasConversations: boolean;
  materialScope: { id: string; title: string } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [initialMessages.length]);

  function submit(content: string) {
    const text = content.trim().slice(0, 2000);
    if (!text || pending) return;
    setError(null);
    setDraft("");
    startTransition(async () => {
      try {
        const result = await sendChatMessage({ conversationId, content: text, materialId: materialScope?.id ?? null });
        router.replace(
          materialScope ? `/app/chat?c=${result.conversationId}&m=${materialScope.id}` : `/app/chat?c=${result.conversationId}`,
        );
        router.refresh();
      } catch {
        setError("Couldn't send that. Check your connection and try again.");
      }
    });
  }

  function remove(id: string) {
    if (!window.confirm("Delete this conversation and all its messages?")) return;
    startTransition(async () => {
      try {
        await deleteConversation(id);
        router.replace("/app/chat");
        router.refresh();
      } catch {
        setError("Couldn't delete that conversation. Please try again.");
      }
    });
  }

  const lastAssistant = [...initialMessages].reverse().find((message) => message.role === "assistant");

  return (
    <div style={{ display: "grid", gap: 16, marginTop: 28 }}>
      {materialScope && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 999, padding: "10px 18px", background: "var(--paper)", color: "var(--muted)", fontSize: 13, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span>Asking about <strong style={{ color: "var(--ink)" }}>{materialScope.title}</strong></span>
          <button type="button" onClick={() => router.replace(conversationId ? `/app/chat?c=${conversationId}` : "/app/chat")} style={{ border: 0, background: "transparent", color: "var(--muted)", cursor: "pointer", textDecoration: "underline" }}>
            Ask generally instead
          </button>
        </div>
      )}
      <div style={{ display: "grid", gap: 12 }} aria-live="polite">
        {initialMessages.map((message) => (
          <article
            key={message.id}
            style={{
              justifySelf: message.role === "user" ? "end" : "start",
              maxWidth: "min(680px, 100%)",
              width: message.role === "user" ? "auto" : "100%",
              border: "1px solid var(--line)",
              borderRadius: 18,
              padding: "16px 18px",
              background: message.role === "user" ? "var(--accent)" : "white",
              color: message.role === "user" ? "white" : "var(--ink)",
              lineHeight: 1.7,
              fontSize: 15,
            }}
          >
            {message.role === "user" ? (
              <span style={{ whiteSpace: "pre-wrap" }}>{message.content}</span>
            ) : (
              <span>
                {message.mode && (
                  <span style={{ display: "inline-block", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", border: "1px solid var(--line)", borderRadius: 999, padding: "3px 10px", marginBottom: 8 }}>
                    {modeLabel(message.mode)}
                  </span>
                )}
                <span dangerouslySetInnerHTML={{ __html: renderBody(message.content) }} style={{ display: "block" }} />
              </span>
            )}
          </article>
        ))}
        {!initialMessages.length && (
          <div style={{ border: "1px solid var(--line)", borderRadius: 20, padding: 26, background: "white", color: "var(--muted)", lineHeight: 1.7 }}>
            This is the beginning of a new conversation. Ask me to <strong>review your mistakes</strong>, <strong>make a revision plan</strong>, or <strong>explain something from your notes</strong> — everything I say comes from your own coursework.
          </div>
        )}
        {pending && <div style={{ color: "var(--muted)", fontSize: 14 }}>Tutor is thinking…</div>}
        <div ref={bottomRef} />
      </div>
      {error && <p role="alert" style={{ color: "#a33", margin: 0 }}>{error}</p>}
      {lastAssistant?.suggestions && lastAssistant.suggestions.length > 0 && !pending && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {lastAssistant.suggestions.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => submit(suggestion)} style={chipStyle}>
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
        style={{ display: "flex", gap: 10, position: "sticky", bottom: 12 }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={2000}
          placeholder="Ask about your mistakes, progress, notes…"
          aria-label="Message the tutor"
          style={inputStyle}
        />
        <button type="submit" disabled={pending || !draft.trim()} style={buttonStyle}>
          {pending ? "…" : "Send →"}
        </button>
      </form>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {hasConversations && (
          <button type="button" onClick={() => router.replace("/app/chat")} style={ghostStyle}>
            New conversation
          </button>
        )}
        {conversationId && (
          <button type="button" onClick={() => remove(conversationId)} disabled={pending} style={ghostStyle}>
            Delete this conversation
          </button>
        )}
      </div>
    </div>
  );
}

const inputStyle = { flex: 1, minWidth: 0, border: "1px solid var(--line)", borderRadius: 999, padding: "14px 18px", background: "white", color: "var(--ink)", font: "inherit", boxShadow: "0 8px 30px rgba(16,24,39,.08)" };
const buttonStyle = { border: 0, borderRadius: 999, padding: "14px 22px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer", whiteSpace: "nowrap" as const };
const ghostStyle = { border: "1px solid var(--line)", borderRadius: 999, padding: "10px 16px", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 13 };
const chipStyle = { border: "1px solid var(--line)", borderRadius: 999, padding: "9px 15px", background: "white", color: "var(--ink)", cursor: "pointer", fontSize: 13, fontWeight: 650 };
