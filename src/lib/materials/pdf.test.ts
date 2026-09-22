import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  chunkExtractedPages,
  extractPdfPages,
  optimizePdf,
  sanitizeFilename,
  validatePdfUpload,
} from "./pdf";

const UNIQUE_PHRASE = "Saarthians QA concept: BLUE-MANGO-47";

async function makePdf(linesPerPage: string[][], blank = false): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const lines of linesPerPage) {
    const page = doc.addPage([600, 800]);
    if (!blank) {
      lines.forEach((line, i) => {
        page.drawText(line.slice(0, 90), { x: 50, y: 750 - i * 20, size: 12, font, color: rgb(0, 0, 0) });
      });
    }
  }
  return doc.save();
}

describe("sanitizeFilename", () => {
  it("strips paths and unsafe characters", () => {
    expect(sanitizeFilename("../../etc/evil?.pdf")).toBe("evil-.pdf");
    expect(sanitizeFilename("notes")).toBe("notes.pdf");
  });
});

describe("validatePdfUpload", () => {
  it("accepts a real PDF and reports pages", async () => {
    const bytes = await makePdf([["Hello world"], ["Second page"]]);
    const result = await validatePdfUpload({ bytes, filename: "Class 10 Physics.pdf", mimeType: "application/pdf" });
    expect(result.pageCount).toBe(2);
    expect(result.filename).toBe("Class-10-Physics.pdf");
  });

  it("rejects empty, oversized, wrong-extension, and fake files", async () => {
    const good = await makePdf([["hi"]]);
    await expect(validatePdfUpload({ bytes: new Uint8Array(), filename: "a.pdf" })).rejects.toThrow("EMPTY_FILE");
    await expect(validatePdfUpload({ bytes: good, filename: "a.pdf", maxBytes: 10 })).rejects.toThrow("FILE_TOO_LARGE");
    await expect(validatePdfUpload({ bytes: good, filename: "a.txt" })).rejects.toThrow("INVALID_EXTENSION");
    await expect(
      validatePdfUpload({ bytes: new TextEncoder().encode("definitely not a pdf"), filename: "a.pdf" }),
    ).rejects.toThrow("NOT_A_PDF");
    await expect(
      validatePdfUpload({ bytes: new TextEncoder().encode("%PDF-truncated"), filename: "a.pdf" }),
    ).rejects.toThrow("UNREADABLE_PDF");
  });
});

describe("optimizePdf", () => {
  it("never enlarges and reports honest sizes", async () => {
    const bytes = await makePdf([[UNIQUE_PHRASE, ...Array.from({ length: 30 }, (_, i) => `Line ${i} of physics notes.`)]]);
    const out = await optimizePdf(bytes);
    expect(out.storedSize).toBeLessThanOrEqual(out.originalSize);
    expect(out.originalSize).toBe(bytes.length);
    if (out.status === "compressed") {
      expect(out.compressionRatio).toBeGreaterThan(0);
      expect(out.storedSize).toBe(out.originalSize - Math.round(out.originalSize * out.compressionRatio));
    } else {
      expect(out.compressionRatio).toBe(0);
      expect(out.bytes).toBe(bytes);
    }
  });
});

describe("extractPdfPages", () => {
  it("recovers text with correct page numbers", async () => {
    const bytes = await makePdf([["Page one body"], [UNIQUE_PHRASE]]);
    const pages = await extractPdfPages(bytes);
    expect(pages).toHaveLength(2);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[1].text).toContain("BLUE-MANGO-47");
  });

  it("yields empty text for image-only pages", async () => {
    const bytes = await makePdf([[ ]], true);
    const pages = await extractPdfPages(bytes);
    expect(pages).toHaveLength(1);
    expect(pages[0].text).toBe("");
  });
});

describe("chunkExtractedPages", () => {
  it("chunks along boundaries with sequential indexes", () => {
    const long = Array.from({ length: 40 }, (_, i) => `Sentence ${i} about motion and force.`).join(" ");
    const chunks = chunkExtractedPages([
      { pageNumber: 1, text: long },
      { pageNumber: 2, text: "" },
      { pageNumber: 3, text: "Short tail." },
    ]);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.text.length > 0)).toBe(true);
    expect(chunks.map((c) => c.chunkIndex)).toEqual(chunks.map((_, i) => i));
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[chunks.length - 1].text).toContain("Short tail.");
    for (const chunk of chunks) {
      for (const word of chunk.text.split(/\s+/)) {
        expect(long.includes(word) || word === "Short" || word === "tail.").toBe(true);
      }
    }
  });
});
