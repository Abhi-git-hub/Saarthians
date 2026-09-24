import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/structured-data";
import { CtaBand, Crumbs, FaqSection, SiblingLinks, type Faq } from "@/components/seo-pages";
import { whatsAppLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "JEE Coaching in Shahdara | JEE Preparation | Saarthi Classes",
  description:
    "JEE coaching in Shahdara for students preparing through Class 11 and 12, with concept-building, problem-solving, practice and structured preparation at Saarthi Classes.",
  alternates: { canonical: "https://saarthians.online/jee-coaching-shahdara" },
  openGraph: {
    title: "JEE Coaching in Shahdara | Saarthi Classes",
    description: "Concept-driven JEE preparation in Physics, Chemistry and Maths in Shahdara.",
    url: "https://saarthians.online/jee-coaching-shahdara",
  },
};

const crumbs = [
  { href: "/", label: "Home" },
  { href: "/coaching-classes-shahdara", label: "Coaching in Shahdara" },
  { label: "JEE Coaching" },
];

const faqs: Faq[] = [
  {
    q: "Who is the JEE program for?",
    a: "Class 11 and 12 PCM students in and around Shahdara who want serious JEE preparation without leaving their school studies behind. It suits students willing to solve problems daily — JEE rewards consistency over intensity.",
  },
  {
    q: "Which subjects are covered?",
    a: "Physics, Chemistry and Mathematics — the complete JEE syllabus across Class 11 and 12, taught from NCERT upwards: concept first, then Mains-level speed, then Advanced-level depth for students who earn it.",
  },
  {
    q: "How does JEE preparation fit with Class 11 and 12 schoolwork?",
    a: "It runs on the same chapters. School syllabus completes with answer-writing discipline while the same topics get a second, deeper problem-solving pass. One timetable, two outcomes — school marks are never sacrificed.",
  },
  {
    q: "How is doubt support handled for JEE?",
    a: "Daily, like everything else here. JEE doubts compound fastest of all — a stuck rotational-mechanics concept blocks the next three chapters — so nothing waits for the weekend.",
  },
  {
    q: "What should families realistically expect?",
    a: "Honest work and measurable progress: stronger concepts, faster problem-solving, and test scores that move with effort. Nobody here promises selections or ranks — the promise is preparation without gaps.",
  },
  {
    q: "How do we enquire about JEE batches?",
    a: "Message Saarthi Classes on WhatsApp about JEE coaching — mention the student's class and current school — and visit the Shahdara centre to discuss the plan.",
  },
];

const pillars = [
  ["01", "Concepts before tricks", "Every JEE topic starts from first principles. Shortcuts are taught only after the long method is understood — because Advanced punishes shortcut-only preparation."],
  ["02", "Mains speed, Advanced depth", "Timed practice builds the speed Mains demands; selected hard problems build the depth Advanced demands. Students progress from one to the other on evidence, not hope."],
  ["03", "Errors reviewed, not just marked", "Every test returns with an error log: which concept, which habit, what changes. The next week's sets target exactly those gaps."],
];

export default function JeePage() {
  return (
    <main className="public-site" id="main-content">
      <BreadcrumbJsonLd trail={crumbs} />
      <FaqJsonLd faqs={faqs} />
      <PublicHeader />
      <section className="public-section container">
        <Crumbs trail={crumbs} />
        <Reveal>
          <span className="eyebrow">JEE · Physics · Chemistry · Maths · Shahdara</span>
          <h1 className="editorial-title">
            JEE Coaching &amp; Preparation <em>in Shahdara.</em>
          </h1>
          <p className="editorial-lede">
            Not a giant institute with a Shahdara branch — a Shahdara classroom that prepares for JEE properly:
            small batches, concept-driven teaching, and problem-solving trained daily through Class 11 and 12.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <a
              href={whatsAppLink("Hi Saarthi Classes, I want admission details for JEE coaching.")}
              target="_blank"
              rel="noreferrer"
              className="public-button public-button-primary"
            >
              Enquire about JEE →
            </a>
          </div>
        </Reveal>
      </section>

      <section className="public-section container" style={{ paddingTop: 0 }}>
        <Reveal>
          <span className="eyebrow">How preparation works</span>
          <h2 style={{ fontSize: "clamp(30px,3.8vw,50px)", letterSpacing: "-.05em", margin: "14px 0 8px" }}>
            Three habits, <em>two years.</em>
          </h2>
        </Reveal>
        <ol className="principle-list">
          {pillars.map(([n, title, body], i) => (
            <Reveal as="li" key={n} delay={i * 80}>
              <span>{n}</span>
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
            <span className="eyebrow">Alongside school</span>
            <h2 style={{ fontSize: "clamp(28px,3.4vw,44px)", letterSpacing: "-.05em", margin: "14px 0 8px" }}>
              One timetable, <em>two outcomes.</em>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="seo-prose">
              <p>
                Most students here prepare for JEE while studying in <Link href="/classes/class-11-science">Class 11 Science</Link> and{" "}
                <Link href="/classes/class-12-science">Class 12 Science</Link>. The school syllabus completes with
                board discipline; the same chapters get a deeper competitive pass. Revision cycles and tests serve
                both goals at once.
              </p>
              <p>
                Families should know plainly what this program is: focused local preparation with honest feedback.
                What it is not: a national brand, a guaranteed selection, or a shortcut factory. Students who work
                the daily sets improve; the tests will show it before any counsellor claims it.
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
        heading="The classes behind it."
        links={[
          {
            href: "/classes/class-11-science",
            label: "Class 11 Science",
            note: "Where JEE foundations are laid.",
          },
          {
            href: "/classes/class-12-science",
            label: "Class 12 Science",
            note: "Boards plus competitive depth.",
          },
          { href: "/contact", label: "Contact & admission", note: "Discuss the two-year plan in person." },
        ]}
      />
      <CtaBand
        eyebrow="Admission"
        title="Ask about JEE."
        message="I want admission details for JEE coaching in Shahdara."
      />
      <WhatsAppFab />
    </main>
  );
}
