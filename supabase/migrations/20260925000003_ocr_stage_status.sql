-- OCR stage for scanned PDFs.
--
-- Pages that are pictures of text (zero text operators) now route to a
-- vision-OCR stage instead of failing outright. Two new status values:
-- processing_status 'needs_ocr' (visible while transcription runs) and
-- extraction_status 'ocr' (permanent, honest flag that the text was
-- machine-read from images and may contain recognition errors).

alter table public.study_materials drop constraint if exists study_materials_processing_status_check;
alter table public.study_materials
  add constraint study_materials_processing_status_check
  check (processing_status in ('uploading', 'processing', 'needs_ocr', 'ready', 'failed'));

alter table public.study_materials drop constraint if exists study_materials_extraction_status_check;
alter table public.study_materials
  add constraint study_materials_extraction_status_check
  check (extraction_status in ('pending', 'complete', 'no_text', 'failed', 'ocr'));
