import Link from "next/link";
import { deleteNote } from "../actions";
import { requireRole } from "@/lib/auth";
import { getAllNotes } from "@/lib/notes";
import { EmptyState, PageHeading } from "@/components/ui";

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
  const user = await requireRole(["student"]);
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const notes = await getAllNotes(search);

  return (
    <main className="workspace-page">
      <div className="container">
        <PageHeading
          eyebrow="Notes · shared library"
          title={<>Everyone's <em>notes.</em></>}
          lede="Every note any of us writes lives here. Read anyone's, add your own, attach pictures."
          action={<Link href="/app/notes/new" className="primary-button">New note →</Link>}
        />
        <form method="get" className="library-search" role="search">
          <input
            name="q"
            defaultValue={search}
            maxLength={120}
            placeholder="Search all notes…  ( press / )"
            aria-label="Search notes"
            className="library-search-input"
          />
          <button type="submit" className="primary-button">Search</button>
          {search && <Link href="/app/notes" className="text-link">Clear</Link>}
        </form>
        {notes.length > 0 ? (
          <div className="data-rows">
            {notes.map((note) => {
              const own = note.owner_user_id === user.id;
              return (
                <div key={note.id} className="data-row">
                  <span className="data-row-main">
                    <Link href={`/app/notes/${note.id}`}><strong>{note.title}</strong></Link>
                    <span>
                      by {own ? "you" : note.owner_name} · {readingTime(note.content)}
                      {note.updated_at ? ` · edited ${new Date(note.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                    </span>
                  </span>
                  {own && (
                    <span className="data-row-side">
                      <form action={deleteNote}>
                        <input type="hidden" name="id" value={note.id} />
                        <button type="submit" className="row-delete">Delete</button>
                      </form>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={search ? "Nothing matches that search." : "The library opens empty — deliberately."}
            body={
              search
                ? "Try fewer words, or a different spelling. Search covers titles and content."
                : "Start with the idea you keep coming back to. One honest paragraph beats ten copied pages."
            }
            action={search ? undefined : { href: "/app/notes/new", label: "Write the first note →" }}
          />
        )}
      </div>
    </main>
  );
}
