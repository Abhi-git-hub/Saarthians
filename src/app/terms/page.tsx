import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Terms — Saarthians",
  description: "Workspace use, account responsibilities, and acceptable use for Saarthians students, teachers, and administrators.",
};

export default function TermsPage() {
  return (
    <main className="public-site" id="main-content">
      <PublicHeader />
      <section className="public-section container legal-page">
        <Reveal>
          <span className="eyebrow">Terms</span>
          <h1 className="editorial-title">Clear expectations.<br /><em>Better learning.</em></h1>
          <p className="editorial-lede">Use Saarthians responsibly, keep account credentials private and do not attempt to access learning records or administrative functions outside your authorization.</p>
        </Reveal>
        <Reveal delay={80}>
          <h2>Workspace use</h2>
          <p>Students, teachers and administrators receive access according to their account role and authorized relationships.</p>
        </Reveal>
        <Reveal delay={120}>
          <h2>Accounts & credentials</h2>
          <p>Accounts are provisioned by the Saarthians administrator. You are responsible for keeping your password private and for activity under your account.</p>
        </Reveal>
        <Reveal delay={160}>
          <h2>Acceptable use</h2>
          <p>Do not attempt to access another person&apos;s records, probe administrative routes, interfere with assessments, or disrupt the service for others. Violations may lead to suspension.</p>
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
