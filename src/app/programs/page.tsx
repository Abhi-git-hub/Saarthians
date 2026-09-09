import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { COURSES, WHATSAPP_DISPLAY, whatsAppLink } from "@/lib/site";

const rhythm = [
  ["Understand", "Concept-first classroom teaching where no doubt is too small."],
  ["Practice", "Notes, assignments and tests inside the student workspace."],
  ["Review", "Teachers analyse mistakes with students, not just mark them."],
  ["Improve", "The next week targets exactly what the last one revealed."],
];

export default function ProgramsPage() {
  return (
    <main className="public-site">
      <PublicHeader />
      <section className="public-section container">
        <Reveal>
          <span className="eyebrow">Programs</span>
          <h1 className="editorial-title">Classes 9–12,<br /><em>all subjects.</em></h1>
          <p className="editorial-lede">Complete school coaching plus NEET and JEE preparation. Message us on WhatsApp at {WHATSAPP_DISPLAY} for batch timings and admission.</p>
        </Reveal>
        <div className="program-rows">
          {COURSES.map((course, i) => (
            <Reveal key={course.tag} delay={Math.min(i, 2) * 70}>
              <article className="program-row">
                <span className="program-index">0{i + 1}</span>
                <div>
                  <span className="course-tag">{course.tag}</span>
                  <h2>{course.title}</h2>
                  <p>{course.body}</p>
                  <dl className="program-meta">
                    <div><dt>Who</dt><dd>{course.audience}</dd></div>
                    <div><dt>How</dt><dd>{course.method}</dd></div>
                  </dl>
                </div>
                <a href={whatsAppLink(`Hi Saarthi Classes, I want admission details for ${course.title} (${course.tag}).`)} target="_blank" rel="noreferrer" className="public-button public-button-primary">Enquire →</a>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="rhythm-band">
        <div className="container">
          <Reveal>
            <span className="eyebrow light">The Saarthi rhythm</span>
            <h2>Understand. Practice. <em>Review. Improve.</em></h2>
          </Reveal>
          <ol className="rhythm-list">
            {rhythm.map(([title, body], i) => (
              <Reveal key={title} delay={i * 80}>
                <li><span>0{i + 1}</span><div><strong>{title}</strong><p>{body}</p></div></li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
      <section className="public-section container">
        <div className="public-cta" style={{ marginBottom: 0 }}>
          <Reveal>
            <div><span className="eyebrow">Have a question?</span><h2>Talk to us<br /><em>directly.</em></h2></div>
          </Reveal>
          <a href={whatsAppLink("Hi Saarthi Classes, I would like to know more about admission.")} target="_blank" rel="noreferrer" className="public-button public-button-primary">WhatsApp us →</a>
        </div>
        <Reveal><div className="center-cta"><Link href="/login" className="text-link-big" style={{ color: "var(--ink)", borderColor: "var(--ember)" }}>Already a member? Enter your workspace →</Link></div></Reveal>
      </section>
      <WhatsAppFab />
    </main>
  );
}
