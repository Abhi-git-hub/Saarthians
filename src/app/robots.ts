import type { MetadataRoute } from "next";

// robots.txt is a crawling hint, never a security boundary. Private areas
// stay private through Auth + RLS + server-side authorization regardless of
// what is listed here.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/app", "/teacher", "/admin", "/login", "/api", "/auth"],
      },
    ],
    sitemap: "https://saarthians.online/sitemap.xml",
  };
}
