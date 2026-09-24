import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/structured-data";
import { CtaBand, Crumbs, FaqSection, SiblingLinks, type Faq } from "@/components/seo-pages";
import { whatsAppLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Class 11 Science Coaching in Shahdara | Saarthi Classes",
  description:
    "Class 11 Science coaching in Shahdara for students building strong foundations in Physics, Chemistry, Mathematics and Biology, with focused academic support from Saarthi Classes.",
  alternates: { canonical: "https://saarthians.online/classes/class-11-science" },
  openGraph: {
    title: "Class 11 Science Coaching in Shahdara",
    description: "Physics, Chemistry, Maths and Biology foundations for Class 11 students in Shahdara.",
    url: "https://saarthians.online/classes/class-11-science",
  },
};

const crumbs = [
  { href: "/", label: "Home" },
  { href: "/coaching-classes-shahdara", label: "Coaching in Shahdara" },
  { label: "Class 11 Science" },
];

const faqs: Faq[] = [
  {
    q: "Why do students find Class 11 Science difficult?",
    a: "The jump is real: longer chapters, abstract concepts, and a pace roughly double that of Class 10. Most strugglers don't lack intelligence — they lack the first two months of proper foundation, which is exactly what this program front-loads.",
  },
  {
    q: "Do you teach both PCM and PCB combinations?",
    a: "Yes. Physics and Chemistry are common to both; Mathematics and Biology are taught in their respective streams. Students choose their combination — nobody is pushed toward JEE or NEET.",
  },
  {
    q: "Is there JEE or NEET preparation inside Class 11?",
    a: "There is an honest foundation layer: NCERT mastery first, then entrance-oriented problems for students who want them. Families aiming at JEE or NEET can read the dedicated JEE and NEET pages; school-focused students simply skip that layer.",
  },
  {
    q: "How is consistency maintained through Class 11?",
    a: "Weekly problem sets, chapter tests, and error review. Class 11 punishes irregular study more than any other year, so the program is deliberately rhythm-driven rather than syllabus-chasing.",
  },
  {
    q: "How do we enquire about Class 11 Science batches?",
    a: "Message Saarthi Classes on WhatsApp about Class 11 Science admission — mention PCM or PCB — and visit the Shahdara centre to discuss how the year is structured.",
  },
];

export default function Class11Page() {
  return (
    <main className="public-site" id="main-content">
      <BreadcrumbJsonLd trail={crumbs} />
      <FaqJsonLd faqs={faqs} />
      <PublicHeader />
      <section className="public-section container">
        <Crumbs trail={crumbs} />
        <Reveal>
          <span className="eyebrow">Class 11 · Science · Shahdara</span>
          <h1 className="editorial-title">
            Class 11 Science <em>Coaching in Shahdara.</em>
          </h1>
          <p className="editorial-lede">
            Everything changes in Class 11 — the depth, the pace, the abstraction. Saarthi Classes treats the
            first two months as foundation work: slow where it must be slow, so the rest of the year can move.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <a
              href={whatsAppLink("Hi Saarthi Classes, I want admission details for Class 11 Science coaching.")}
              target="_blank"
              rel="noreferrer"
              className="public-button public-button-primary"
            >
              Enquire about Class 11 →
            </a>
          </div>
        </Reveal>
      </section>

      <section className="public-section container" style={{ paddingTop: 0 }}>
        <div className="contact-grid">
          <Reveal>
            <div className="contact-panel">
              <span className="eyebrow">PCM stream</span>
              <h2>Physics. Chemistry. Maths.</h2>
              <p>
                Mechanics, physical and organic chemistry foundations, and the algebra–calculus–trigonometry spine
                that Class 12 and JEE both assume. Problem-solving is taught as a method — draw, define, solve,
                verify — not as memorised solution types.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="contact-panel">
              <span className="eyebrow">PCB stream</span>
              <h2>Physics. Chemistry. Biology.</h2>
              <p>
                The same rigorous Physics and Chemistry, plus Biology taught NCERT line-by-line with diagrams and
                terminology drilled until they stick — the exact base NEET builds on, without forcing every
                student onto the NEET track.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="public-section container" style={{ paddingTop: 0 }}>
        <div className="editorial-grid">
          <Reveal>
            <span className="eyebrow">School, plus an honest foundation</span>
            <h2 style={{ fontSize: "clamp(28px,3.4vw,44px)", letterSpacing: "-.05em", margin: "14px 0 8px" }}>
              Your stream, <em>your pace.</em>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="seo-prose">
              <p>
                School exams come first — no Class 11 student can afford weak school marks. On top of that solid
                base, students eyeing competitive exams get entrance-oriented problems woven into the same
                chapters: a <Link href="/jee-coaching-shahdara">JEE preparation</Link> layer for PCM students
                and a <Link href="/neet-coaching-shahdara">NEET preparation</Link> layer for PCB students. The
                layers are opt-in by intent, never imposed.
              </p>
              <p>
                Doubt support runs daily, tests are chapter-wise with reviewed errors, and the year flows straight
                into <Link href="/classes/class-12-science">Class 12 Science</Link> without a restart.
              </p>
            </div>
          </Reveal>
        </div>
        <Reveal delay={120}>
          <span className="eyebrow" style={{ marginTop: 44, display: "inline-flex" }}>Common questions</span>
          <FaqSection faqs={faqs} />
        </Reveal>
      </section>

      <SiblingLinks
        heading="Keep climbing."
        links={[
          {
            href: "/classes/class-12-science",
            label: "Class 12 Science",
            note: "Boards plus competitive depth, revised in cycles.",
          },
          { href: "/jee-coaching-shahdara", label: "JEE coaching", note: "For PCM students aiming at engineering." },
          { href: "/neet-coaching-shahdara", label: "NEET coaching", note: "For PCB students aiming at medicine." },
        ]}
      />
      <CtaBand
        eyebrow="Admission"
        title="Ask about Class 11."
        message="I want admission details for Class 11 Science coaching in Shahdara."
      />
      <WhatsAppFab />
    </main>
  );
}
