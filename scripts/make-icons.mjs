// Dev-only brand derivative generator (never bundled, never served).
// Builds square favicons, Apple touch icon, manifest icons, and the OG
// image from public/images/saarthians-logo.png (square 1:1 canonical mark)
// using only Node builtins (zlib). Geometric accents use brand tokens only.
// No text is rasterized (no fonts available) — words travel in og:title,
// never in pixels.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { inflateSync, deflateSync } from "node:zlib";

const SRC = new URL("../public/images/saarthians-logo.png", import.meta.url);
const OUT = new URL("../public/icons/", import.meta.url);

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
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

function decodePng(file) {
  const b = Buffer.from(file);
  let pos = 8;
  const idat = [];
  let w = 0, h = 0, ct = 0;
  while (pos < b.length) {
    const len = b.readUInt32BE(pos);
    const type = b.toString("ascii", pos + 4, pos + 8);
    if (type === "IHDR") {
      w = b.readUInt32BE(pos + 8); h = b.readUInt32BE(pos + 12); ct = b[pos + 17];
    }
    if (type === "IDAT") idat.push(b.subarray(pos + 8, pos + 8 + len));
    if (type === "IEND") break;
    pos += 12 + len;
  }
  if (ct !== 6 && ct !== 2) throw new Error(`unsupported colortype ${ct}`);
  const ch = ct === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const px = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y += 1) {
    const filter = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = Buffer.alloc(stride);
    for (let i = 0; i < stride; i += 1) {
      const a = i >= ch ? out[i - ch] : 0;
      const bb = i >= stride ? 0 : prev[i];
      const c = i >= ch && i >= stride ? prev[i - ch] : 0;
      let v;
      if (filter === 0) v = row[i];
      else if (filter === 1) v = row[i] + a;
      else if (filter === 2) v = row[i] + bb;
      else if (filter === 3) v = row[i] + ((a + bb) >> 1);
      else if (filter === 4) {
        const p = a + bb - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - bb), pc = Math.abs(p - c);
        v = row[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? bb : c);
      } else throw new Error(`bad filter ${filter}`);
      out[i] = v & 0xff;
    }
    for (let x = 0; x < w; x += 1) {
      const di = (y * w + x) * 4;
      px[di] = out[x * ch]; px[di + 1] = out[x * ch + 1]; px[di + 2] = out[x * ch + 2];
      px[di + 3] = ch === 4 ? out[x * ch + 3] : 255;
    }
    prev = out;
  }
  return { w, h, px };
}

function encodePng(w, h, px) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y += 1) {
    raw[y * (stride + 1)] = 0;
    px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

function sample(src, x, y) {
  const xi = Math.max(0, Math.min(src.w - 1, Math.floor(x)));
  const yi = Math.max(0, Math.min(src.h - 1, Math.floor(y)));
  const i = (yi * src.w + xi) * 4;
  return [src.px[i], src.px[i + 1], src.px[i + 2], src.px[i + 3]];
}

function blit(dst, dx, dy, dw, dh, src) {
  // Bilinear scale of src into dst rect.
  for (let y = 0; y < dh; y += 1) {
    for (let x = 0; x < dw; x += 1) {
      const sx = (x / dw) * src.w;
      const sy = (y / dh) * src.h;
      const x0 = Math.floor(sx), y0 = Math.floor(sy);
      const fx = sx - x0, fy = sy - y0;
      const p00 = sample(src, x0, y0), p10 = sample(src, x0 + 1, y0);
      const p01 = sample(src, x0, y0 + 1), p11 = sample(src, x0 + 1, y0 + 1);
      const px = [0, 0, 0, 0];
      for (let c = 0; c < 4; c += 1) {
        px[c] = p00[c] * (1 - fx) * (1 - fy) + p10[c] * fx * (1 - fy) + p01[c] * (1 - fx) * fy + p11[c] * fx * fy;
      }
      const di = ((dy + y) * dst.w + (dx + x)) * 4;
      const sa = px[3] / 255;
      const da = dst.px[di + 3] / 255;
      const outA = sa + da * (1 - sa);
      if (outA > 0) {
        dst.px[di] = (px[0] * sa + dst.px[di] * da * (1 - sa)) / outA;
        dst.px[di + 1] = (px[1] * sa + dst.px[di + 1] * da * (1 - sa)) / outA;
        dst.px[di + 2] = (px[2] * sa + dst.px[di + 2] * da * (1 - sa)) / outA;
        dst.px[di + 3] = outA * 255;
      }
    }
  }
}

function canvas(w, h, rgb) {
  const px = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i += 1) {
    px[i * 4] = rgb[0]; px[i * 4 + 1] = rgb[1]; px[i * 4 + 2] = rgb[2]; px[i * 4 + 3] = 255;
  }
  return { w, h, px };
}

