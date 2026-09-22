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
  sources?: Array<{ title: string; page: number | null }>;
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

// Slightly richer renderer for the tutor's markdown-lite: headings, lists,
// inline code, bold, line breaks. User and assistant content is HTML-escaped
// first, so stored content can never inject markup.
function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+?)`/g, "<code>$1</code>");
}

// Exported for unit tests (pure function — no DOM, no secrets).
export function renderBody(content: string): string {
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };
  for (const line of escapeHtml(content).split("\n")) {
    const heading = line.match(/^#{2,3}\s+(.*)/);
    const bullet = line.match(/^[-•]\s+(.*)/);
    const ordered = line.match(/^\d+[.)]\s+(.*)/);
    if (heading) {
      closeList();
      out.push(`<h4>${renderInline(heading[1])}</h4>`);
    } else if (bullet) {
      if (list !== "ul") {
        closeList();
        out.push("<ul>");
        list = "ul";
      }
      out.push(`<li>${renderInline(bullet[1])}</li>`);
    } else if (ordered) {
      if (list !== "ol") {
        closeList();
        out.push("<ol>");
        list = "ol";
      }
      out.push(`<li>${renderInline(ordered[1])}</li>`);
    } else {
      closeList();
      out.push(line === "" ? "<br />" : `<p>${renderInline(line)}</p>`);
    }
  }
  closeList();
  return out.join("");
}

const QUICK_ACTIONS = [
  "Review my mistakes",
  "Explain a topic from my material",
  "Quiz me with 3 questions",
  "Build my revision plan",
];

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
    <div className="desk-chat">
      {materialScope && (
        <div className="desk-scope">
          <span>Asking about <strong>{materialScope.title}</strong></span>
          <button type="button" onClick={() => router.replace(conversationId ? `/app/chat?c=${conversationId}` : "/app/chat")}>
            Ask generally instead
          </button>
        </div>
      )}
      <div className="desk-thread" aria-live="polite">
        {initialMessages.map((message) => (
          <article key={message.id} className={message.role === "user" ? "desk-user" : "desk-assistant"}>
            {message.role === "user" ? (
              <span style={{ whiteSpace: "pre-wrap" }}>{message.content}</span>
            ) : (
              <span>
                {message.mode && <span className="desk-mode">{modeLabel(message.mode)}</span>}
                <span dangerouslySetInnerHTML={{ __html: renderBody(message.content) }} style={{ display: "block" }} />
                {message.sources && message.sources.length > 0 && (
                  <span className="desk-evidence">
                    Grounded in: {message.sources.map((s) => `${s.title}${s.page !== null ? ` · p. ${s.page}` : ""}`).join(" · ")}
                  </span>
                )}
              </span>
            )}
          </article>
        ))}
        {!initialMessages.length && (
          <div className="desk-welcome">
            <strong>Your desk is ready.</strong>
            <p>Pick a starting point below — or ask anything in your own words. Everything comes from your coursework.</p>
          </div>
        )}
        {pending && (
          <div className="desk-thinking" aria-label="Tutor is composing an answer">
            <span className="desk-dots" aria-hidden="true"><i /><i /><i /></span>
            Composing from your coursework…
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {error && <p role="alert" className="desk-error">{error}</p>}
      {!initialMessages.length && !pending && (
        <div className="desk-quick" role="group" aria-label="Quick learning actions">
          {QUICK_ACTIONS.map((action) => (
            <button key={action} type="button" onClick={() => submit(action)}>
              {action}
            </button>
          ))}
        </div>
      )}
      {lastAssistant?.suggestions && lastAssistant.suggestions.length > 0 && !pending && (
        <div className="desk-quick" role="group" aria-label="Suggested follow-ups">
          {lastAssistant.suggestions.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => submit(suggestion)}>
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
        className="desk-composer"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={2000}
          placeholder="Ask about your mistakes, progress, notes…"
          aria-label="Message the tutor"
        />
        <button type="submit" disabled={pending || !draft.trim()} className="primary-button">
          {pending ? "…" : "Send →"}
        </button>
      </form>
      <div className="desk-foot">
        {hasConversations && (
          <button type="button" onClick={() => router.replace("/app/chat")}>
            New conversation
          </button>
        )}
        {conversationId && (
          <button type="button" onClick={() => remove(conversationId)} disabled={pending}>
            Delete this conversation
          </button>
        )}
      </div>
    </div>
  );
}
