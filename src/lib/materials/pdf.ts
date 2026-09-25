import { PDFDocument } from "pdf-lib";
import { getDocumentProxy } from "unpdf";

// PDF validation + optimization + extraction + chunking for study materials.
//
// Runtime choice (documented): pdf-lib (pure JS, no native code) rewrites the
// file with object streams and stripped document metadata; unpdf (pdf.js
// serverless build) extracts text. Both import cleanly in the Cloudflare
// Workers / OpenNext runtime because neither shells out to a native binary.
// Text is never rasterized: selectable text, vectors, and page structure
// survive optimization.

export const MAX_PDF_BYTES = 15 * 1024 * 1024;
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // "%PDF-"

export type PdfValidationError =
  | "EMPTY_FILE"
  | "FILE_TOO_LARGE"
  | "INVALID_EXTENSION"
  | "NOT_A_PDF"
  | "ENCRYPTED_PDF"
  | "UNREADABLE_PDF";

export interface ValidatedPdf {
  bytes: Uint8Array;
  filename: string;
  pageCount: number;
}

export function sanitizeFilename(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? "material.pdf";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120);
  const withExt = cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
  return withExt.length > 4 ? withExt : "material.pdf";
}

function hasPdfMagic(bytes: Uint8Array): boolean {
  if (bytes.length < PDF_MAGIC.length) return false;
  return PDF_MAGIC.every((b, i) => bytes[i] === b);
}

/** Validate raw upload bytes. Returns the sanitized filename + page count. */
export async function validatePdfUpload(input: {
  bytes: Uint8Array;
  filename: string;
  mimeType?: string | null;
  maxBytes?: number;
}): Promise<ValidatedPdf> {
  const maxBytes = input.maxBytes ?? MAX_PDF_BYTES;
  if (input.bytes.length === 0) throw new Error("EMPTY_FILE");
  if (input.bytes.length > maxBytes) throw new Error("FILE_TOO_LARGE");
  const filename = sanitizeFilename(input.filename);
  const rawBase = (input.filename.split(/[\\/]/).pop() ?? "").trim();
  if (!rawBase.toLowerCase().endsWith(".pdf")) throw new Error("INVALID_EXTENSION");
  if (!hasPdfMagic(input.bytes)) throw new Error("NOT_A_PDF");

  let doc: Awaited<ReturnType<typeof PDFDocument.load>> | null = null;
  try {
    doc = await PDFDocument.load(input.bytes);
  } catch (error) {
    if (error instanceof Error && /encrypt/i.test(error.message)) throw new Error("ENCRYPTED_PDF");
    throw new Error("UNREADABLE_PDF");
  }
  const pageCount = doc.getPageCount();
  if (pageCount < 1) throw new Error("UNREADABLE_PDF");
  return { bytes: input.bytes, filename, pageCount };
}

export type OptimizationStatus = "compressed" | "stored_original" | "skipped";

export interface OptimizedPdf {
  bytes: Uint8Array;
  status: OptimizationStatus;
  originalSize: number;
  storedSize: number;
  /** 0..1 fraction saved, 0 when the original was kept. */
  compressionRatio: number;
}

/**
 * Optimize a validated PDF: strip document metadata and rewrite with
 * compressed object streams. Keeps the SMALLER of (optimized, original);
 * never enlarges a file. Text stays selectable — nothing is rasterized.
 */
