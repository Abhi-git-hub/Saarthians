import { PublicHeader } from "@/components/public-header";
import { WhatsAppFab } from "@/components/whatsapp-fab";

const projects = [
  ["Saarthians", "Education platform", "A premium public experience connected to secure student, teacher and admin workspaces."],
  ["Adhyayan", "Student management", "A focused learning operations platform for notes, tests, results and role-based access."],
  ["Drona", "AI learning assistant", "A reasoning-oriented chemistry tutor combining grounded context, retrieval and practice."],
];

export default function PortfolioPage() {
  return <main className="public-site"><PublicHeader /><section className="public-section container"><span className="eyebrow">Selected work</span><h1 className="editorial-title">Things built<br /><em>to be useful.</em></h1><div className="portfolio-list">{projects.map(([name,kind,body], i)=><article className="portfolio-row" key={name}><span>0{i+1}</span><div><small>{kind}</small><h2>{name}</h2><p>{body}</p></div><b>↗</b></article>)}</div></section><section className="split-story"><div className="container split-story-grid"><div><span className="eyebrow light">Product engineering</span><h2>Design for the person<br /><em>using the product.</em></h2></div><div className="split-story-copy"><p>The work spans frontend systems, backend services, authentication, authorization, AI integration and production deployment — with the user experience treated as part of the engineering problem.</p></div></div></section><WhatsAppFab /></main>;
}
