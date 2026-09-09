import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { WhatsAppFab } from "@/components/whatsapp-fab";

const programs = [
  ["FOUNDATION", "Build the base", "A focused path for strengthening concepts, study habits and confidence."],
  ["PRACTICE", "Turn knowledge into skill", "Structured practice and assessments designed to reveal exactly what needs attention."],
  ["GUIDANCE", "Know what to do next", "A learning system that combines progress signals with context-aware support."],
];

export default function ProgramsPage() {
  return <main className="public-site"><PublicHeader /><section className="public-section container"><span className="eyebrow">Programs</span><h1 className="editorial-title">Learning paths<br /><em>with purpose.</em></h1><p className="editorial-lede">Programs are designed to reduce random studying and replace it with a repeatable rhythm: understand, practice, review, improve.</p><div className="path-grid">{programs.map(([tag,title,body])=><article className="path-card" key={tag}><span>{tag}</span><strong>{title}</strong><p>{body}</p></article>)}</div></section><section className="split-story"><div className="container split-story-grid"><div><span className="eyebrow light">Inside the workspace</span><h2>Notes.<br />Tests.<br /><em>Progress.</em></h2></div><div className="split-story-copy"><p>Members can move from a learning note into practice, submit assessments through a server-authoritative flow and return to progress insights without leaving the system.</p><Link href="/login" className="light-link">Enter the workspace →</Link></div></div></section><section className="public-section container"><div className="public-cta" style={{marginBottom:0}}><div><span className="eyebrow">Have a question?</span><h2>Talk to us<br /><em>directly.</em></h2></div><Link href="/contact" className="public-button public-button-primary">Contact Saarthians →</Link></div></section><WhatsAppFab /></main>;
}