export async function optimizePdf(bytes: Uint8Array): Promise<OptimizedPdf> {
  const originalSize = bytes.length;
  try {
    const doc = await PDFDocument.load(bytes);
    doc.setTitle("");
    doc.setAuthor("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setProducer("Saarthians");
    doc.setCreator("");
    const rewritten = await doc.save({ useObjectStreams: true });
    if (rewritten.length < originalSize) {
      return {
        bytes: rewritten,
        status: "compressed",
        originalSize,
        storedSize: rewritten.length,
        compressionRatio: (originalSize - rewritten.length) / originalSize,
      };
    }
    return { bytes, status: "stored_original", originalSize, storedSize: originalSize, compressionRatio: 0 };
  } catch {
    return { bytes, status: "skipped", originalSize, storedSize: originalSize, compressionRatio: 0 };
  }
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

/** Extract per-page text. Throws when the file cannot be parsed. */
export async function extractPdfPages(bytes: Uint8Array): Promise<ExtractedPage[]> {
  const proxy = await getDocumentProxy(bytes);
  const pages: ExtractedPage[] = [];
  for (let pageNumber = 1; pageNumber <= proxy.numPages; pageNumber += 1) {
    const page = await proxy.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? (item.str as string) : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ pageNumber, text });
    if (typeof page.cleanup === "function") page.cleanup();
  }
  const maybeDestroyable = proxy as unknown as { destroy?: () => Promise<unknown> };
  if (typeof maybeDestroyable.destroy === "function") {
    await maybeDestroyable.destroy();
  }
  return pages;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  // DecompressionStream is web-standard: Cloudflare Workers, browsers, and
  // Node 18+. No native binary, no extra dependency.
  const stream = new DecompressionStream("deflate");
  const writer = stream.writable.getWriter();
  await writer.write(data as unknown as ArrayBuffer);
  await writer.close();
  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

// Common Windows-1252 punctuation mapped to ASCII so fallback text stays
// readable. Anything else non-ASCII becomes a space (never a lie, just a gap).
const WIN1252_EXTRA: Record<number, string> = {
  0x82: "'", 0x83: "f", 0x84: '"', 0x85: "...", 0x86: "+", 0x87: "++", 0x88: "^",
  0x89: "%", 0x8a: "S", 0x8b: "<", 0x8c: "OE", 0x91: "'", 0x92: "'", 0x93: '"',
  0x94: '"', 0x95: "-", 0x96: "-", 0x97: "--", 0x98: "~", 0x99: "(TM)", 0x9a: "s",
  0x9b: ">", 0x9c: "oe", 0x9f: "Y", 0xa0: " ", 0xa9: "(c)", 0xae: "(R)", 0xb0: "deg",
  0xb1: "+/-", 0xb7: "-", 0xd7: "x", 0xf7: "/",
};

function decodeTextBytes(bytes: number[]): string {
  let out = "";
  for (const byte of bytes) {
    if (byte === 10 || byte === 13) out += " ";
    else if (byte >= 32 && byte < 127) out += String.fromCharCode(byte);
    else if (byte >= 160) out += String.fromCharCode(byte);
    else if (WIN1252_EXTRA[byte] !== undefined) out += WIN1252_EXTRA[byte];
    else out += " ";
  }
  return out;
}

/**
 * Scrape text-showing operators (Tj / TJ with literal or hex strings)
 * from one decoded content stream. No font maps are consulted, so custom
 * encodings may decode imperfectly — but real embedded text is recovered
 * where the primary extractor sees nothing.
 */
export function scrapeContentText(content: string): string {
  const pieces: string[] = [];
  let i = 0;
  const flush = (bytes: number[]) => {
    const text = decodeTextBytes(bytes).replace(/\s+/g, " ").trim();
    if (text) pieces.push(text);
  };
  while (i < content.length) {
    const char = content[i];
    if (char === "(") {
      const bytes: number[] = [];
      i += 1;
      while (i < content.length && content[i] !== ")") {
        if (content[i] === "\\" && i + 1 < content.length) {
          const next = content[i + 1];
          if (next >= "0" && next <= "7") {
            let octal = "";
            let j = i + 1;
            while (j < content.length && octal.length < 3 && content[j] >= "0" && content[j] <= "7") {
              octal += content[j];
              j += 1;
            }
            bytes.push(parseInt(octal, 8) & 0xff);
            i = j;
          } else {
            const escapes: Record<string, number> = { n: 10, r: 13, t: 9, b: 8, f: 12, "\\": 92, "(": 40, ")": 41 };
            bytes.push(escapes[next] ?? next.charCodeAt(0));
            i += 2;
          }
        } else {
          bytes.push(content.charCodeAt(i) & 0xff);
          i += 1;
        }
      }
      i += 1; // consume ")"
      flush(bytes);
    } else if (char === "<" && content[i + 1] !== "<") {
      let hex = "";
      i += 1;
      while (i < content.length && content[i] !== ">") {
        if (/[0-9a-fA-F]/.test(content[i])) hex += content[i];
        i += 1;
      }
      i += 1; // consume ">"
      if (hex.length % 2 === 1) hex += "0";
      const bytes: number[] = [];
      for (let h = 0; h < hex.length; h += 2) bytes.push(parseInt(hex.slice(h, h + 2), 16));
      flush(bytes);
    } else {
      i += 1;
    }
  }
  return pieces.join(" ").replace(/\s+/g, " ").trim();
}

// Manual latin1 decode (no Node Buffer — must run on Workers too).
function toLatin1(raw: Uint8Array): string {
  let out = "";
  for (let i = 0; i < raw.length; i += 1) out += String.fromCharCode(raw[i]);
  return out;
}

interface PageStream {
  bytes: Uint8Array;
  filter: string;
}

/** Read a page's raw content streams via pdf-lib (single stream or array). */
async function readPageStreams(doc: Awaited<ReturnType<typeof PDFDocument.load>>, pageIndex: number): Promise<PageStream[]> {
  const context = (doc as unknown as { context: unknown }).context as {
    lookup: (obj: unknown) => unknown;
  };
  const leaf = doc.getPages()[pageIndex]?.node as unknown as { Contents: () => unknown };
  if (!leaf || typeof leaf.Contents !== "function") return [];
  const entry = context.lookup(leaf.Contents());
  const refs: unknown[] = Array.isArray((entry as { array?: unknown[] }).array)
    ? (entry as { array: unknown[] }).array
    : [entry];
  const streams: PageStream[] = [];
  for (const ref of refs) {
    const stream = context.lookup(ref) as {
      dict?: { toString: () => string };
      getContents?: () => Uint8Array;
    } | null;
    if (!stream || typeof stream.getContents !== "function") continue;
    streams.push({ bytes: stream.getContents(), filter: stream.dict?.toString() ?? "" });
  }
  return streams;
}

/**
 * Fallback: scrape text operators page by page. Returns per-page text plus
 * how many streams actually contained text-showing operators (diagnostics).
 */
export async function scrapePdfText(bytes: Uint8Array): Promise<{ pages: ExtractedPage[]; streamsWithTextOps: number }> {
  const doc = await PDFDocument.load(bytes);
  const pageCount = doc.getPageCount();
  const pages: ExtractedPage[] = [];
  let streamsWithTextOps = 0;
  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const parts: string[] = [];
    for (const stream of await readPageStreams(doc, pageIndex)) {
      let raw = stream.bytes;
      if (/FlateDecode/.test(stream.filter)) {
        try {
          raw = await inflateRaw(raw);
        } catch {
          continue;
        }
      }
      const content = toLatin1(raw);
      if (!/[Tt][Jj]\b/.test(content)) continue;
      streamsWithTextOps += 1;
      const text = scrapeContentText(content);
      if (text) parts.push(text);
    }
    pages.push({ pageNumber: pageIndex + 1, text: parts.join(" ").replace(/\s+/g, " ").trim() });
  }
  return { pages, streamsWithTextOps };
}

