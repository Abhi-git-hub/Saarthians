import Link from "next/link";
import { createTeacherNote } from "../actions";
import { PageHeading } from "@/components/ui";

export default function NewTeacherNotePage() {
  return (
    <main className="workspace-page">
      <div className="container" style={{ maxWidth: 920 }}>
        <Link href="/teacher/notes" style={{ color: "var(--muted)", fontSize: 13 }}>← Back to material</Link>
        <PageHeading
          eyebrow="New material"
          title={<>Write it <em>once.</em></>}
          lede="Explain it the way you would in class. Everyone logged in reads exactly this — attach pictures where words fall short."
        />
        <form action={createTeacherNote} className="std-form">
          <label>Title<input name="title" required maxLength={200} placeholder="e.g. Fractions — the pizza method" /></label>
          <label>Content<textarea name="content" rows={15} maxLength={50000} placeholder="Explain it the way you would in class…" /></label>
          <div className="std-form-actions">
            <button type="submit" className="primary-button">Save material →</button>
            <Link href="/teacher/notes" style={{ color: "var(--muted)", fontSize: 14 }}>Cancel</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
