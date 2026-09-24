import type { MetadataRoute } from "next";

const BASE = "https://saarthians.online";

// Public canonical URLs only. Everything under /app, /teacher, /admin,
// /login, and /api is private or auth-scoped and must never be crawled.
const PUBLIC_PATHS = [
  "/",
  "/programs",
  "/about",
  "/resources",
  "/contact",
  "/privacy",
  "/terms",
  "/coaching-classes-shahdara",
  "/classes/class-9",
  "/classes/class-10",
  "/classes/class-11-science",
  "/classes/class-12-science",
  "/jee-coaching-shahdara",
  "/neet-coaching-shahdara",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date("2026-09-23T00:00:00Z"),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