export interface RobustExtraction {
  pages: ExtractedPage[];
  /** Which extractor produced the returned text. */
  source: "pdfjs" | "fallback";
  diagnostics: string;
}

const MIN_CHARS_PER_PAGE = 12;
const MIN_CHARS_TOTAL = 30;

/** Minimum usable characters for a document of `pageCount` pages. */
function minUsableChars(pageCount: number): number {
  return Math.max(MIN_CHARS_TOTAL, MIN_CHARS_PER_PAGE * Math.max(pageCount, 1));
}

/**
 * Robust extraction: pdf.js first (proper unicode via font maps), raw
 * operator scraping as fallback (recovers real text where font handling
 * fails). Throws NO_READABLE_TEXT with per-page diagnostics when neither
 * yields usable text — never a silent empty index.
 */
export async function extractPdfTextRobust(bytes: Uint8Array): Promise<RobustExtraction> {
  let pdfjsPages: ExtractedPage[] | null = null;
  let pdfjsError: string | null = null;
  try {
    // Copy: pdf.js may detach (transfer) the buffer it parses, which would
    // corrupt the bytes for the fallback below. Never hand it the original.
    pdfjsPages = await extractPdfPages(bytes.slice());
  } catch (error) {
    pdfjsError = error instanceof Error ? error.message : "parse failed";
  }
  const pdfjsChars = (pdfjsPages ?? []).reduce((sum, page) => sum + page.text.length, 0);
  const pageCount = pdfjsPages?.length ?? 0;

  if (pdfjsPages && pdfjsChars >= minUsableChars(pageCount)) {
    return {
      pages: pdfjsPages,
      source: "pdfjs",
      diagnostics: `pdfjs ok: ${pageCount} pages, ${pdfjsChars} chars`,
    };
  }

  let scraped: { pages: ExtractedPage[]; streamsWithTextOps: number } | null = null;
  let scrapeError: string | null = null;
  try {
    scraped = await scrapePdfText(bytes);
  } catch (error) {
    scrapeError = error instanceof Error ? error.message : "scrape failed";
  }
  const scrapedChars = (scraped?.pages ?? []).reduce((sum, page) => sum + page.text.length, 0);
  if (scraped && scrapedChars > pdfjsChars && scrapedChars >= minUsableChars(scraped.pages.length || 1)) {
    return {
      pages: scraped.pages,
      source: "fallback",
      diagnostics: `pdfjs weak (${pdfjsChars} chars${pdfjsError ? `, ${pdfjsError}` : ""}); fallback recovered ${scrapedChars} chars`,
    };
  }

  const detail = [
    `pages=${pageCount || "unknown"}`,
    `pdfjs_chars=${pdfjsChars}${pdfjsError ? ` (${pdfjsError})` : ""}`,
    `scraped_chars=${scrapedChars}${scrapeError ? ` (${scrapeError})` : ""}`,
    `text_streams=${scraped?.streamsWithTextOps ?? 0}`,
  ].join(", ");
  throw new Error(`NO_READABLE_TEXT: ${detail}. Scanned or image-only PDFs are not supported yet.`);
}

