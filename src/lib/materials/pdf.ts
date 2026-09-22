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
