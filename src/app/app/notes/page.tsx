import Link from "next/link";
import { deleteNote } from "../actions";
import { getSharedNotes, getStudentNotes } from "@/lib/student";
import { EmptyState, PageHeading, StatusPill } from "@/components/ui";

function readingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return "Empty";
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const [notes, shared] = await Promise.all([getStudentNotes(search), getSharedNotes(search)]);

  return (
    <main className="workspace-page">
      <div className="container">
        <PageHeading
          eyebrow="Notes · your library"
          title={<>Think on <em>paper.</em></>}
          lede="Private by default. Yours to revisit, revise and learn from."
          action={<Link href="/app/notes/new" className="primary-button">New note →</Link>}
        />
        <form method="get" className="library-search" role="search">
          <input
            name="q"
            defaultValue={search}
            maxLength={120}
            placeholder="Search your notes…  ( press / )"
            aria-label="Search notes"
            className="library-search-input"
          />
          <button type="submit" className="primary-button">Search</button>
          {search && <Link href="/app/notes" className="text-link">Clear</Link>}
        </form>
        {notes.length > 0 ? (
          <div className="data-rows">
            {notes.map((note) => (
              <div key={note.id} className="data-row">
                <span className="data-row-main">
                  <Link href={`/app/notes/${note.id}`}><strong>{note.title}</strong></Link>
                  <span>
                    {readingTime(note.content)} · {note.visibility}
                    {note.updated_at ? ` · edited ${new Date(note.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                  </span>
                </span>
                <span className="data-row-side">
                  <StatusPill tone={note.visibility === "published" ? "info" : "idle"}>{note.visibility}</StatusPill>
                  <form action={deleteNote}>
                    <input type="hidden" name="id" value={note.id} />
                    <button type="submit" className="row-delete">Delete</button>
                  </form>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={search ? "Nothing matches that search." : "Your library opens empty — deliberately."}
            body={
              search
                ? "Try fewer words, or a different spelling. Search covers titles and content."
                : "Start with the idea you keep coming back to. One honest paragraph beats ten copied pages."
            }
            action={search ? undefined : { href: "/app/notes/new", label: "Write your first note →" }}
          />
        )}
        <section className="library-shared">
          <span className="eyebrow">Shared with you</span>
          <h2>From your teachers.</h2>
          {shared.length > 0 ? (
            <div className="data-rows">
              {shared.map((note) => (
                <Link href={`/app/notes/${note.id}`} key={note.id} className="data-row">
                  <span className="data-row-main">
                    <strong>{note.title}</strong>
                    <span>{readingTime(note.content)} · shared note</span>
                  </span>
                  <span className="data-row-side"><span className="row-arrow" aria-hidden="true">→</span></span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No shared material yet."
              body="Anything a teacher shares with you will appear here, ready to read and ask the tutor about."
            />
          )}
        </section>
      </div>
    </main>
  );
}