export interface MaterialChunk {
  pageNumber: number;
  chunkIndex: number;
  text: string;
}

const TARGET_CHUNK_CHARS = 1200;
const CHUNK_OVERLAP_CHARS = 150;

/**
 * Chunk pages along paragraph boundaries toward ~1200 chars with a small
 * overlap. Each chunk remembers the page it starts on; chunks are never
 * empty and words are never split.
 */
export function chunkExtractedPages(pages: ExtractedPage[]): MaterialChunk[] {
  const chunks: MaterialChunk[] = [];
  let chunkIndex = 0;
  for (const page of pages) {
    if (!page.text) continue;
    const paragraphs = page.text.split(/\n{2,}|\r\n{2,}/).flatMap((p) => p.split(/(?<=[.!?])\s+(?=[A-Z0-9])/));
    let current = "";
    const push = () => {
      const text = current.trim();
      if (text) {
        chunks.push({ pageNumber: page.pageNumber, chunkIndex: chunkIndex++, text });
      }
      current = "";
    };
    for (const paragraph of paragraphs) {
      const piece = paragraph.trim();
      if (!piece) continue;
      if ((current + " " + piece).trim().length <= TARGET_CHUNK_CHARS || !current) {
        current = current ? `${current} ${piece}` : piece;
        continue;
      }
      push();
      // Overlap: carry the tail of the previous chunk forward.
      const words = chunks[chunks.length - 1].text.split(/\s+/);
      let tail = "";
      for (let i = words.length - 1; i >= 0 && tail.length < CHUNK_OVERLAP_CHARS; i -= 1) {
        tail = words[i] + (tail ? ` ${tail}` : "");
      }
      current = tail ? `${tail} ${piece}` : piece;
    }
    push();
  }
  return chunks;
}
