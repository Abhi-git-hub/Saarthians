import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { WhatsAppFab } from "@/components/whatsapp-fab";

const imageHero = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1800&q=85";
const imageStudy = "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1200&q=85";
const imageTeacher = "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=85";

export default function Home() {
  return (
    <main className="public-site">
      <PublicHeader />

      <section className="public-hero">
        <div className="container public-hero-grid">
          <div className="public-hero-copy">
            <span className="eyebrow">A learning system with direction</span>
            <h1>Study with clarity.<br /><em>Grow with confidence.</em></h1>
            <p>Saarthians brings notes, assessments, progress and intelligent learning support into one calm workspace designed around how students actually learn.</p>
            <div className="hero-actions">
              <Link href="/login" className="public-button public-button-primary">Enter your workspace →</Link>
              <Link href="/programs" className="public-button public-button-secondary">Explore programs</Link>
            </div>
            <div className="hero-proof"><span>01</span><p>Focused study systems for students. Practical visibility for teachers. Built for everyday progress.</p></div>
          </div>
          <div className="hero-visual">
            <img src={imageHero} alt="Students learning together" />
            <div className="hero-float-card"><strong>Learn deeply.</strong><span>Notes · Tests · Progress · AI</span></div>
          </div>
        </div>
      </section>

      <section className="public-marquee" aria-label="Saarthians values">
        <div>LEARN WITH DIRECTION</div><span>•</span><div>BUILD BETTER HABITS</div><span>•</span><div>SEE REAL PROGRESS</div><span>•</span><div>LEARN WITH DIRECTION</div>
      </section>

      <section className="public-section container" id="experience">
        <div className="section-intro">
          <div><span className="eyebrow">The Saarthians experience</span><h2>Everything important,<br /><em>in one place.</em></h2></div>
          <p>A premium learning environment without the clutter. Every surface is designed to make the next useful action obvious.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card feature-card-large"><span>01</span><h3>Notes that stay useful.</h3><p>Write, organize and revisit learning material without losing the thread.</p><div className="feature-image"><img src={imageStudy} alt="Student studying" /></div></article>
          <article className="feature-card"><span>02</span><h3>Tests that show what to fix.</h3><p>Practice, submit and turn results into clear areas for improvement.</p><div className="mini-stat"><strong>78%</strong><span>Concept mastery</span></div></article>
          <article className="feature-card dark-card"><span>03</span><h3>Progress you can understand.</h3><p>See patterns across your learning instead of chasing isolated marks.</p><div className="progress-lines"><i style={{width:"82%"}} /><i style={{width:"64%"}} /><i style={{width:"91%"}} /></div></article>
          <article className="feature-card feature-card-image"><img src={imageTeacher} alt="Teacher helping students" /><div><span>04</span><h3>Better teaching visibility.</h3><p>Teachers get focused tools for students, materials and assessments.</p></div></article>
        </div>
      </section>

      <section className="split-story">
        <div className="container split-story-grid">
          <div><span className="eyebrow light">Built around real learning</span><h2>Technology should disappear.<br /><em>Learning should stay.</em></h2></div>
          <div className="split-story-copy"><p>Private student information is protected by server-side authorization and database rules. The interface stays simple because the complexity belongs in the system, not in the student's head.</p><Link href="/about" className="light-link">Why Saarthians exists →</Link></div>
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

      <section className="public-cta container">
        <div><span className="eyebrow">A calmer way to learn</span><h2>Make the next hour<br /><em>count.</em></h2></div>
        <Link href="/login" className="public-button public-button-primary">Enter Saarthians →</Link>
      </section>

      <footer className="public-footer"><div className="container footer-grid"><div><Link href="/" className="public-brand">saarthians<span>.online</span></Link><p>Learn with direction.</p></div><div><strong>Explore</strong><Link href="/about">About</Link><Link href="/programs">Programs</Link><Link href="/portfolio">Portfolio</Link></div><div><strong>Support</strong><Link href="/resources">Resources</Link><Link href="/contact">Contact</Link><Link href="/login">Sign in</Link></div><div><strong>Trust</strong><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link></div></div><div className="container footer-bottom"><span>© 2026 Saarthians</span><span>Built for focused learning.</span></div></footer>
      <WhatsAppFab />
    </main>
  );
}
