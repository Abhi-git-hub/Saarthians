"use client";

import { useRef, useState, useTransition } from "react";
import { addNoteImage, removeNoteImage } from "@/lib/note-images";
import type { NoteImage } from "@/lib/notes";

// Pictures on a note: everyone logged in sees them, only the owner adds or
// removes. Uploads go through a server action so validation and ownership
// never live in the browser.
export function NoteImagesManager({
  noteId,
  images,
  canEdit,
}: {
  noteId: string;
  images: NoteImage[];
  canEdit: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function upload(formData: FormData) {
    setNotice(null);
    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      setNotice("Pick a picture first.");
      return;
    }
    startTransition(async () => {
      try {
        await addNoteImage(noteId, formData);
        fileRef.current?.form?.reset();
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Could not add the picture.");
      }
    });
  }

  function remove(imageId: string) {
    setNotice(null);
    startTransition(async () => {
      try {
        await removeNoteImage(imageId);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Could not remove the picture.");
      }
    });
  }

  return (
    <section style={{ marginTop: 40 }} aria-label="Note pictures">
      <span className="eyebrow">Pictures</span>
      <h2 style={{ fontSize: 26, letterSpacing: "-.03em", margin: "12px 0 4px" }}>
        {images.length > 0 ? "See it, remember it." : "A picture explains faster."}
      </h2>
      {images.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14, marginTop: 18 }}>
          {images.map((image) => (
            <figure key={image.id} style={{ margin: 0, border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", background: "white" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="Picture attached to the note" loading="lazy" style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
              {canEdit && (
                <figcaption style={{ padding: "8px 12px", textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={() => remove(image.id)}
                    disabled={pending}
                    style={{ border: 0, background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 13 }}
                  >
                    Remove
                  </button>
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "8px 0 0" }}>
          {canEdit ? "No pictures yet — attach a diagram, a solved sum, or the board." : "No pictures on this note yet."}
        </p>
      )}
      {canEdit && (
        <form action={upload} style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
          <input
            ref={fileRef}
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Picture to attach"
            style={{ font: "inherit", fontSize: 14 }}
          />
          <button
            type="submit"
            disabled={pending}
            style={{ border: 0, borderRadius: 999, padding: "12px 20px", background: "var(--accent)", color: "white", fontWeight: 750, cursor: "pointer" }}
          >
            {pending ? "Adding…" : "Add picture →"}
          </button>
        </form>
      )}
      {notice && <p role="alert" style={{ color: "#a33", margin: "12px 0 0" }}>{notice}</p>}
      {canEdit && <p style={{ color: "var(--muted)", fontSize: 13, margin: "10px 0 0" }}>JPG, PNG, or WebP · up to 5 MB · 10 pictures per note.</p>}
    </section>
  );
}
