import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

describe("sitemap", () => {
  it("lists only public canonical URLs", () => {
    const entries = sitemap();
    expect(entries.length).toBeGreaterThanOrEqual(7);
    for (const entry of entries) {
      expect(entry.url.startsWith("https://saarthians.online")).toBe(true);
      expect(entry.url).not.toMatch(/\/(login|app|teacher|admin|api|auth)(\/|$)/);
    }
    const urls = entries.map((e) => e.url);
    expect(urls).toContain("https://saarthians.online/");
    expect(urls).toContain("https://saarthians.online/programs");
  });

  it("includes the full local SEO topic cluster", () => {
    const urls = sitemap().map((e) => e.url);
    for (const path of [
      "/coaching-classes-shahdara",
      "/classes/class-9",
      "/classes/class-10",
      "/classes/class-11-science",
      "/classes/class-12-science",
      "/jee-coaching-shahdara",
      "/neet-coaching-shahdara",
    ]) {
      expect(urls).toContain(`https://saarthians.online${path}`);
    }
    // No duplicates.
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("robots", () => {
  it("allows public crawling but disallows private areas", async () => {
    const rules = await robots();
    expect(rules.sitemap).toBe("https://saarthians.online/sitemap.xml");
    const rule = Array.isArray(rules.rules) ? rules.rules[0] : rules.rules;
    const disallow = (rule as { disallow: string[] }).disallow.join(" ");
    for (const area of ["/app", "/teacher", "/admin", "/login", "/api"]) {
      expect(disallow).toContain(area);
    }
  });
});

describe("production headers", () => {
  it("declares CSP without eval and with framing denied", async () => {
    // next.config.mjs is untyped by design (it uses import.meta.dirname);
    // the shape assertion below is the contract under test.
    // @ts-expect-error untyped config module
    const config = (await import("../../next.config.mjs")) as {
      default: { headers: () => Promise<{ headers: { key: string; value: string }[] }[]> };
    };
    const routes = await config.default.headers();
    const headers = routes[0].headers;
    const byKey = Object.fromEntries(headers.map((h) => [h.key, h.value]));
    expect(byKey["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(byKey["Content-Security-Policy"]).not.toContain("unsafe-eval");
    expect(byKey["Content-Security-Policy"]).toContain("frame-ancestors 'self'");
    expect(byKey["X-Content-Type-Options"]).toBe("nosniff");
    expect(byKey["X-Frame-Options"]).toBe("DENY");
    expect(byKey["Strict-Transport-Security"]).toContain("max-age=31536000");
    expect(byKey["Strict-Transport-Security"]).not.toContain("includeSubDomains");
  });
});
