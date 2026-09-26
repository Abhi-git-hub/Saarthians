-- File-only materials: store-as-is artifacts.
--
-- Product decision: a teacher's file must never be rejected just because
-- machines cannot read it. PDFs without extractable text and Word documents
-- are stored verbatim and served for download; they carry
-- extraction_status 'file_only', produce no chunks, and therefore never
-- appear in tutor retrieval (which ranks chunks only). The tutor stays
-- honest: it can only reason over indexed text.
alter table public.study_materials drop constraint if exists study_materials_extraction_status_check;
alter table public.study_materials add constraint study_materials_extraction_status_check
  check (extraction_status in ('pending', 'complete', 'no_text', 'failed', 'ocr', 'file_only'));
