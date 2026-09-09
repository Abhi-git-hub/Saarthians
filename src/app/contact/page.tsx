import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Reveal } from "@/components/reveal";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import {
  ADDRESS_LINES,
  CONTACT_EMAIL,
  MAPS_EMBED_URL,
  MAPS_PLACE_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_NUMBER_FALLBACK,
  whatsAppLink,
} from "@/lib/site";

export default function ContactPage() {
  return (
    <main className="public-site">
      <PublicHeader />
      <section className="public-section container">
        <Reveal>
          <span className="eyebrow">Contact</span>
          <h1 className="editorial-title">Let’s talk about<br /><em>learning.</em></h1>
        </Reveal>
        <div className="contact-grid">
          <Reveal delay={60}>
            <div className="contact-panel contact-panel-accent">
              <h2>Fastest: WhatsApp</h2>
              <p>Admissions, batches, fees, doubts about joining — ask anything.</p>
              <p className="contact-bignum"><a href={whatsAppLink("Hi Saarthi Classes!")} target="_blank" rel="noreferrer">{WHATSAPP_DISPLAY}</a></p>
              <a href={whatsAppLink("Hi Saarthi Classes!")} target="_blank" rel="noreferrer" className="public-button public-button-primary">Start chatting →</a>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="contact-panel">
              <h2>Email & visit</h2>
              <p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
              <p>{ADDRESS_LINES[0]},<br />{ADDRESS_LINES[1]}</p>
              <a href={`tel:+${WHATSAPP_NUMBER_FALLBACK}`}>Call {WHATSAPP_DISPLAY}</a>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="public-section container" style={{ paddingTop: 0 }}>
        <Reveal>
          <div className="location-card lift">
            <div>
              <span className="eyebrow">Find us</span>
              <h2>In the heart of <em>Shahdara.</em></h2>
              <p>{ADDRESS_LINES.join(", ")}. Landmarks and lanes are easier on the live map.</p>
              <div className="hero-actions">
                <a href={MAPS_PLACE_URL} target="_blank" rel="noreferrer" className="public-button public-button-secondary">Open in Google Maps →</a>
              </div>
            </div>
            <div className="location-map">
              <iframe title="Saarthi Classes on Google Maps" src={MAPS_EMBED_URL} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            </div>
          </div>
        </Reveal>
      </section>
      <section className="public-section container" style={{ paddingTop: 0 }}>
        <div className="public-cta" style={{ marginBottom: 0 }}>
          <Reveal>
            <div><span className="eyebrow">Before you go</span><h2>Keep learning<br /><em>with direction.</em></h2></div>
          </Reveal>
          <Link href="/programs" className="public-button public-button-primary">Explore programs →</Link>
        </div>
      </section>
      <WhatsAppFab />
    </main>
  );
}
