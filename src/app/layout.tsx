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
  title: "Saarthians — Learn with direction",
  description: "Saarthi Classes, Shahdara: Classes 9–12 all subjects with NEET & JEE coaching, plus a secure student workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
