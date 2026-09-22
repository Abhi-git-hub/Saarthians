import Link from "next/link";
import { getConversation, listConversations } from "./actions";
import { ChatClient, type UIMessage } from "./chat-client";

function toUIMessages(messages: Array<{ id: string; role: string; content: string; context_metadata_json?: unknown }>): UIMessage[] {
  return messages.map((message) => {
    const metadata =
      message.context_metadata_json && typeof message.context_metadata_json === "object"
        ? (message.context_metadata_json as { suggestions?: unknown })
        : null;
    const suggestions = Array.isArray(metadata?.suggestions)
      ? metadata.suggestions.filter((suggestion): suggestion is string => typeof suggestion === "string").slice(0, 4)
      : undefined;
    return {
      id: message.id,
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
      suggestions,
    };
  });
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedId = typeof params.c === "string" ? params.c : null;

  const conversations = await listConversations();
  const activeId = requestedId ?? conversations[0]?.id ?? null;
  const active = activeId ? await getConversation(activeId).catch(() => null) : null;

  return (
    <main className="container" style={{ padding: "48px 0 80px", maxWidth: 920 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "end", flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow">AI Tutor</span>
          <h1 style={{ fontSize: "clamp(40px,6vw,64px)", lineHeight: .95, letterSpacing: "-.06em", margin: "18px 0 10px" }}>Study with direction.</h1>
          <p style={{ color: "var(--muted)", maxWidth: 640, lineHeight: 1.65, margin: 0 }}>Your tutor answers from your own coursework — graded mistakes, notes, and progress. Nothing invented, nothing borrowed from other students.</p>
        </div>
        <Link href="/app/chat" style={{ border: "1px solid var(--line)", borderRadius: 999, padding: "12px 18px", fontWeight: 700, fontSize: 14, background: "white" }}>New chat →</Link>
      </div>
      {conversations.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 22 }} aria-label="Past conversations">
          {conversations.slice(0, 8).map((conversation) => (
            <Link
              key={conversation.id}
              href={`/app/chat?c=${conversation.id}`}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: conversation.id === activeId ? 800 : 500,
                background: conversation.id === activeId ? "var(--paper)" : "white",
                color: "var(--muted)",
                maxWidth: 240,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {conversation.title || "Conversation"}
            </Link>
          ))}
        </div>
      )}
      <ChatClient
        conversationId={active?.conversation.id ?? null}
        initialMessages={active ? toUIMessages(active.messages as Array<{ id: string; role: string; content: string; context_metadata_json?: unknown }>) : []}
        hasConversations={conversations.length > 0}
      />
    </main>
  );
}
