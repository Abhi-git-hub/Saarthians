import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { WhatsAppFab } from "@/components/whatsapp-fab";

export const metadata: Metadata = {
  title: "Portfolio — Selected work | Saarthians",
  description: "Selected work from Saarthians: the education platform, learning operations, and tutoring systems we design and build.",
};

const projects = [
  ["Saarthians", "Education platform", "A premium public experience connected to secure student, teacher and admin workspaces."],
  ["Adhyayan", "Student management", "A focused learning operations platform for notes, tests, results and role-based access."],
  ["Drona", "AI learning assistant", "A reasoning-oriented chemistry tutor combining grounded context, retrieval and practice."],
];

const capabilities = [
  ["Frontend systems", "Responsive interfaces with calm, legible design and accessible interactions."],
  ["Backend services", "Typed APIs, server-side authorization, and auditable privileged operations."],
  ["Data & AI", "Grounded retrieval and practice generation over a student's own authorized context."],
  ["Deployment", "Production builds on edge infrastructure with previews and monitoring."],
];

export default function PortfolioPage() {
  return (
    <main className="public-site" id="main-content">
      <PublicHeader />
      <section className="public-section container">
        <Reveal>
          <span className="eyebrow">Selected work</span>
          <h1 className="editorial-title">Things built<br /><em>to be useful.</em></h1>
        </Reveal>
        <div className="portfolio-list">
          {projects.map(([name, kind, body], i) => (
            <Reveal key={name} delay={Math.min(i, 2) * 70}>
              <article className="portfolio-row">
                <span>0{i + 1}</span>
                <div><small>{kind}</small><h2>{name}</h2><p>{body}</p></div>
                <b aria-hidden="true">↗</b>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="public-section container" style={{ paddingTop: 0 }}>
        <Reveal>
          <div className="section-intro">
            <div><span className="eyebrow">Under the hood</span><h2>Real systems, <em>not screenshots.</em></h2></div>
            <p>Every project above runs on the same engineering spine: typed code, explicit authorization, and observable production behavior.</p>
          </div>
        </Reveal>
        <div className="feature-grid">
          {capabilities.map(([title, body], i) => (
            <Reveal key={title} delay={(i % 2) * 80}>
              <article className="feature-card lift">
                <span>{`0${i + 1}`}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="center-cta">
            <Link href="/contact" className="public-button public-button-primary">Discuss a project →</Link>
          </div>
        </Reveal>
      </section>
      <section className="split-story">
        <div className="container split-story-grid">
          <Reveal>
            <div><span className="eyebrow light">Product engineering</span><h2>Design for the person<br /><em>using the product.</em></h2></div>
          </Reveal>
          <Reveal delay={120}>
            <div className="split-story-copy"><p>The work spans frontend systems, backend services, authentication, authorization, AI integration and production deployment — with the user experience treated as part of the engineering problem.</p></div>
          </Reveal>
        </div>
      </section>
      <WhatsAppFab />
    </main>
  );
}
