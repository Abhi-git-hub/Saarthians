# Saarthians Learning Engine — architecture notes

## Storage (canonical rule)

**The PDF binary lives in Supabase Storage; metadata/chunks/embeddings live in PostgreSQL.**
Nothing else stores file bytes. The database never holds a PDF.

- Private bucket `study-materials/<teacher_uuid>/<material_id>/material.pdf`
- Private bucket `assessments/<teacher_uuid>/<test_id>/test.pdf`
- `study_materials` — ownership, tags, sizes, pipeline statuses
- `study_material_chunks` — page_number, chunk_index, text
- `study_material_embeddings` — chunk_id → vector(768), model name

## PDF pipeline (teacher upload → READY)

`POST /api/teacher/materials/upload` (Route Handler — Server Actions cap
payloads far below the 15 MB product limit):

1. **Validate** (`src/lib/materials/pdf.ts`): magic bytes `%PDF-` (never trust
   browser MIME alone), `.pdf` extension, size ≤ 15 MB, pdf-lib can open it
   with ≥ 1 page. Encrypted PDFs are rejected with a reason.
2. **Optimize** (pdf-lib, pure JS): strip document metadata, rewrite with
   compressed object streams. **Smaller file wins, otherwise the original is
   kept** — compression never enlarges a file. Text is never rasterized:
   selectable text, vectors, and page structure survive. Only measured,
   honest numbers are shown (`saved x%` vs `stored without additional
   compression`).
3. **Store** the canonical file; the original is not retained separately.
4. **Extract** (pdf.js primary; raw text-operator scraping fallback) from the
   ORIGINAL bytes first. The optimized copy is re-extracted and kept only
   if it preserves ≥90% of the characters — stored bytes and indexed text
   always come from the same source. Failures report per-page diagnostics
   (pages, chars per extractor, image-only page count, streams with text ops).
5. **OCR stage** for scanned documents: pages with zero text operators route
   to Gemini vision transcription (page-split, verbatim, page-validated).
   OCR text is permanently flagged (`extraction_status: 'ocr'`). Without a
   server Gemini key, scans fail with a clear message instead.
5. **Chunk** along paragraph/sentence boundaries (~1200 chars, 150 overlap),
   each chunk pinned to its starting page.
6. **Embed** with `gemini-embedding-001`, `outputDimensionality: 768`,
   `taskType: RETRIEVAL_DOCUMENT`, in batches of 50.

Status machine: `uploading → processing → ready | failed`. A material is
student-visible only at `ready`. Retry re-downloads the canonical file and
re-indexes from scratch (old chunks cleared first).

### Why pdf-lib + unpdf

Cloudflare Workers (OpenNext) cannot run native binaries (ghostscript, qpdf,
poppler). Both libraries are pure JS / WASM-free, import cleanly at the
edge, and need no shell-outs. Downsampling raster images is therefore
best-effort via stream recompression — documented honestly in the UI numbers.

## V1 scope: three features, no AI, no online tests

- The workspace is Notes (shared library with pictures, visible to every
  logged-in user), Material (READY PDFs/Word scoped to the student's own
  class via `material_grade_visible()`), and Marks (scores recorded by the
  teacher, visible to the owning student in their profile only).
- The AI tutor, online test player, results/progress pages, and per-student
  note sharing were removed (2026-09-26). The `chat_*` tables,
  `match_material_chunks*` RPCs, and pgvector schema remain in the database
  but have no UI consumer; re-enable only with a real product surface.
- Vision OCR (`src/lib/materials/ocr.ts`) stays inside the materials
  pipeline so scanned PDFs report `ocr` honestly instead of failing blind.
- Tests happen offline in class. Teachers record marks with
  `record_score_simple` (assigned-student, clamped, single graded record);
  students never see questions, attempts, or anyone else's scores.

## Known limitations

- PDF processing runs synchronously in the upload request (no job queue);
  15 MB cap keeps this inside Workers limits.
- Scanned PDFs are transcribed through vision OCR and flagged `ocr`; only
  truly unreadable files report `NO_READABLE_TEXT` with diagnostics.
- Distributed answer rate-limiting is client-throttle + server deadline;
  a dedicated token bucket is future work.
- `ATTEMPT_TIME_EXPIRED` in `save_test_answer` is currently unreachable
  defense-in-depth (the sweep converts expired attempts first); kept
  deliberately.
- Teacher accounts cannot delete attempts/questions (by design — grading
  integrity); cleanup needs admin.
