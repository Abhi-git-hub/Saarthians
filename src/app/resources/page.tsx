import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { MAPS_PLACE_URL, whatsAppLink } from "@/lib/site";
import { ResourcesBrowser, type Resource } from "./resources-browser";

const resources: Resource[] = [
  { category: "Study method", title: "Build a study rhythm.", body: "Choose a small repeatable routine: understand one concept, practice it, review the result and decide the next step.", meta: "Guide", href: "/programs" },
  { category: "Study method", title: "Use marks as signals.", body: "A score is a data point. The valuable question is which concept, skill or habit should change next.", meta: "Guide", href: "/programs" },
  { category: "Study method", title: "Ask better questions.", body: "Use an AI tutor to explain, challenge, compare approaches and generate practice — while keeping human judgement in the loop.", meta: "Guide", href: "/login" },
  { category: "Ask us", title: "Doubt desk on WhatsApp.", body: "Stuck on a problem or confused about admission? Message Saarthi Classes directly and get a human answer.", meta: "Chat now", href: whatsAppLink("Hi Saarthi Classes, I have a question."), external: true },
  { category: "Workspace", title: "Enter your workspace.", body: "Members open notes, attempt tests and track progress in the secure student workspace.", meta: "Sign in", href: "/login" },
  { category: "Trust", title: "Read parent reviews.", body: "Unedited five-star reviews from our Google Maps listing, with owner responses.", meta: "Google Maps", href: MAPS_PLACE_URL, external: true },
];

export default function ResourcesPage() {
  return (
    <main className="public-site">
      <PublicHeader />
      <section className="public-section container">
        <Reveal>
          <span className="eyebrow">Resources</span>
          <h1 className="editorial-title">Useful things<br /><em>for the journey.</em></h1>
          <p className="editorial-lede">Study guides, direct help, and the tools members use every day.</p>
        </Reveal>
        <Reveal delay={100}>
          <ResourcesBrowser resources={resources} />
        </Reveal>
      </section>
      <WhatsAppFab />
    </main>
  );
}