function disc(dst, cx, cy, r, rgb, alpha) {
  for (let y = Math.max(0, cy - r); y < Math.min(dst.h, cy + r); y += 1) {
    for (let x = Math.max(0, cx - r); x < Math.min(dst.w, cx + r); x += 1) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > r) continue;
      const edge = Math.max(0, Math.min(1, r - d));
      const a = alpha * Math.min(1, edge * 2);
      const i = (y * dst.w + x) * 4;
      dst.px[i] = dst.px[i] * (1 - a) + rgb[0] * a;
      dst.px[i + 1] = dst.px[i + 1] * (1 - a) + rgb[1] * a;
      dst.px[i + 2] = dst.px[i + 2] * (1 - a) + rgb[2] * a;
    }
  }
}

function ring(dst, cx, cy, r, thickness, rgb) {
  for (let y = Math.max(0, cy - r - thickness); y < Math.min(dst.h, cy + r + thickness); y += 1) {
    for (let x = Math.max(0, cx - r - thickness); x < Math.min(dst.w, cx + r + thickness); x += 1) {
      const d = Math.abs(Math.hypot(x - cx, y - cy) - r);
      if (d > thickness) continue;
      const a = Math.max(0, 1 - d / thickness);
      const i = (y * dst.w + x) * 4;
      dst.px[i] = dst.px[i] * (1 - a) + rgb[0] * a;
      dst.px[i + 1] = dst.px[i + 1] * (1 - a) + rgb[1] * a;
      dst.px[i + 2] = dst.px[i + 2] * (1 - a) + rgb[2] * a;
    }
  }
}

const PAPER = [250, 246, 239];
const INK = [30, 27, 21];
const GREEN = [29, 74, 60];
const GOLD = [223, 166, 62];

const logo = decodePng(readFileSync(SRC));
console.log(`logo ${logo.w}x${logo.h}`);

// Autocrop transparent margins so small icons stay legible.
function autocrop(src, threshold = 16) {
  let x0 = src.w, y0 = src.h, x1 = -1, y1 = -1;
  for (let y = 0; y < src.h; y += 1) {
    for (let x = 0; x < src.w; x += 1) {
      if (src.px[(y * src.w + x) * 4 + 3] > threshold) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return src;
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const px = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    src.px.copy(px, y * w * 4, ((y0 + y) * src.w + x0) * 4, ((y0 + y) * src.w + x0 + w) * 4);
  }
  console.log(`cropped to ${w}x${h}`);
  return { w, h, px };
}

const mark = autocrop(logo);

function squareIcon(size, marginRatio) {
  const c = canvas(size, size, INK);
  const margin = Math.round(size * marginRatio);
  const avail = size - margin * 2;
  const scale = Math.min(avail / mark.w, avail / mark.h);
  const dw = Math.max(1, Math.round(mark.w * scale)), dh = Math.max(1, Math.round(mark.h * scale));
  blit(c, Math.round((size - dw) / 2), Math.round((size - dh) / 2), dw, dh, mark);
  return c;
}

mkdirSync(OUT, { recursive: true });
const write = (name, c) => {
  writeFileSync(new URL(name, OUT), encodePng(c.w, c.h, c.px));
  console.log(name, `${c.w}x${c.h}`);
};

write("icon-512.png", squareIcon(512, 0.12));
write("icon-192.png", squareIcon(192, 0.12));
write("apple-touch-icon.png", squareIcon(180, 0.1));
write("favicon-64.png", squareIcon(64, 0.08));
write("favicon-32.png", squareIcon(32, 0.08));

// OG 1200x630: deep-ink field (the mark is dark, full-bleed), logo left on
// optical center, gold rule, deep-green footer band.
{
  const W = 1200, H = 630;
  const c = canvas(W, H, INK);
  disc(c, 1010, 120, 220, GOLD, 0.22);
  ring(c, 1010, 120, 150, 3, GOLD);
  const availH = 380;
  const scale = Math.min(560 / mark.w, availH / mark.h);
  const dw = Math.round(mark.w * scale), dh = Math.round(mark.h * scale);
  blit(c, 110, Math.round((H - 90 - dh) / 2), dw, dh, mark);
  const ruleX = 110 + dw + 60;
  for (let y = 150; y < H - 150; y += 1) {
    for (let x = ruleX; x < ruleX + 5; x += 1) {
      const i = (y * W + x) * 4;
      c.px[i] = GOLD[0]; c.px[i + 1] = GOLD[1]; c.px[i + 2] = GOLD[2];
    }
  }
  for (let y = H - 90; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = (y * W + x) * 4;
      c.px[i] = GREEN[0]; c.px[i + 1] = GREEN[1]; c.px[i + 2] = GREEN[2];
    }
  }
  writeFileSync(new URL("../public/og-cover.png", import.meta.url), encodePng(W, H, c.px));
  console.log("og-cover.png 1200x630");
}

// Minimal geometric SVG favicon (green field, gold ring) for modern browsers;
// PNGs above remain the canonical raster fallbacks.
writeFileSync(
  new URL("../public/favicon.svg", import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1d4a3c"/><circle cx="32" cy="32" r="16" fill="none" stroke="#dfa63e" stroke-width="5"/><circle cx="32" cy="32" r="5" fill="#faf6ef"/></svg>\n`,
);
console.log("favicon.svg");
