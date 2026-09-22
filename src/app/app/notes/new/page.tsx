import Link from "next/link";
import { createNote } from "../../actions";
import { PageHeading } from "@/components/ui";

export default function NewNotePage() {
  return (
    <main className="workspace-page">
      <div className="container" style={{ maxWidth: 920 }}>
        <Link href="/app/notes" style={{ color: "var(--muted)", fontSize: 13 }}>← Back to notes</Link>
        <PageHeading
          eyebrow="New note"
          title={<>Capture the <em>thought.</em></>}
        />
        <form action={createNote} className="std-form">
          <label>Title<input name="title" required maxLength={200} placeholder="e.g. Newton's laws — what I still don't understand" /></label>
          <label>Content<textarea name="content" rows={15} maxLength={50000} placeholder="Write, work through a problem, or explain the idea in your own words…" /></label>
          <label>Visibility
            <select name="visibility" defaultValue="private">
              <option value="private">Private</option>
              <option value="shared">Shared</option>
              <option value="published">Published</option>
            </select>
            <span className="std-form-hint">Private notes stay yours. Shared and published notes can reach teachers and the tutor.</span>
          </label>
          <div className="std-form-actions">
            <button type="submit" className="primary-button">Save note →</button>
            <Link href="/app/notes" style={{ color: "var(--muted)", fontSize: 14 }}>Cancel</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
