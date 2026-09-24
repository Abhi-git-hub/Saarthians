import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/structured-data";
import { CtaBand, Crumbs, FaqSection, SiblingLinks, type Faq } from "@/components/seo-pages";
import { whatsAppLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "NEET Coaching in Shahdara | NEET Preparation | Saarthi Classes",
  description:
    "NEET coaching in Shahdara for Class 11 and 12 students, focused on Biology, Physics and Chemistry concepts, practice, revision and doubt support.",
  alternates: { canonical: "https://saarthians.online/neet-coaching-shahdara" },
  openGraph: {
    title: "NEET Coaching in Shahdara | Saarthi Classes",
    description: "Biology-first NEET preparation with NCERT mastery in Shahdara.",
    url: "https://saarthians.online/neet-coaching-shahdara",
  },
};

const crumbs = [
  { href: "/", label: "Home" },
  { href: "/coaching-classes-shahdara", label: "Coaching in Shahdara" },
  { label: "NEET Coaching" },
];

const faqs: Faq[] = [
  {
    q: "Who is the NEET program for?",
    a: "Class 11 and 12 PCB students in and around Shahdara aiming at medical entrances — students ready to read NCERT deeply, practise assertion-reason questions, and revise Biology continuously.",
  },
  {
    q: "Which subjects are covered?",
    a: "Biology first, then Physics and Chemistry. Biology gets NCERT line-by-line study with diagrams and terminology drills; Physics and Chemistry get the same rigorous treatment as the PCM stream, tuned to NEET's pattern.",
  },
  {
    q: "How does NEET preparation balance with school studies?",
    a: "On the same chapters and the same timetable. School syllabus completes with board discipline while Biology depth, assertion-reason practice and revision cycles run alongside. School marks come first — always.",
  },
  {
    q: "What about assertion-reason and statement questions?",
    a: "They get dedicated drills, because NEET rewards precise NCERT reading. Students learn to distinguish what the book actually says from what feels familiar.",
  },
  {
    q: "How is doubt support handled?",
    a: "Daily. Biology doubts about processes and cycles, Physics numericals, Chemistry mechanisms — nothing waits, because NEET preparation is cumulative and gaps compound.",
  },
  {
    q: "How do we enquire about NEET batches?",
    a: "Message Saarthi Classes on WhatsApp about NEET coaching — mention the student's class — and visit the Shahdara centre to discuss the plan.",
  },
];

export default function NeetPage() {
  return (
    <main className="public-site" id="main-content">
      <BreadcrumbJsonLd trail={crumbs} />
      <FaqJsonLd faqs={faqs} />
      <PublicHeader />
      <section className="public-section container">
        <Crumbs trail={crumbs} />
        <Reveal>
          <span className="eyebrow">NEET · Biology · Physics · Chemistry · Shahdara</span>
          <h1 className="editorial-title">
            NEET Coaching &amp; Preparation <em>in Shahdara.</em>
          </h1>
          <p className="editorial-lede">
            NEET is won in Biology and protected in Physics and Chemistry. Saarthi Classes teaches it that way:
            NCERT mastered line by line, concepts practised daily, and revision that never stops — through Class
            11 and 12 in Shahdara.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <a
              href={whatsAppLink("Hi Saarthi Classes, I want admission details for NEET coaching.")}
              target="_blank"
              rel="noreferrer"
              className="public-button public-button-primary"
            >
              Enquire about NEET →
            </a>
          </div>
        </Reveal>
      </section>

      <section className="public-section container" style={{ paddingTop: 0 }}>
        <Reveal>
          <span className="eyebrow">How a week works</span>
          <h2 style={{ fontSize: "clamp(30px,3.8vw,50px)", letterSpacing: "-.05em", margin: "14px 0 8px" }}>
            Biology daily, <em>everything weekly.</em>
          </h2>
        </Reveal>
        <div className="seo-prose" style={{ marginTop: 24 }}>
          <Reveal>
            <p>
              <strong>Biology, every day.</strong> NCERT reading with diagrams redrawn from memory, terminology
              drilled until it sticks, and assertion-reason sets that punish loose reading. Half the paper comes
              from this book — it gets half the week.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <p>
              <strong>Physics and Chemistry, in rotation.</strong> Numericals with units stated, mechanisms by
              electron flow, and inorganic lines quoted accurately. The same rigour as the PCM stream, tuned to
              NEET&apos;s pattern rather than JEE&apos;s.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <p>
              <strong>Tests and error review, every cycle.</strong> Chapter tests, then full-syllabus practice as
              exams approach — each one marked, each error logged against its concept, each week planned from the
              log. Students study in <Link href="/classes/class-11-science">Class 11 Science</Link> and{" "}
              <Link href="/classes/class-12-science">Class 12 Science</Link> alongside; school and NEET share one
              timetable, and school marks are never sacrificed.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="public-section container" style={{ paddingTop: 0 }}>
        <Reveal>
          <span className="eyebrow">Common questions</span>
          <h2 style={{ fontSize: "clamp(30px,3.8vw,50px)", letterSpacing: "-.05em", margin: "14px 0 8px" }}>
            Asked by <em>aspirants.</em>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <FaqSection faqs={faqs} />
        </Reveal>
      </section>

      <SiblingLinks
        heading="The classes behind it."
        links={[
          {
            href: "/classes/class-11-science",
            label: "Class 11 Science",
            note: "Where NEET foundations are laid.",
          },
          {
            href: "/classes/class-12-science",
            label: "Class 12 Science",
            note: "Boards plus medical-entrance depth.",
          },
          { href: "/contact", label: "Contact & admission", note: "Discuss the two-year plan in person." },
        ]}
      />
      <CtaBand
        eyebrow="Admission"
        title="Ask about NEET."
        message="I want admission details for NEET coaching in Shahdara."
      />
      <WhatsAppFab />
    </main>
  );
}
