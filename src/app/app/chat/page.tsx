import Link from "next/link";
import { getConversation, listConversations } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { PageHeading } from "@/components/ui";
import { ChatClient, type UIMessage } from "./chat-client";

function toUIMessages(messages: Array<{ id: string; role: string; content: string; context_metadata_json?: unknown }>): UIMessage[] {
  return messages.map((message) => {
    const metadata =
      message.context_metadata_json && typeof message.context_metadata_json === "object"
        ? (message.context_metadata_json as { suggestions?: unknown; mode?: unknown; sources?: unknown })
        : null;
    const suggestions = Array.isArray(metadata?.suggestions)
      ? metadata.suggestions.filter((suggestion): suggestion is string => typeof suggestion === "string").slice(0, 4)
      : undefined;
    const mode =
      metadata?.mode === "grounded" || metadata?.mode === "general" || metadata?.mode === "fallback"
        ? metadata.mode
        : undefined;
    const sources = Array.isArray(metadata?.sources)
      ? metadata.sources
          .map((s) => {
            const r = (typeof s === "object" && s !== null ? s : {}) as Record<string, unknown>;
            if (typeof r.title !== "string") return null;
            return { title: r.title, page: typeof r.page === "number" ? r.page : null };
          })
          .filter((s): s is { title: string; page: number | null } => s !== null)
          .slice(0, 4)
      : undefined;
    return {
      id: message.id,
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
      suggestions,
      mode,
      sources,
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
  const requestedMaterial = typeof params.m === "string" ? params.m : null;

  const conversations = await listConversations();
  const activeId = requestedId ?? conversations[0]?.id ?? null;
  const active = activeId ? await getConversation(activeId).catch(() => null) : null;

  // "Ask tutor about this PDF": resolve the scope title through RLS so an
  // unauthorized id simply shows no scope instead of leaking existence.
  let materialScope: { id: string; title: string } | null = null;
  if (requestedMaterial && /^[0-9a-f-]{36}$/i.test(requestedMaterial)) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("study_materials")
      .select("id,title")
      .eq("id", requestedMaterial)
      .eq("processing_status", "ready")
      .single();
    if (data) materialScope = { id: data.id, title: data.title };
  }

  type RawMessage = { id: string; role: string; content: string; context_metadata_json?: unknown };
  const rawMessages = (active?.messages ?? []) as RawMessage[];
  const uiMessages = toUIMessages(rawMessages);
  const lastAssistant = [...uiMessages].reverse().find((m) => m.role === "assistant" && (m.sources?.length ?? 0) > 0);
  const lastSources = lastAssistant?.sources ?? [];

  return (
    <main className="workspace-page">
      <div className="container">
        <PageHeading
          eyebrow="AI Tutor · your study desk"
          title={<>Study with <em>direction.</em></>}
          lede="Answers from your own coursework — graded mistakes, notes, and progress. Nothing invented, nothing borrowed."
          action={<Link href="/app/chat" className="primary-button">New chat →</Link>}
        />
        <div className="desk-grid">
          <div className="desk-main">
            {conversations.length > 1 && (
              <div className="desk-history" aria-label="Past conversations">
                {conversations.slice(0, 8).map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/app/chat?c=${conversation.id}`}
                    aria-current={conversation.id === activeId ? "true" : undefined}
                    className={conversation.id === activeId ? "is-active" : ""}
                  >
                    {conversation.title || "Conversation"}
                  </Link>
                ))}
              </div>
            )}
            <ChatClient
              conversationId={active?.conversation.id ?? null}
              initialMessages={uiMessages}
              hasConversations={conversations.length > 0}
              materialScope={materialScope}
            />
          </div>
          <aside className="desk-rail" aria-label="Desk context">
            <section>
              <span className="eyebrow">On this desk</span>
              <ul>
                <li>{materialScope ? <>Asking about <strong>{materialScope.title}</strong></> : "Your full coursework"}</li>
                <li>Graded mistakes & progress</li>
                <li>Your notes & study material</li>
              </ul>
            </section>
            <section>
              <span className="eyebrow">How answers are marked</span>
              <ul className="desk-legend">
                <li><b>Grounded</b> — from your material</li>
                <li><b>General</b> — model knowledge, labeled</li>
                <li><b>Engine</b> — local fallback</li>
              </ul>
            </section>
            {lastSources.length > 0 && (
              <section>
                <span className="eyebrow">Grounded in</span>
                <ul className="desk-sources">
                  {lastSources.map((source, i) => (
                    <li key={i}>
                      {source.title}
                      {source.page !== null && <span> · p. {source.page}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section>
              <Link href="/app/materials" className="text-link">Browse material →</Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
