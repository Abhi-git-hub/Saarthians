import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { WHATSAPP_DISPLAY, whatsAppLink } from "@/lib/site";

// Small shared kit for the local SEO topic cluster. These are structural
// helpers only (breadcrumbs, FAQ accordion, CTA band, sibling links) — every
// page hand-composes its own sections so the seven pages never read as one
// template with swapped class numbers.

export type Faq = { q: string; a: string };

export type SiblingLink = { href: string; label: string; note: string };

export function Crumbs({ trail }: { trail: Array<{ href?: string; label: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol>
        {trail.map((item, i) => (
          <li key={item.label}>
            {item.href && i < trail.length - 1 ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function FaqSection({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="faq-list">
      {faqs.map((faq) => (
        <details key={faq.q} className="faq-item">
          <summary>{faq.q}</summary>
          <p>{faq.a}</p>
        </details>
      ))}
    </div>
  );
}

export function CtaBand({ eyebrow, title, message }: { eyebrow: string; title: string; message: string }) {
  return (
    <section className="public-section container">
      <div className="public-cta" style={{ marginBottom: 0 }}>
        <Reveal>
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
            <p style={{ color: "var(--muted)", maxWidth: 480, lineHeight: 1.7, margin: "12px 0 0" }}>
              {message} WhatsApp us at {WHATSAPP_DISPLAY}.
            </p>
          </div>
        </Reveal>
        <a
          href={whatsAppLink(`Hi Saarthi Classes, ${message}`)}
          target="_blank"
          rel="noreferrer"
          className="public-button public-button-primary"
        >
          WhatsApp us →
        </a>
      </div>
    </section>
  );
}

export function SiblingLinks({ heading, links }: { heading: string; links: SiblingLink[] }) {
  return (
    <section className="public-section container" style={{ paddingTop: 0 }}>
      <Reveal>
        <span className="eyebrow">Keep exploring</span>
        <h2 style={{ fontSize: "clamp(28px,3.4vw,44px)", letterSpacing: "-.05em", margin: "14px 0 8px" }}>{heading}</h2>
      </Reveal>
      <div className="sibling-links">
        {links.map((link) => (
          <Reveal key={link.href}>
            <Link href={link.href} className="sibling-link">
              <strong>{link.label} →</strong>
              <span>{link.note}</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
