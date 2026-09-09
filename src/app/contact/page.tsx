import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { WhatsAppFab } from "@/components/whatsapp-fab";

export default function ContactPage() {
  return <main className="public-site"><PublicHeader /><section className="public-section container"><span className="eyebrow">Contact</span><h1 className="editorial-title">Let’s talk about<br /><em>learning.</em></h1><div className="contact-grid"><div className="contact-panel"><h2>Students & parents</h2><p>Questions about programs, learning support or getting started? Reach out and we’ll help with the next step.</p><a href="mailto:hello@saarthians.online">hello@saarthians.online</a></div><div className="contact-panel contact-panel-accent"><h2>WhatsApp</h2><p>Prefer a quick conversation? Use the WhatsApp button and send us a message directly.</p><Link href="/login" className="public-button public-button-primary">Member login →</Link></div></div></section><section className="public-section container" style={{paddingTop:0}}><div className="public-cta" style={{marginBottom:0}}><div><span className="eyebrow">Before you go</span><h2>Keep learning<br /><em>with direction.</em></h2></div><Link href="/programs" className="public-button public-button-primary">Explore programs →</Link></div></section><WhatsAppFab /></main>;
}
