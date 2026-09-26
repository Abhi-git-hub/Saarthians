import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/structured-data";
import { CtaBand, Crumbs, FaqSection, SiblingLinks, type Faq } from "@/components/seo-pages";
import { ADDRESS_LINES, CONTACT_EMAIL, MAPS_PLACE_URL, WHATSAPP_DISPLAY, whatsAppLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Coaching Classes in Shahdara | Saarthi Classes",
  description:
    "Saarthi Classes in Shahdara offers academic coaching for Classes 9–12, school-subject tuition, JEE and NEET preparation, with the Saarthians student learning platform.",
  alternates: { canonical: "https://saarthians.online/coaching-classes-shahdara" },
  openGraph: {
    title: "Coaching Classes in Shahdara | Saarthi Classes",
    description:
      "Academic coaching for Classes 9–12, school-subject tuition, JEE and NEET preparation in Shahdara, Delhi.",
    url: "https://saarthians.online/coaching-classes-shahdara",
  },
};

const crumbs = [{ href: "/", label: "Home" }, { label: "Coaching Classes in Shahdara" }];

const faqs: Faq[] = [
  {
    q: "Where is Saarthi Classes located?",
    a: "Saarthi Classes is at 267, Gali No. 16, Balbir Nagar Extension, Shahdara, Delhi, 110032 — reachable from across East Delhi. Parents usually first visit the centre, sit through a class discussion, and then decide.",
  },
  {
    q: "Which classes does Saarthi Classes teach?",
    a: "Classes 9 and 10 across school subjects, Class 11 and 12 Science (Physics, Chemistry, Mathematics and Biology), plus JEE preparation for engineering aspirants and NEET preparation for medical aspirants.",
  },
  {
    q: "What is the difference between Saarthians and Saarthi Classes?",
    a: "Saarthi Classes is the physical coaching centre in Shahdara where teaching happens. Saarthians is the student learning platform members use alongside it — for shared notes, class study material, and class-test marks recorded by their teachers.",
  },
  {
    q: "How do admissions work?",
    a: "There is no online form to fill blindly. Message Saarthi Classes on WhatsApp, discuss the student's class and subjects, visit the centre if you like, and get batch timings directly. Accounts for the student platform are created by the administrator.",
  },
];

const tracks = [
  { href: "/classes/class-9", label: "Class 9", note: "Foundations across all school subjects, built patiently." },
  { href: "/classes/class-10", label: "Class 10", note: "Board-year coaching with structured revision and practice." },
  { href: "/classes/class-11-science", label: "Class 11 Science", note: "Physics, Chemistry, Maths and Biology from the ground up." },
  { href: "/classes/class-12-science", label: "Class 12 Science", note: "Boards plus competitive depth, revised in cycles." },
  { href: "/jee-coaching-shahdara", label: "JEE coaching", note: "Concept-driven Physics, Chemistry and Maths preparation." },
  { href: "/neet-coaching-shahdara", label: "NEET coaching", note: "Biology-first preparation with NCERT mastery." },
];

export default function CoachingHubPage() {
  return (
    <main className="public-site" id="main-content">
      <BreadcrumbJsonLd trail={crumbs} />
      <FaqJsonLd faqs={faqs} />
      <PublicHeader />
      <section className="public-section container">
        <Crumbs trail={crumbs} />
        <Reveal>
          <span className="eyebrow">Saarthi Classes · Shahdara, Delhi</span>
          <h1 className="editorial-title">Coaching classes in Shahdara, <em>taught properly.</em></h1>
          <p className="editorial-lede">
            Saarthi Classes is a neighbourhood coaching centre in Shahdara for Classes 9–12 — school subjects,
            Science, and JEE/NEET preparation — where small batches, daily doubt clearing, and visible progress
            matter more than hoardings.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <a
              href={whatsAppLink("Hi Saarthi Classes, I want admission details.")}
              target="_blank"
              rel="noreferrer"
              className="public-button public-button-primary"
            >
              Ask about admission →
            </a>
            <Link href="/programs" className="public-button public-button-secondary">
              Compare all programs
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="public-section container" style={{ paddingTop: 0 }}>
        <Reveal>
          <span className="eyebrow">What is taught here</span>
          <h2 style={{ fontSize: "clamp(30px,3.8vw,50px)", letterSpacing: "-.05em", margin: "14px 0 8px" }}>
            One centre, six tracks.
          </h2>
          <p style={{ color: "var(--muted)", maxWidth: 640, lineHeight: 1.75 }}>
            Every track below has its own page explaining who it suits and how teaching works — written for
            parents comparing options, not for search engines.
          </p>
        </Reveal>
        <div className="program-rows">
          {tracks.map((track, i) => (
            <Reveal key={track.href} delay={Math.min(i, 2) * 70}>
              <article className="program-row">
                <span className="program-index">0{i + 1}</span>
                <div>
                  <h2>
                    <Link href={track.href}>{track.label}</Link>
                  </h2>
                  <p>{track.note}</p>
                </div>
                <Link href={track.href} className="public-button public-button-secondary">
                  Read more →
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="rhythm-band">
        <div className="container">
          <Reveal>
            <span className="eyebrow light">How learning works here</span>
            <h2>
              Understand. Practice. <em>Review. Improve.</em>
            </h2>
            <div className="seo-prose" style={{ marginTop: 26 }}>
              <p style={{ color: "#cfc6b2" }}>
                A concept is taught until it feels obvious, then practised until it holds under exam pressure.
                Tests are marked and analysed with the student — mistakes become the next week&apos;s plan, not
                just a score. Members also get the Saarthians workspace: shared notes with pictures, study
                material for their own class, and class-test marks they can see in their profile.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="public-section container">
        <Reveal>
          <span className="eyebrow">Visit the centre</span>
          <h2 style={{ fontSize: "clamp(30px,3.8vw,50px)", letterSpacing: "-.05em", margin: "14px 0 8px" }}>
            Come, sit in a class. <em>Then decide.</em>
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p style={{ color: "var(--muted)", maxWidth: 640, lineHeight: 1.75 }}>
            {ADDRESS_LINES.join(", ")}. Email {CONTACT_EMAIL}, WhatsApp {WHATSAPP_DISPLAY} — or{" "}
            <a href={MAPS_PLACE_URL} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 700 }}>
              open the location on Google Maps
            </a>
            . For the full story of the teaching philosophy, read <Link href="/about">about Saarthians</Link>.
          </p>
        </Reveal>
        <Reveal delay={120}>
          <span className="eyebrow" style={{ marginTop: 44, display: "inline-flex" }}>Common questions</span>
          <FaqSection faqs={faqs} />
        </Reveal>
      </section>

      <SiblingLinks
        heading="Start from your class."
        links={[
          { href: "/classes/class-9", label: "Class 9 tuition", note: "Foundations across all subjects." },
          { href: "/classes/class-10", label: "Class 10 tuition", note: "Board-year coaching, done deliberately." },
          { href: "/contact", label: "Contact & admission", note: "Talk to us before you decide anything." },
        ]}
      />
      <CtaBand
        eyebrow="Admission"
        title="Talk to us directly."
        message="I want admission details for coaching in Shahdara."
      />
      <WhatsAppFab />
    </main>
  );
}
