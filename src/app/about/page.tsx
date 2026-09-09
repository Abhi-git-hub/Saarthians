import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { SafeImage } from "@/components/safe-image";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { BRAND_IMAGES, FOUNDER_NAME, FOUNDER_QUOTE, FOUNDER_TITLE, whatsAppLink } from "@/lib/site";

const beliefs = [
  ["Understanding first", "A student who truly understands a concept can face any variation of it. Shortcuts fade; clarity compounds."],
  ["Attention is teaching", "Knowing each student's weak chapters, silly-error patterns and confidence dips — that is the real syllabus."],
  ["Discipline with warmth", "Regular tests and honest feedback, delivered by teachers who genuinely want the child to win."],
  ["Progress must be visible", "Marks matter only when they show what to fix next. Students, teachers and parents watch the same signals."],
];

export default function AboutPage() {
  return (
    <main className="public-site">
      <PublicHeader />
      <section className="public-section container">
        <Reveal>
          <span className="eyebrow">About Saarthians</span>
          <h1 className="editorial-title">Less noise.<br /><em>More direction.</em></h1>
          <div className="editorial-grid"><p>Saarthians is the digital home of Saarthi Classes, Shahdara — an education experience built around a simple idea: students do better when the system around them makes the next useful step obvious.</p><p>That means thoughtful study tools, meaningful assessment, visible progress and human support — all in one secure place.</p></div>
        </Reveal>
      </section>
      <section className="classroom-band">
        <div className="container">
          <Reveal>
            <SafeImage src={BRAND_IMAGES.classroom} alt="Teaching wall at Saarthi Classes" className="classroom-wide" />
          </Reveal>
        </div>
      </section>
      <section className="public-section container">
        <Reveal>
          <div className="section-intro">
            <div><span className="eyebrow">What we believe</span><h2>Four ideas run <em>every classroom.</em></h2></div>
            <p>The philosophy behind Saarthi — practised daily, not printed on a wall.</p>
          </div>
        </Reveal>
        <ol className="principle-list">
          {beliefs.map(([title, body], i) => (
            <Reveal key={title} delay={i * 80}>
              <li><span>0{i + 1}</span><div><h3>{title}</h3><p>{body}</p></div></li>
            </Reveal>
          ))}
        </ol>
      </section>
      <section className="split-story">
        <div className="container founder-grid">
          <Reveal>
            <div>
              <span className="eyebrow light">Meet the founder</span>
              <h2>{FOUNDER_NAME}.<br /><em>{FOUNDER_TITLE}.</em></h2>
              <p className="founder-quote">“{FOUNDER_QUOTE}”</p>
              <SafeImage src={BRAND_IMAGES.signature} alt={`Signature of ${FOUNDER_NAME}`} className="founder-signature" />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="split-story-copy"><p>Abhi Yadav teaches Classes 9–12 across all subjects and mentors NEET and JEE aspirants with unusual patience for difficult concepts. His classroom rule is simple: no student leaves with a doubt unasked.</p><p>We design the experience for students first, while giving teachers the operational visibility they need. Private learning records stay protected by server-side authorization and database controls.</p><a href={whatsAppLink("Hi Abhi Sir, I would like to discuss admission.")} target="_blank" rel="noreferrer" className="light-link">Talk to the founder →</a></div>
          </Reveal>
        </div>
      </section>
      <section className="public-section container">
        <div className="public-cta" style={{ marginBottom: 0 }}>
          <Reveal>
            <div><span className="eyebrow">Experience it</span><h2>Sit in a class.<br /><em>Then decide.</em></h2></div>
          </Reveal>
          <Link href="/contact" className="public-button public-button-primary">Visit us →</Link>
        </div>
      </section>
      <WhatsAppFab />
    </main>
  );
}
