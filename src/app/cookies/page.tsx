import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Cookie Policy — Saarthians",
  description: "How Saarthians uses cookies and similar storage: essential session cookies, preferences, and analytics.",
  alternates: { canonical: "https://saarthians.online/cookies" },
};

export default function CookiesPage() {
  return (
    <main className="public-site" id="main-content">
      <PublicHeader />
      <section className="public-section container legal-page">
        <Reveal>
          <span className="eyebrow">Cookies</span>
          <h1 className="editorial-title">Small files.<br /><em>Clear purpose.</em></h1>
          <p className="editorial-lede">Saarthians uses a small number of cookies and browser storage entries — only what keeps you signed in, remembers harmless preferences, and helps us understand visits. No advertising cookies, ever.</p>
        </Reveal>
        <Reveal delay={80}>
          <h2>Essential cookies</h2>
          <p>Session and authentication cookies keep you signed in to your workspace and protect forms. The site cannot function without them, so they are always on.</p>
        </Reveal>
        <Reveal delay={120}>
          <h2>Preference storage</h2>
          <p>Interface choices (for example, theme or dismissals) may be remembered in your browser&apos;s local storage. Clearing site data resets them — nothing breaks.</p>
        </Reveal>
        <Reveal delay={160}>
          <h2>Analytics</h2>
          <p>We use privacy-friendly Cloudflare Web Analytics to count visits and understand which pages help. It sets no personal identifier and needs no consent banner under this policy, but you can block it with any content blocker and the site keeps working fully.</p>
        </Reveal>
        <Reveal delay={200}>
          <h2>Maps embed</h2>
          <p>Pages with a Google Maps embed load content from google.com, which may set its own cookies under Google&apos;s policy. The map is enhanced content — everything else works without it.</p>
        </Reveal>
        <Reveal>
          <div className="center-cta" style={{ justifyContent: "flex-start" }}>
            <Link href="/contact" className="public-button public-button-secondary">Questions? Contact us →</Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
