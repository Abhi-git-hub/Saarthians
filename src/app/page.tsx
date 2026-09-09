import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
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
  REVIEWS,
  WHATSAPP_DISPLAY,
  whatsAppLink,
} from "@/lib/site";

function Stars({ count }: { count: number }) {
  return (
    <span className="review-stars" aria-label={`${count} out of 5 stars`}>
      {"★".repeat(count)}
    </span>
  );
}

const principles = [
  ["01", "Attention is personal", "Small batches mean Abhi Sir knows exactly where each student stands — which concept clicked, which doubt keeps returning, what to revise next."],
  ["02", "Concepts before shortcuts", "Every chapter is taught until it feels obvious. Tests and tricks come after understanding, never instead of it."],
  ["03", "Progress you can see", "Regular tests, honest feedback, and a workspace where students, teachers and parents watch understanding grow week by week."],
];

const signals = [
  ["6", "Programs", "Classes 9–12, all subjects, plus NEET & JEE tracks."],
  ["9–12", "Grades covered", "The full secondary + senior-secondary arc in one place."],
  ["2", "Entrance tracks", "Dedicated NEET and JEE preparation alongside boards."],
  ["5★", "Google reviews", "Five-star parent reviews on our Maps listing."],
];

export default function Home() {
  return (
    <main className="public-site">
      <PublicHeader />

      <section className="public-hero hero-story">
        <div className="container public-hero-grid">
          <div className="public-hero-copy">
            <span className="eyebrow">Saarthi Classes · Shahdara, Delhi</span>
            <h1>Where Shahdara comes <em>to understand.</em></h1>
            <p>Classes 9–12 in every subject, with NEET & JEE coaching built in — taught by teachers students describe as patient, personal, and relentlessly clear.</p>
            <div className="hero-actions">
              <a href={whatsAppLink("Hi Saarthi Classes, I would like to know more about admission.")} target="_blank" rel="noreferrer" className="public-button public-button-primary">Talk to Saarthi →</a>
              <Link href="/programs" className="public-button public-button-secondary">Explore programs</Link>
            </div>
            <div className="hero-trust">
              <Stars count={5} />
              <p><strong>Loved by parents on Google.</strong><br />Real 5-star reviews on our Maps listing — read them below.</p>
            </div>
          </div>
          <div className="hero-visual hero-arch">
            <SafeImage src={BRAND_IMAGES.classroom} alt="Inside a Saarthi Classes classroom" eager />
            <div className="hero-seal"><SafeImage src={BRAND_IMAGES.logo} alt="Saarthi Classes seal" eager /><span>Guiding towards success</span></div>
            <div className="hero-float-card float"><strong>Doubts cleared daily.</strong><span>Ask anything · No hesitation</span></div>
          </div>
        </div>
      </section>

      <section className="trust-ticker" aria-label="What reviewers mention">
        <div className="trust-ticker-track">
          {["CONCEPT CLARITY", "DOUBT CLEARING", "PERSONAL ATTENTION", "REGULAR TESTS", "PATIENT TEACHING", "PARENT TRUST"].concat(["CONCEPT CLARITY", "DOUBT CLEARING", "PERSONAL ATTENTION", "REGULAR TESTS", "PATIENT TEACHING", "PARENT TRUST"]).map((item, i) => (
            <span key={i}>{item}<i>✦</i></span>
          ))}
        </div>
      </section>

      <section className="public-section container" id="why">
        <Reveal>
          <div className="section-intro">
            <div><span className="eyebrow">Why Saarthians</span><h2>Teaching that treats every child <em>as capable.</em></h2></div>
            <p>Parents keep describing the same three things. So we built the whole experience around them.</p>
          </div>
        </Reveal>
        <ol className="principle-list">
          {principles.map(([n, title, body], i) => (
            <Reveal key={n} delay={i * 90}>
              <li><span>{n}</span><div><h3>{title}</h3><p>{body}</p></div></li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="experience-band">
        <div className="container experience-grid">
          <Reveal className="experience-media">
            <SafeImage src={BRAND_IMAGES.classroom} alt="Students learning at Saarthi Classes" />
            <p className="media-caption">A real classroom in Shahdara — whiteboard, trophies, and chairs that fill up.</p>
          </Reveal>
          <div>
            <Reveal>
              <span className="eyebrow">The learning experience</span>
              <h2>Understand in class.<br /><em>Prove it in the workspace.</em></h2>
            </Reveal>
            <ul className="experience-rows">
              <Reveal delay={60}><li><strong>Learn</strong><p>Concept-first classroom teaching for Classes 9–12, NEET and JEE.</p></li></Reveal>
              <Reveal delay={120}><li><strong>Practice</strong><p>Notes, assignments and server-graded tests inside the student workspace.</p></li></Reveal>
              <Reveal delay={180}><li><strong>Improve</strong><p>Results become visible patterns — teachers intervene before small gaps grow.</p></li></Reveal>
            </ul>
            <Reveal delay={220}><Link href="/login" className="text-link-big">Enter the student workspace →</Link></Reveal>
          </div>
        </div>
      </section>

      <section className="public-section container" id="signals">
        <Reveal>
          <div className="section-intro compact">
            <div><span className="eyebrow">Honest signals</span><h2>Only what we can <em>actually claim.</em></h2></div>
          </div>
        </Reveal>
        <dl className="signal-grid">
          {signals.map(([value, label, note], i) => (
            <Reveal key={label} delay={i * 80}>
              <div className="signal"><dt>{value}</dt><dd><strong>{label}</strong><span>{note}</span></dd></div>
            </Reveal>
          ))}
        </dl>
      </section>

      <section className="public-section reviews-section" id="reviews">
        <div className="container">
          <Reveal>
            <div className="section-intro">
              <div><span className="eyebrow">Wall of love</span><h2>Parents notice.<br /><em>Students feel it.</em></h2></div>
              <p>Unedited excerpts from our Google Maps listing — with a link to read every word in context.</p>
            </div>
          </Reveal>
          <div className="testimonial-stage">
            <Reveal delay={80}>
              <figure className="testimonial-feature lift">
                <Stars count={REVIEWS[0].stars} />
                <blockquote>“{REVIEWS[0].text}”</blockquote>
                <figcaption><strong>{REVIEWS[0].name}</strong><span>{REVIEWS[0].meta}</span></figcaption>
              </figure>
            </Reveal>
            <div className="testimonial-side">
              <Reveal delay={160}>
                <figure className="testimonial lift">
                  <Stars count={REVIEWS[1].stars} />
                  <blockquote>“{REVIEWS[1].text}”</blockquote>
                  <figcaption><strong>{REVIEWS[1].name}</strong><span>{REVIEWS[1].meta}</span></figcaption>
                  {REVIEWS[1].ownerResponse && <p className="review-owner">{REVIEWS[1].ownerResponse}</p>}
                </figure>
              </Reveal>
              <Reveal delay={220}>
                <a className="testimonial-more lift" href={MAPS_PLACE_URL} target="_blank" rel="noreferrer">
                  <Stars count={5} />
                  <p><strong>Read every review — or leave your own.</strong></p>
                  <span>Open Google Maps →</span>
                </a>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section container" id="courses">
        <Reveal>
          <div className="section-intro">
            <div><span className="eyebrow">Courses</span><h2>9th to 12th, all subjects.<br /><em>NEET & JEE included.</em></h2></div>
            <p>Six focused tracks. One rhythm: understand, practice, review, improve.</p>
          </div>
        </Reveal>
        <div className="course-rows">
          {COURSES.map((course, i) => (
            <Reveal key={course.tag} delay={Math.min(i, 2) * 70}>
              <article className="course-row">
                <span className="course-tag">{course.tag}</span>
                <div><h3>{course.title}</h3><p>{course.body}</p></div>
                <a className="course-cta" href={whatsAppLink(`Hi Saarthi Classes, I want details about ${course.title}.`)} target="_blank" rel="noreferrer" aria-label={`Ask about ${course.title} on WhatsApp`}>Ask →</a>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="center-cta"><Link href="/programs" className="public-button public-button-secondary">Compare all programs →</Link></div>
        </Reveal>
      </section>

      <section className="split-story">
        <div className="container founder-grid">
          <Reveal>
            <div>
              <span className="eyebrow light">From the founder</span>
              <p className="founder-quote">“{FOUNDER_QUOTE}”</p>
              <p className="founder-name">— {FOUNDER_NAME}, {FOUNDER_TITLE}</p>
              <SafeImage src={BRAND_IMAGES.signature} alt={`Signature of ${FOUNDER_NAME}`} className="founder-signature" />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="split-story-copy"><p>Saarthi Classes exists for one reason: students in Shahdara and beyond deserve teaching that treats every concept as learnable and every student as capable of a top rank. Small batches, honest feedback, and a workspace that keeps learning visible.</p><Link href="/about" className="light-link">Why Saarthians exists →</Link></div>
          </Reveal>
        </div>
      </section>

      <section className="public-section container" id="visit">
        <Reveal>
          <div className="location-card lift">
            <div>
              <span className="eyebrow">Visit Saarthi Classes</span>
              <h2>Come, sit in a class. <em>Then decide.</em></h2>
              <p>{ADDRESS_LINES.join(", ")}</p>
              <div className="hero-actions">
                <a href={MAPS_PLACE_URL} target="_blank" rel="noreferrer" className="public-button public-button-secondary">Directions →</a>
                <a href={whatsAppLink("Hi Saarthi Classes, I would like to visit the centre.")} target="_blank" rel="noreferrer" className="public-button public-button-primary">Plan a visit</a>
              </div>
            </div>
            <div className="location-map">
              <iframe title="Saarthi Classes on Google Maps" src={MAPS_EMBED_URL} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            </div>
          </div>
        </Reveal>
      </section>

      <section className="public-cta container">
        <Reveal>
          <div><span className="eyebrow">Begin</span><h2>Your rank journey<br /><em>starts with a message.</em></h2></div>
        </Reveal>
        <div className="hero-actions">
          <a href={whatsAppLink("Hi Saarthi Classes, I want to join.")} target="_blank" rel="noreferrer" className="public-button public-button-primary">Join Saarthians →</a>
          <Link href="/login" className="public-button public-button-secondary">Member login</Link>
        </div>
      </section>

      <footer className="public-footer"><div className="container footer-grid"><div><Link href="/" className="public-brand">saarthians<span>.online</span></Link><p>Learn with direction.</p><p>{ADDRESS_LINES[0]},<br />{ADDRESS_LINES[1]}</p><p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br /><a href={whatsAppLink("Hi Saarthi Classes!")} target="_blank" rel="noreferrer">{WHATSAPP_DISPLAY}</a></p></div><div><strong>Explore</strong><Link href="/about">About</Link><Link href="/programs">Programs</Link><Link href="/portfolio">Portfolio</Link></div><div><strong>Support</strong><Link href="/resources">Resources</Link><Link href="/contact">Contact</Link><Link href="/login">Sign in</Link></div><div><strong>Trust</strong><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link></div></div><div className="container footer-bottom"><span>© 2026 Saarthians · Saarthi Classes</span><span>Built for focused learning.</span></div></footer>
      <WhatsAppFab />
    </main>
  );
}
