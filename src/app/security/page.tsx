import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Security — Saarthians",
  description: "How Saarthians protects learning records: authenticated sessions, role and ownership checks, and auditable administration.",
};

const controls = [
  ["AUTH", "Authenticated sessions.", "Workspace requests are tied to managed identity and secure server-side session handling."],
  ["AUTHORIZATION", "Role + ownership checks.", "Being signed in does not automatically grant access to another person's learning records."],
  ["AUDIT", "Privileged actions matter.", "High-risk administrative operations are designed to remain observable and accountable."],
];

export default function SecurityPage() {
  return (
    <main className="public-site" id="main-content">
      <PublicHeader />
      <section className="public-section container legal-page">
        <Reveal>
          <span className="eyebrow">Security</span>
          <h1 className="editorial-title">Protection belongs<br /><em>in the system.</em></h1>
          <p className="editorial-lede">Saarthians follows defense-in-depth principles: the UI presents authorized actions, server code verifies identity and access, domain rules enforce ownership, and database policies constrain records.</p>
        </Reveal>
        <div className="feature-grid">
          {controls.map(([tag, title, body], i) => (
            <Reveal key={tag} delay={(i % 2) * 80}>
              <article className={`feature-card lift${i === 2 ? " dark-card" : ""}`}>
                <span>{tag}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p style={{ marginTop: 34, maxWidth: 640, color: "var(--muted)", lineHeight: 1.75, fontSize: 15 }}>
            Found something that worries you? Write to <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--accent)", fontWeight: 800 }}>{CONTACT_EMAIL}</a> and
            we will look into it.
          </p>
        </Reveal>
        <Reveal>
          <div className="center-cta" style={{ justifyContent: "flex-start" }}>
            <Link href="/about" className="public-button public-button-secondary">How we think →</Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
