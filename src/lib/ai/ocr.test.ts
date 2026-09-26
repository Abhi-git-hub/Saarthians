import { afterEach, describe, expect, it, vi } from "vitest";
import { isOcrConfigured, ocrPdfPages, parseTranscribedPages } from "./ocr";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GEMINI_API_KEY;
});

describe("parseTranscribedPages", () => {
  it("parses numbered blocks and honors unreadable pages", () => {
    const pages = parseTranscribedPages(
      "--- Page 1 ---\nPhotosynthesis makes glucose.\n--- Page 2 ---\n[unreadable]\n",
      2,
      0,
    );
    expect(pages).toEqual([
      { pageNumber: 1, text: "Photosynthesis makes glucose." },
      { pageNumber: 2, text: "" },
    ]);
  });

  it("rejects skipped or duplicated pages instead of misattributing", () => {
    expect(() => parseTranscribedPages("--- Page 1 ---\nhi\n--- Page 3 ---\nbye\n", 2, 0)).toThrow(
      "OCR_MALFORMED_RESPONSE",
    );
    expect(() => parseTranscribedPages("--- Page 1 ---\nhi\n", 2, 0)).toThrow("OCR_MALFORMED_RESPONSE");
  });

  it("offsets chunks in multi-request documents", () => {
    const pages = parseTranscribedPages("--- Page 1 ---\na\n--- Page 2 ---\nb\n", 2, 10);
    expect(pages.map((p) => p.pageNumber)).toEqual([11, 12]);
  });
});

describe("ocrPdfPages", () => {
  it("requires configuration before any network call", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    await expect(ocrPdfPages(new Uint8Array([1, 2, 3]))).rejects.toThrow("OCR_NOT_CONFIGURED");
    expect(spy).not.toHaveBeenCalled();
  });
});
