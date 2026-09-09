import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import {
  ADDRESS_LINES,
  CONTACT_EMAIL,
  MAPS_EMBED_URL,
  MAPS_PLACE_URL,
  WHATSAPP_DISPLAY,
  whatsAppLink,
} from "@/lib/site";

export default function ContactPage() {
  return <main className="public-site"><PublicHeader /><section className="public-section container"><span className="eyebrow">Contact</span><h1 className="editorial-title">Let’s talk about<br /><em>learning.</em></h1><div className="contact-grid"><div className="contact-panel"><h2>Students & parents</h2><p>Questions about programs, learning support or getting started? Reach out and we’ll help with the next step.</p><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><p style={{ marginTop: 12 }}><a href={whatsAppLink("Hi Saarthi Classes!") } target="_blank" rel="noreferrer">WhatsApp {WHATSAPP_DISPLAY}</a></p></div><div className="contact-panel contact-panel-accent"><h2>Visit the centre</h2><p>{ADDRESS_LINES[0]},<br />{ADDRESS_LINES[1]}</p><a href={MAPS_PLACE_URL} target="_blank" rel="noreferrer">Open in Google Maps →</a></div></div></section><section className="public-section container" style={{ paddingTop: 0 }}><div className="map-frame"><iframe title="Saarthi Classes on Google Maps" src={MAPS_EMBED_URL} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div></section><section className="public-section container" style={{ paddingTop: 0 }}><div className="public-cta" style={{ marginBottom: 0 }}><div><span className="eyebrow">Before you go</span><h2>Keep learning<br /><em>with direction.</em></h2></div><Link href="/programs" className="public-button public-button-primary">Explore programs →</Link></div></section><WhatsAppFab /></main>;
}
