import type { Metadata } from "next";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/structured-data";
import { CtaBand, Crumbs, FaqSection, SiblingLinks, type Faq } from "@/components/seo-pages";
import { whatsAppLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Class 9 Tuition in Shahdara | Saarthi Classes",
  description:
    "Class 9 tuition in Shahdara for CBSE students, with school-subject coaching, regular practice, doubt support and focused learning at Saarthi Classes.",
  alternates: { canonical: "https://saarthians.online/classes/class-9" },
  openGraph: {
    title: "Class 9 Tuition in Shahdara | Saarthi Classes",
    description: "School-subject coaching, regular practice and doubt support for Class 9 students in Shahdara.",
    url: "https://saarthians.online/classes/class-9",
  },
};

const crumbs = [
  { href: "/", label: "Home" },
  { href: "/coaching-classes-shahdara", label: "Coaching in Shahdara" },
  { label: "Class 9 Tuition" },
];

const faqs: Faq[] = [
  {
    q: "Which Class 9 subjects are covered?",
    a: "All school subjects — Mathematics, Science, English and Social Science — taught from NCERT with extra practice where students typically struggle, such as algebra, geometry proofs, and answer structuring.",
  },
  {
    q: "Is this suitable for CBSE Class 9 students?",
    a: "Yes. Teaching follows the CBSE syllabus and NCERT textbooks, with attention to how school exams actually mark answers — not just whether the final result is right.",
  },
  {
    q: "How does doubt support work for Class 9?",
    a: "Doubts are cleared daily, in class and after it. Class 9 is where small confusions compound into Class 10 gaps, so no doubt is treated as too small to ask.",
  },
  {
    q: "How are parents kept informed?",
    a: "Through regular tests with marked, reviewed answer sheets — parents see what improved and what the next focus is, instead of a bare percentage.",
  },
  {
    q: "Who should consider Class 9 tuition here?",
    a: "Students in Shahdara who want steady school-subject support through Class 9, especially in Maths and Science, and parents who prefer patient concept teaching over shortcut tricks.",
  },
  {
    q: "How can we enquire about Class 9 batches?",
    a: "Message Saarthi Classes on WhatsApp about Class 9 admission — mention the student's school and subjects — and visit the centre to discuss batch timings.",
  },
];

const subjects = [
  ["Maths", "Number systems, algebra, geometry, mensuration — the chapters where Class 9 results are actually decided, practised until methods feel automatic."],
  ["Science", "Physics, Chemistry and Biology from NCERT, with experiments and diagrams explained rather than dictated."],
  ["English & Social Science", "Answer-writing discipline: structured responses, map work, and the writing skills school exams reward."],
];

export default function Class9Page() {
  return (
    <main className="public-site" id="main-content">
      <BreadcrumbJsonLd trail={crumbs} />
      <FaqJsonLd faqs={faqs} />
      <PublicHeader />
      <section className="public-section container">
        <Crumbs trail={crumbs} />
        <Reveal>
          <span className="eyebrow">Class 9 · All subjects · Shahdara</span>
          <h1 className="editorial-title">
            Class 9 Tuition &amp; Coaching <em>in Shahdara.</em>
          </h1>
          <p className="editorial-lede">
            Class 9 is the year school gets serious — new algebra, real geometry, Science that splits into three
            disciplines. Saarthi Classes teaches it patiently: every concept until it feels obvious, then practice
            until it holds.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <a
              href={whatsAppLink("Hi Saarthi Classes, I want admission details for Class 9 tuition.")}
              target="_blank"
              rel="noreferrer"
              className="public-button public-button-primary"
            >
              Enquire about Class 9 →
            </a>
          </div>
        </Reveal>
      </section>

      <section className="public-section container" style={{ paddingTop: 0 }}>
        <Reveal>
          <span className="eyebrow">What Class 9 students study here</span>
          <h2 style={{ fontSize: "clamp(30px,3.8vw,50px)", letterSpacing: "-.05em", margin: "14px 0 8px" }}>
            School subjects, <em>taken seriously.</em>
          </h2>
        </Reveal>
        <ol className="principle-list">
          {subjects.map(([title, body], i) => (
            <Reveal as="li" key={title} delay={i * 80}>
              <span>0{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="public-section container" style={{ paddingTop: 0 }}>
        <div className="editorial-grid">
          <Reveal>
            <span className="eyebrow">How learning works</span>
            <h2 style={{ fontSize: "clamp(28px,3.4vw,44px)", letterSpacing: "-.05em", margin: "14px 0 8px" }}>
              Small doubts, <em>daily answers.</em>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="seo-prose">
              <p>
                A Class 9 student typically attends concept classes through the week, practises with homework and
                short tests, and brings every stuck point back the next day. Revision is planned, not crammed —
                chapters return in cycles so older portions stay alive while new ones begin.
              </p>
              <p>
                Parents see marked work and hear plainly what changed: which method clicked, which habit needs
                attention, what the coming weeks target. When Class 9 ends, the student walks into the board year
                with methods already automatic — <a href="/classes/class-10">Class 10 tuition</a> builds directly
                on this foundation.
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
        heading="Where Class 9 leads."
        links={[
          { href: "/classes/class-10", label: "Class 10 tuition", note: "The board year, built on this foundation." },
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
        title="Ask about Class 9."
        message="I want admission details for Class 9 tuition in Shahdara."
      />
      <WhatsAppFab />
    </main>
  );
}
