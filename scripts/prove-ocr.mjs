// Dev-only: build an image-only PDF (text rendered as pixels, no text ops)
// and OCR it through src/lib/ai/ocr.ts with the local Gemini key.
// Usage: node scripts/prove-ocr.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { build } from "esbuild";

// Load local env (Next.js does this at runtime; plain node does not).
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([^#=\s][^=]*)=(.*)$/);
  if (m && !(m[1].trim() in process.env)) process.env[m[1].trim()] = m[2].trim();
}

const GLYPHS = {
  H: ["101", "101", "111", "101", "101"],
  E: ["111", "100", "110", "100", "111"],
  L: ["100", "100", "100", "100", "111"],
  O: ["010", "101", "101", "101", "010"],
  " ": ["000", "000", "000", "000", "000"],
};

const CELL = 14;
const WORD = "HELLO";
const W = WORD.length * 4 * CELL;
const H = 5 * CELL;
const px = Buffer.alloc(W * H, 255);
for (let c = 0; c < WORD.length; c += 1) {
  const rows = GLYPHS[WORD[c]];
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 3; x += 1) {
      if (rows[y][x] === "1") {
        for (let dy = 0; dy < CELL; dy += 1) {
          for (let dx = 0; dx < CELL; dx += 1) {
            px[((y * CELL + dy) * W + (c * 4 * CELL + x * CELL + dx))] = 0;
          }
        }
      }
    }
  }
}

function crc32(buf) {
  let table = crc32.t;
  if (!table) {
    table = crc32.t = new Int32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i += 1) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePngGray(w, h, px) {
  const stride = w;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y += 1) {
    raw[y * (stride + 1)] = 0;
    px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 0;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

const png = encodePngGray(W, H, px);
writeFileSync(new URL("../hello-pixels.png", import.meta.url), png);

await build({
  entryPoints: ["src/lib/ai/ocr.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "node_modules/.cache/ocr-bundle.mjs",
  logLevel: "silent",
});
const { ocrPdfPages } = await import("../node_modules/.cache/ocr-bundle.mjs");
const { PDFDocument } = await import("pdf-lib");
const doc = await PDFDocument.create();
const img = await doc.embedPng(png);
const page = doc.addPage([img.width + 100, img.height + 100]);
page.drawImage(img, { x: 50, y: 50, width: img.width, height: img.height });
const pdf = await doc.save();
console.log("image-pdf bytes:", pdf.length);
const pages = await ocrPdfPages(pdf);
console.log("pages:", pages.length);
console.log("text:", JSON.stringify(pages[0]?.text));
