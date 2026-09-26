import { PDFDocument } from "pdf-lib";

// Vision OCR for scanned PDFs (pages that are pictures of text).
//
// Why a cloud model: Cloudflare Workers cap memory at 128 MB, which rules
// out local OCR engines (Tesseract needs far more), and the Groq account on
// this project exposes chat models only. Gemini reads PDFs natively with
// vision, so scanned pages are transcribed without rendering them locally.
// Server-only: key travels in the x-goog-api-key header, never the browser.
// OCR-derived text is always flagged (extraction_status 'ocr') because
// recognition can misread handwriting-like fonts and faint print.

export const DEFAULT_OCR_MODEL = "gemini-2.5-flash";
export const OCR_PAGES_PER_REQUEST = 10;
const REQUEST_TIMEOUT_MS = 90000;

export type OcrFailure =
  | "OCR_NOT_CONFIGURED"
  | "OCR_RATE_LIMITED"
  | "OCR_REJECTED"
  | "OCR_UNREACHABLE"
  | "OCR_MALFORMED_RESPONSE";

export function ocrModel(): string {
  return (
    process.env.GEMINI_OCR_MODEL?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    DEFAULT_OCR_MODEL
  );
}

export function isOcrConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function ocrKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("OCR_NOT_CONFIGURED" satisfies OcrFailure);
  return key;
}

function toBase64(bytes: Uint8Array): string {
  // Chunked conversion: no Node Buffer (must run on Workers), no stack
  // blowout on multi-megabyte files.
  let binary = "";
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

const TRANSCRIBE_PROMPT = `Transcribe every page of this scanned document verbatim for study indexing.
Rules:
- Output one block per page exactly as: --- Page N --- on its own line, then the transcribed text.
- Number pages starting at 1 in document order. Cover every page, none skipped.
- Transcribe what is printed, character for character. Do not summarize, explain, translate, or correct.
- For diagrams, tables, and handwriting: transcribe all legible words in reading order; describe nothing.
- If a page is blank or fully illegible, write [unreadable] for it — never invent content.`;

/** Split a PDF into single-or-few-page documents (pdf-lib, no rendering). */
export async function splitPdfPages(bytes: Uint8Array, maxPerChunk: number): Promise<Uint8Array[]> {
  const src = await PDFDocument.load(bytes);
  const total = src.getPageCount();
  const chunks: Uint8Array[] = [];
  for (let start = 0; start < total; start += maxPerChunk) {
    const end = Math.min(start + maxPerChunk, total);
    const indices = Array.from({ length: end - start }, (_, i) => start + i);
    const part = await PDFDocument.create();
    const pages = await part.copyPages(src, indices);
    for (const page of pages) part.addPage(page);
    chunks.push(await part.save());
  }
  return chunks;
}

export interface OcrPage {
  pageNumber: number;
  text: string;
}

/** Parse `--- Page N ---` blocks; throws when pages are missing or doubled. */
export function parseTranscribedPages(raw: string, expectedPages: number, pageOffset: number): OcrPage[] {
  const pages: OcrPage[] = [];
  const lines = raw.split("\n");
  let current: number | null = null;
  let buffer: string[] = [];
  const flush = () => {
    if (current !== null) {
      const text = buffer.join("\n").replace(/\s+/g, " ").trim();
      pages.push({ pageNumber: pageOffset + current, text: text === "[unreadable]" ? "" : text });
    }
    buffer = [];
  };
  for (const line of lines) {
    const match = line.match(/^---\s*Page\s+(\d+)\s*---\s*$/i);
    if (match) {
      flush();
      current = parseInt(match[1], 10);
    } else if (current !== null) {
      buffer.push(line);
    }
  }
  flush();
  const numbers = pages.map((p) => p.pageNumber - pageOffset);
  const complete =
    pages.length === expectedPages && numbers.every((n, i) => n === i + 1);
  if (!complete) {
    throw new Error(
      `OCR_MALFORMED_RESPONSE: expected ${expectedPages} pages from offset ${pageOffset}, got [${numbers.join(",")}]`,
    );
  }
  return pages;
}

async function transcribeChunk(chunk: Uint8Array, pageOffset: number, pageCount: number): Promise<OcrPage[]> {
  const key = ocrKey();
  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${ocrModel()}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: "application/pdf", data: toBase64(chunk) } },
                { text: TRANSCRIBE_PROMPT },
              ],
            },
          ],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") throw new Error("OCR_UNREACHABLE");
    throw new Error("OCR_UNREACHABLE");
  }
  if (response.status === 429) throw new Error("OCR_RATE_LIMITED" satisfies OcrFailure);
  if (!response.ok) {
    let detail = "";
    try {
      detail = ` ${(await response.text()).slice(0, 300)}`;
    } catch {
      // Ignore body read failures; status alone still diagnoses.
    }
    throw new Error(`OCR_REJECTED: HTTP ${response.status}${detail}`);
  }
  const json = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new Error("OCR_MALFORMED_RESPONSE" satisfies OcrFailure);
  return parseTranscribedPages(text, pageCount, pageOffset);
}

/**
 * Transcribe a scanned PDF page by page. Returns text in document order.
 * Throws OcrFailure on any problem — callers decide fallback messaging.
 */
export async function ocrPdfPages(bytes: Uint8Array): Promise<OcrPage[]> {
  if (!isOcrConfigured()) throw new Error("OCR_NOT_CONFIGURED");
  const probe = await PDFDocument.load(bytes);
  const total = probe.getPageCount();
  if (total < 1) throw new Error("OCR_REJECTED: empty document");
  const chunks = await splitPdfPages(bytes, OCR_PAGES_PER_REQUEST);
  const pages: OcrPage[] = [];
  let offset = 0;
  for (const chunk of chunks) {
    const count = Math.min(OCR_PAGES_PER_REQUEST, total - offset);
    pages.push(...(await transcribeChunk(chunk, offset, count)));
    offset += count;
  }
  return pages;
}
