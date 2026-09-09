import { PublicHeader } from "@/components/public-header";
import { WhatsAppFab } from "@/components/whatsapp-fab";

export default function ResourcesPage() {
  return <main className="public-site"><PublicHeader /><section className="public-section container"><span className="eyebrow">Resources</span><h1 className="editorial-title">Useful things<br /><em>for the journey.</em></h1><div className="resource-grid"><article className="feature-card"><span>START HERE</span><h3>Build a study rhythm.</h3><p>Choose a small repeatable routine: understand one concept, practice it, review the result and decide the next step.</p></article><article className="feature-card"><span>ASSESSMENT</span><h3>Use marks as signals.</h3><p>A score is a data point. The valuable question is which concept, skill or habit should change next.</p></article><article className="feature-card"><span>AI LEARNING</span><h3>Ask better questions.</h3><p>Use an AI tutor to explain, challenge, compare approaches and generate practice — while keeping human judgement in the loop.</p></article></div></section><WhatsAppFab /></main>;
}
