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
4. **Extract** (unpdf, pdf.js serverless build) per page. Image-only PDFs
   yield no text → status `failed` with `NO_READABLE_TEXT` (no OCR — none
   reliable exists for this runtime).
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

## Embeddings & retrieval

- pgvector 0.8.2, `vector(768)`, HNSW cosine index.
- `text-embedding-004` no longer exists on the Gemini API (absent from
  `models.list` 2026-09-23); the pinned model is `gemini-embedding-001` with
  Matryoshka truncation to 768. **One model, one dimension — never mixed.**
- Retrieval is `match_material_chunks()` (SECURITY DEFINER): authorization
  (owner teacher / actively-assigned student / admin, READY only) happens
  **inside SQL before ranking**. No global-fetch-then-filter anywhere.
- Query path embeds with `RETRIEVAL_QUERY`; top-k (default 5, max 8),
  threshold 0.45, character budget, per-material scope for “Ask about this PDF”.

## Gemini tutor

- Server-only REST client (`src/lib/ai/gemini.ts`), no SDK. Key travels in
  the `x-goog-api-key` header, read only server-side; never `NEXT_PUBLIC_*`.
- Chat model: `GEMINI_MODEL`, default `gemini-2.5-flash` (verified live
  2026-09-23: models.list + generateContent). JSON-mode structured contract
  `{answer, grounded, sources, followups}`, validated server-side; malformed
  output is never persisted as a tutor answer.
- Knowledge hierarchy in the system prompt: teacher materials → student
  notes → mistakes/progress → general knowledge (labeled, never attributed
  to the teacher).
- Failure contract: missing key / timeout / 429 / 4xx / malformed /
  retrieval failure → deterministic local engine with mode `fallback`.
  The UI badge always shows the true mode: grounded / general / study engine.

## Scheduled live tests

- `tests.start_time/end_time` + derived lifecycle
  `draft/scheduled/live/closed` (`resolveTestLifecycle`, mirrored in RPCs).
- `test_attempts.deadline_at` (duration ∩ window, stamped at start) +
  `submission_reason` (`manual/auto_deadline/auto_leave/expired_sweep`);
  display states via `resolveAttemptState`.
- **Server time is the only clock.** Browser timers are displays.
- Auto-submit architecture: client countdown + pagehide beacon + sign-out
  finalize all funnel into `submit_test_attempt`/`finalize_expired_attempts`,
  which stamp `submitted_at` at the deadline. Critical subtlety: an RPC that
  raises rolls back its whole transaction — so the client calls
  `finalize_expired_attempts()` as a **separate committed call before**
  start/save/submit; the in-RPC sweep is only a backstop.
- Anti-cheating (deterrents, not promises): single active attempt, seeded
  per-attempt question/option shuffle, server scoring, heartbeat +
  visibility/focus/fullscreen telemetry into `test_security_events`
  (evidence rows, never gates), 1.5 s client save throttle. No webcam/mic/
  screen surveillance.

## Known limitations

- PDF processing runs synchronously in the upload request (no job queue);
  15 MB cap keeps this inside Workers limits.
- No OCR: scanned PDFs report `NO_READABLE_TEXT` instead of fake-ready.
- Distributed answer rate-limiting is client-throttle + server deadline;
  a dedicated token bucket is future work.
- `ATTEMPT_TIME_EXPIRED` in `save_test_answer` is currently unreachable
  defense-in-depth (the sweep converts expired attempts first); kept
  deliberately.
- Teacher accounts cannot delete attempts/questions (by design — grading
  integrity); cleanup needs admin.
