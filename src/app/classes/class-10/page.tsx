import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/structured-data";
import { CtaBand, Crumbs, FaqSection, SiblingLinks, type Faq } from "@/components/seo-pages";
import { whatsAppLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Class 10 Tuition in Shahdara | CBSE Coaching | Saarthi Classes",
  description:
    "Class 10 tuition in Shahdara for CBSE students, combining concept-focused teaching, subject support, regular tests and doubt clearing at Saarthi Classes.",
  alternates: { canonical: "https://saarthians.online/classes/class-10" },
  openGraph: {
    title: "Class 10 Tuition in Shahdara | CBSE Coaching",
    description: "Board-year coaching with structured revision, practice and doubt clearing in Shahdara.",
    url: "https://saarthians.online/classes/class-10",
  },
};

const crumbs = [
  { href: "/", label: "Home" },
  { href: "/coaching-classes-shahdara", label: "Coaching in Shahdara" },
  { label: "Class 10 Tuition" },
];

const faqs: Faq[] = [
  {
    q: "How is Class 10 different from Class 9 here?",
    a: "The teaching shifts from pure concept-building to board execution: answer structuring, mark-scheme awareness, timed practice and revision cycles across the whole syllabus. Concepts are still taught first — but everything points at the board paper.",
  },
  {
    q: "Which subjects get the most attention in Class 10?",
    a: "Mathematics and Science carry the most weight for most families, and they get the most practice hours. English and Social Science get disciplined answer-writing practice, map work and source-based questions.",
  },
  {
    q: "How does revision work across the school year?",
    a: "The syllabus is finished with time to spare, then revised in full cycles: rapid re-teaching of weak chapters, sample-paper practice under timed conditions, and error review before the next cycle.",
  },
  {
    q: "Are tests part of the program?",
    a: "Yes — regular chapter tests plus full-syllabus practice as the boards approach. Every test is marked and reviewed with the student so the same marks are not lost twice.",
  },
  {
    q: "My child studied elsewhere till Class 9. Is joining in Class 10 too late?",
    a: "No. The first weeks deliberately repair the Class 9 load-bearing ideas — algebra fluency, basic trigonometry, chemical reactions — before the board syllabus accelerates.",
  },
  {
    q: "How do we enquire?",
    a: "Message Saarthi Classes on WhatsApp about Class 10 admission with the student's school and subjects, then visit the Shahdara centre to discuss batches.",
  },
];

export default function Class10Page() {
  return (
    <main className="public-site" id="main-content">
      <BreadcrumbJsonLd trail={crumbs} />
      <FaqJsonLd faqs={faqs} />
      <PublicHeader />
      <section className="public-section container">
        <Crumbs trail={crumbs} />
        <Reveal>
          <span className="eyebrow">Class 10 · Board year · Shahdara</span>
          <h1 className="editorial-title">
            Class 10 Tuition &amp; CBSE <em>Coaching in Shahdara.</em>
          </h1>
          <p className="editorial-lede">
            The board year rewards students who write well, revise in cycles, and practise under time. Saarthi
            Classes runs Class 10 exactly that way — concepts first, then board-pattern execution all year.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <a
              href={whatsAppLink("Hi Saarthi Classes, I want admission details for Class 10 tuition.")}
              target="_blank"
              rel="noreferrer"
              className="public-button public-button-primary"
            >
              Enquire about Class 10 →
            </a>
          </div>
        </Reveal>
      </section>

      <section className="public-section container" style={{ paddingTop: 0 }}>
        <Reveal>
          <span className="eyebrow">Subject-wise preparation</span>
          <h2 style={{ fontSize: "clamp(30px,3.8vw,50px)", letterSpacing: "-.05em", margin: "14px 0 8px" }}>
            Every subject, <em>exam-ready.</em>
          </h2>
        </Reveal>
        <div className="editorial-grid" style={{ marginTop: 30 }}>
          <Reveal>
            <h3 style={{ fontSize: 22, letterSpacing: "-.03em", margin: "0 0 10px" }}>Mathematics</h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.75 }}>
              Algebra, trigonometry, geometry and mensuration with step-marking discipline — the working shown
              earns marks even when arithmetic slips. Constructions and proofs get dedicated practice, not just
              reading.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h3 style={{ fontSize: 22, letterSpacing: "-.03em", margin: "0 0 10px" }}>Science</h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.75 }}>
              Physics numericals with units and formulas stated, Chemistry equations balanced by understanding
              rather than memory, Biology diagrams labelled the way examiners expect.
            </p>
          </Reveal>
          <Reveal>
            <h3 style={{ fontSize: 22, letterSpacing: "-.03em", margin: "0 0 10px" }}>English</h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.75 }}>
              Reading comprehension strategy, writing formats practised to word limits, and literature answers
              structured around quotations and analysis instead of plot retelling.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h3 style={{ fontSize: 22, letterSpacing: "-.03em", margin: "0 0 10px" }}>Social Science</h3>
            <p style={{ color: "var(--muted)", lineHeight: 1.75 }}>
              History, Geography, Civics and Economics with point-wise answers, map practice, and source-based
              questions handled methodically.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="rhythm-band">
        <div className="container">
          <Reveal>
            <span className="eyebrow light">The board-year rhythm</span>
            <h2>
              Finish early. <em>Revise twice.</em>
            </h2>
            <div className="seo-prose" style={{ marginTop: 26 }}>
              <p style={{ color: "#cfc6b2" }}>
                The syllabus completes with months to spare. Then come full revision cycles: weak chapters
                re-taught, sample papers attempted under timed conditions, and every error reviewed before the
                next cycle begins. Doubt clearing runs daily throughout — a stuck chapter never waits for the
                weekend. Students who started at Saarthi Classes in <a href="/classes/class-9" style={{ color: "#e7f6ca" }}>Class 9</a> arrive
                with methods already automatic; newcomers get the load-bearing Class 9 ideas repaired first.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="public-section container">
        <Reveal>
          <span className="eyebrow">Common questions</span>
          <h2 style={{ fontSize: "clamp(30px,3.8vw,50px)", letterSpacing: "-.05em", margin: "14px 0 8px" }}>
            Asked by <em>parents.</em>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <FaqSection faqs={faqs} />
        </Reveal>
      </section>

      <SiblingLinks
        heading="What comes after Class 10."
        links={[
          {
            href: "/classes/class-11-science",
            label: "Class 11 Science",
            note: "The Science jump — start it on strong foundations.",
          },
          {
            href: "/coaching-classes-shahdara",
            label: "Coaching in Shahdara",
            note: "The centre, the tracks, and how to visit.",
          },
          { href: "/contact", label: "Contact & admission", note: "Batch timings and a first conversation." },
        ]}
      />
      <CtaBand
        eyebrow="Admission"
        title="Ask about Class 10."
        message="I want admission details for Class 10 tuition in Shahdara."
      />
      <WhatsAppFab />
    </main>
  );
}
