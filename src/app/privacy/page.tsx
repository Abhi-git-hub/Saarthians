import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { CONTACT_EMAIL, whatsAppLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy — Saarthians",
  description: "How Saarthians protects learning records: private by default, role-based access, and no sale of student data.",
};

export default function PrivacyPage() {
  return (
    <main className="public-site" id="main-content">
      <PublicHeader />
      <section className="public-section container legal-page">
        <Reveal>
          <span className="eyebrow">Privacy</span>
          <h1 className="editorial-title">Your learning<br /><em>stays yours.</em></h1>
          <p className="editorial-lede">Saarthians is designed around private-by-default learning records. Access to authenticated data is controlled by identity, role, ownership and database policies.</p>
        </Reveal>
        <Reveal delay={80}>
          <h2>How access works</h2>
          <p>We limit access to information to the people and systems that are authorized to use it. The interface is not treated as the security boundary.</p>
        </Reveal>
        <Reveal delay={120}>
          <h2>Accounts</h2>
          <p>Student and teacher accounts are created by the Saarthians administrator — there is no public signup. Suspended or deactivated accounts lose access to protected areas.</p>
        </Reveal>
        <Reveal delay={160}>
          <h2>Questions or requests</h2>
          <p>
            For access, correction, or deletion requests, write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or{" "}
            <a href={whatsAppLink("Hi Saarthians, I have a privacy question.")} target="_blank" rel="noreferrer">message us on WhatsApp</a>.
          </p>
        </Reveal>
        <Reveal>
          <div className="center-cta" style={{ justifyContent: "flex-start" }}>
            <Link href="/contact" className="public-button public-button-secondary">Contact us →</Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
