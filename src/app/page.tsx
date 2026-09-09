import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { SafeImage } from "@/components/safe-image";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import {
  ADDRESS_LINES,
  BRAND_IMAGES,
  CONTACT_EMAIL,
  COURSES,
  FOUNDER_NAME,
  FOUNDER_QUOTE,
  FOUNDER_TITLE,
  MAPS_EMBED_URL,
  MAPS_PLACE_URL,
  WHATSAPP_DISPLAY,
  whatsAppLink,
} from "@/lib/site";

export default function Home() {
  return (
    <main className="public-site">
      <PublicHeader />

      <section className="public-hero">
        <div className="container public-hero-grid">
          <div className="public-hero-copy">
            <span className="eyebrow">Saarthi Classes · Shahdara, Delhi</span>
            <h1>Classes 9–12, all subjects.<br /><em>NEET & JEE coaching.</em></h1>
            <p>Saarthians brings notes, assessments, progress and intelligent learning support into one calm workspace — built around the classroom teaching of Saarthi Classes.</p>
            <div className="hero-actions">
              <Link href="/login" className="public-button public-button-primary">Enter your workspace →</Link>
              <a href={whatsAppLink("Hi Saarthi Classes, I would like to know more about admission for Classes 9–12 / NEET / JEE.")} target="_blank" rel="noreferrer" className="public-button public-button-secondary">WhatsApp {WHATSAPP_DISPLAY}</a>
            </div>
            <div className="hero-proof"><span>01</span><p>Concept-first teaching for school and competitive exams, with personal mentoring from the founder.</p></div>
          </div>
          <div className="hero-visual">
            <SafeImage src={BRAND_IMAGES.classroom} alt="Inside a Saarthi Classes classroom" eager />
            <div className="hero-float-card"><strong>Learn deeply.</strong><span>Notes · Tests · Progress · AI</span></div>
          </div>
        </div>
      </section>

      <section className="public-marquee" aria-label="Saarthians values">
        <div>CLASSES 9–12 · ALL SUBJECTS</div><span>•</span><div>NEET COACHING</div><span>•</span><div>JEE COACHING</div><span>•</span><div>CLASSES 9–12 · ALL SUBJECTS</div>
      </section>

      <section className="public-section container" id="experience">
        <div className="section-intro">
          <div><span className="eyebrow">The Saarthians experience</span><h2>Everything important,<br /><em>in one place.</em></h2></div>
          <p>A premium learning environment without the clutter. Every surface is designed to make the next useful action obvious.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card feature-card-large"><span>01</span><h3>Notes that stay useful.</h3><p>Write, organize and revisit learning material without losing the thread.</p><div className="feature-image"><SafeImage src={BRAND_IMAGES.classroom} alt="Saarthi Classes classroom" /></div></article>
          <article className="feature-card"><span>02</span><h3>Tests that show what to fix.</h3><p>Practice, submit and turn results into clear areas for improvement.</p><div className="mini-stat"><strong>9–12</strong><span>NEET · JEE</span></div></article>
          <article className="feature-card dark-card"><span>03</span><h3>Progress you can understand.</h3><p>See patterns across your learning instead of chasing isolated marks.</p><div className="progress-lines"><i style={{ width: "82%" }} /><i style={{ width: "64%" }} /><i style={{ width: "91%" }} /></div></article>
          <article className="feature-card feature-card-image logo-card"><SafeImage src={BRAND_IMAGES.logo} alt="Saarthi Classes — guiding towards success" /><div><span>04</span><h3>Better teaching visibility.</h3><p>Teachers get focused tools for students, materials and assessments.</p></div></article>
        </div>
      </section>

      <section className="public-section container" id="courses">
        <div className="section-intro">
          <div><span className="eyebrow">Courses</span><h2>9th to 12th, all subjects.<br /><em>NEET & JEE included.</em></h2></div>
          <p>Complete classroom coaching for secondary and senior-secondary science — plus dedicated medical and engineering entrance preparation.</p>
        </div>
        <div className="feature-grid">
          {COURSES.map((course) => (
            <article className="feature-card" key={course.tag}><span>{course.tag}</span><h3>{course.title}</h3><p>{course.body}</p></article>
          ))}
        </div>
      </section>

      <section className="split-story">
        <div className="container founder-grid">
          <div>
            <span className="eyebrow light">From the founder</span>
            <p className="founder-quote">“{FOUNDER_QUOTE}”</p>
            <p className="founder-name">— {FOUNDER_NAME}, {FOUNDER_TITLE}</p>
            <SafeImage src={BRAND_IMAGES.signature} alt={`Signature of ${FOUNDER_NAME}`} className="founder-signature" />
          </div>
          <div className="split-story-copy"><p>Saarthi Classes exists for one reason: students in Shahdara and beyond deserve teaching that treats every concept as learnable and every student as capable of a top rank. Small batches, honest feedback, and a workspace that keeps learning visible.</p><Link href="/about" className="light-link">Why Saarthians exists →</Link></div>
        </div>
      </section>

      <section className="public-section container">
        <div className="section-intro compact"><div><span className="eyebrow">Choose your next step</span><h2>Start where you are.</h2></div></div>
        <div className="path-grid">
          <Link href="/programs" className="path-card"><span>FOR STUDENTS</span><strong>Build a stronger study rhythm →</strong><p>Focused programs, practice and a workspace that keeps you moving.</p></Link>
          <Link href="/contact" className="path-card path-card-accent"><span>FOR PARENTS</span><strong>Ask the right questions →</strong><p>Talk to Saarthians about programs, learning support and next steps.</p></Link>
          <Link href="/login" className="path-card"><span>FOR MEMBERS</span><strong>Return to your workspace →</strong><p>Pick up your notes, tests, progress and learning context where you left off.</p></Link>
        </div>
      </section>

      <section className="public-section container" id="visit">
        <div className="section-intro">
          <div><span className="eyebrow">Visit us</span><h2>Come, sit in a class.<br /><em>Then decide.</em></h2></div>
          <p>{ADDRESS_LINES.join(", ")}. Open the map for directions, or message us on WhatsApp first.</p>
        </div>
        <div className="map-frame">
          <iframe title="Saarthi Classes on Google Maps" src={MAPS_EMBED_URL} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </div>
        <div className="hero-actions" style={{ marginTop: 18 }}>
          <a href={MAPS_PLACE_URL} target="_blank" rel="noreferrer" className="public-button public-button-secondary">Open in Google Maps →</a>
          <a href={whatsAppLink("Hi Saarthi Classes, I would like to visit the centre.")} target="_blank" rel="noreferrer" className="public-button public-button-primary">Plan a visit on WhatsApp</a>
        </div>
      </section>

      <section className="public-cta container">
        <div><span className="eyebrow">A calmer way to learn</span><h2>Make the next hour<br /><em>count.</em></h2></div>
        <Link href="/login" className="public-button public-button-primary">Enter Saarthians →</Link>
      </section>

      <footer className="public-footer"><div className="container footer-grid"><div><Link href="/" className="public-brand">saarthians<span>.online</span></Link><p>Learn with direction.</p><p>{ADDRESS_LINES[0]},<br />{ADDRESS_LINES[1]}</p><p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br /><a href={whatsAppLink("Hi Saarthi Classes!") } target="_blank" rel="noreferrer">{WHATSAPP_DISPLAY}</a></p></div><div><strong>Explore</strong><Link href="/about">About</Link><Link href="/programs">Programs</Link><Link href="/portfolio">Portfolio</Link></div><div><strong>Support</strong><Link href="/resources">Resources</Link><Link href="/contact">Contact</Link><Link href="/login">Sign in</Link></div><div><strong>Trust</strong><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link></div></div><div className="container footer-bottom"><span>© 2026 Saarthians · Saarthi Classes</span><span>Built for focused learning.</span></div></footer>
      <WhatsAppFab />
    </main>
  );
}
