import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/structured-data";
import { CtaBand, Crumbs, FaqSection, SiblingLinks, type Faq } from "@/components/seo-pages";
import { whatsAppLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Class 12 Science Coaching in Shahdara | Saarthi Classes",
  description:
    "Class 12 Science coaching in Shahdara with focused subject support, revision, problem-solving, doubt clearing and preparation for school and competitive exams.",
  alternates: { canonical: "https://saarthians.online/classes/class-12-science" },
  openGraph: {
    title: "Class 12 Science Coaching in Shahdara",
    description: "Board preparation, revision cycles and competitive depth for Class 12 Science in Shahdara.",
    url: "https://saarthians.online/classes/class-12-science",
  },
};

const crumbs = [
  { href: "/", label: "Home" },
  { href: "/coaching-classes-shahdara", label: "Coaching in Shahdara" },
  { label: "Class 12 Science" },
];

const faqs: Faq[] = [
  {
    q: "How do you handle boards and JEE/NEET together in Class 12?",
    a: "By sequencing, not multitasking. Board syllabus completes first with answer-writing discipline; competitive depth runs in parallel on the same chapters for PCM/PCB aspirants; then dedicated revision cycles serve both. School marks are never sacrificed for entrance prep.",
  },
  {
    q: "Which Class 12 chapters get the most attention?",
    a: "The heavyweights: calculus and vectors in Maths; electrostatics, current, magnetism and optics in Physics; organic mechanisms and coordination compounds in Chemistry; genetics, evolution and human physiology in Biology.",
  },
  {
    q: "How do revision cycles work?",
    a: "Each cycle re-teaches weak chapters quickly, follows with timed test practice, and ends with error review. Two to three full cycles run before boards, so no chapter is seen for the last time in February.",
  },
  {
    q: "What about test temperament?",
    a: "Regular full-length practice under timed conditions — paper strategy, question selection, and calm under the clock are trained deliberately, then reviewed like the syllabus itself.",
  },
  {
    q: "Can a student join only for Class 12?",
    a: "Yes. The opening weeks diagnose and repair the Class 11 load-bearing ideas each stream needs, then merge the student into the running batch.",
  },
  {
    q: "How do we enquire?",
    a: "Message Saarthi Classes on WhatsApp about Class 12 Science admission — mention PCM or PCB and any entrance goals — and visit the Shahdara centre to plan the year.",
  },
];

const depths = [
  ["Physics", "From electrostatics to semiconductors: derivations understood, numericals practised with units stated, and optics ray diagrams drawn until they are second nature."],
  ["Chemistry", "Physical chemistry formulae through problem sets, organic mechanisms by electron flow rather than memory, and inorganic NCERT lines that boards love to quote."],
  ["Mathematics", "Calculus as the year's centre of gravity, with vectors, 3D geometry, probability and algebra drilled for both board steps and entrance speed."],
  ["Biology", "Genetics problems solved methodically, diagrams labelled to examiner standard, and NCERT terminology precise enough for both boards and NEET."],
];

export default function Class12Page() {
  return (
    <main className="public-site" id="main-content">
      <BreadcrumbJsonLd trail={crumbs} />
      <FaqJsonLd faqs={faqs} />
      <PublicHeader />
      <section className="public-section container">
        <Crumbs trail={crumbs} />
        <Reveal>
          <span className="eyebrow">Class 12 · Science · Shahdara</span>
          <h1 className="editorial-title">
            Class 12 Science <em>Coaching in Shahdara.</em>
          </h1>
          <p className="editorial-lede">
            The final school year asks two things at once: board marks and competitive depth. Saarthi Classes
            sequences them — boards secured first, entrance depth woven through, everything revised in cycles.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <a
              href={whatsAppLink("Hi Saarthi Classes, I want admission details for Class 12 Science coaching.")}
              target="_blank"
              rel="noreferrer"
              className="public-button public-button-primary"
            >
              Enquire about Class 12 →
            </a>
          </div>
        </Reveal>
      </section>

      <section className="public-section container" style={{ paddingTop: 0 }}>
        <Reveal>
          <span className="eyebrow">Subject depth</span>
          <h2 style={{ fontSize: "clamp(30px,3.8vw,50px)", letterSpacing: "-.05em", margin: "14px 0 8px" }}>
            Where the <em>marks live.</em>
          </h2>
        </Reveal>
        <div className="program-rows">
          {depths.map(([title, body], i) => (
            <Reveal key={title} delay={Math.min(i, 2) * 70}>
              <article className="program-row">
                <span className="program-index">0{i + 1}</span>
                <div>
                  <h2>{title}</h2>
                  <p>{body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="public-section container" style={{ paddingTop: 0 }}>
        <div className="editorial-grid">
          <Reveal>
            <span className="eyebrow">Exam readiness</span>
            <h2 style={{ fontSize: "clamp(28px,3.4vw,44px)", letterSpacing: "-.05em", margin: "14px 0 8px" }}>
              Temperament is <em>trained.</em>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="seo-prose">
              <p>
                Knowing the syllabus and scoring in it are different skills. Timed full-length practice, paper
                strategy, and calm-under-the-clock routines are trained and reviewed like any chapter. Students
                continuing from <Link href="/classes/class-11-science">Class 11 Science</Link> keep their rhythm;
                newcomers get Class 11 gaps repaired first.
              </p>
              <p>
                PCM students aiming at engineering pair this with <Link href="/jee-coaching-shahdara">JEE preparation</Link>;
                PCB students aiming at medicine pair it with <Link href="/neet-coaching-shahdara">NEET preparation</Link>.
                Doubt clearing stays daily through the final paper.
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
        heading="Aim higher from here."
        links={[
          { href: "/jee-coaching-shahdara", label: "JEE coaching", note: "Engineering preparation alongside Class 12." },
          { href: "/neet-coaching-shahdara", label: "NEET coaching", note: "Medical preparation alongside Class 12." },
          { href: "/contact", label: "Contact & admission", note: "Plan the final school year with us." },
        ]}
      />
      <CtaBand
        eyebrow="Admission"
        title="Ask about Class 12."
        message="I want admission details for Class 12 Science coaching in Shahdara."
      />
      <WhatsAppFab />
    </main>
  );
}
