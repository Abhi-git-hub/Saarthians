import type { Metadata } from "next";
// Self-hosted variable fonts (Inter + Fraunces). Deliberately not next/font:
// its Turbopack font pipeline fails the production build in this
// Next.js 16.3.4 toolchain, while plain font CSS bundles identically on
// every runtime including Cloudflare Workers.
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://saarthians.online"),
  title: {
    default: "Saarthians — Learn with direction",
    template: "%s | Saarthians",
  },
  description:
    "Saarthi Classes, Shahdara: Classes 9–12 all subjects with NEET & JEE coaching, plus a secure student workspace.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Saarthians",
    locale: "en_IN",
    images: [{ url: "/og-cover.png", width: 1200, height: 630, alt: "Saarthians — Saarthi Classes, Shahdara" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-cover.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
