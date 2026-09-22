/** @type {import('next').NextConfig} */
const csp = [
  "default-src 'self'",
  // Next.js App Router hydration + Tailwind inject inline scripts/styles.
  // No unsafe-eval anywhere in first-party code (verified); no external
  // scripts at all. Groq is server-side only and needs no browser entry.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  // Supabase Auth (REST + realtime socket) from the browser client.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  // Google Maps embed on the Visit section only.
  "frame-src https://www.google.com",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig = {
  // Pin Turbopack's workspace root to this project directory. Without this,
  // Turbopack walks up the filesystem for a lockfile and can misidentify the
  // root (e.g. a stray package-lock.json in a parent/home directory), which
  // breaks internal module resolution. import.meta.dirname keeps this portable
  // across machines and CI — no absolute paths.
  turbopack: {
    root: import.meta.dirname,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          { key: "X-Frame-Options", value: "DENY" },
          // HSTS without includeSubDomains/preload: commits browsers to
          // HTTPS on the apex only. Subdomain coverage was not verified, so
          // the stronger variants stay off deliberately.
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
        ],
      },
    ];
  },
};

export default nextConfig;
