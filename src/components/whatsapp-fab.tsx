import { whatsAppLink } from "@/lib/site";

export function WhatsAppFab() {
  const href = whatsAppLink("Hi Saarthi Classes, I would like to know more about the learning programs.");

  return (
    <a
      href={href}
      className="whatsapp-fab"
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Saarthi Classes on WhatsApp"
    >
      <span className="whatsapp-icon" aria-hidden="true">✆</span>
      <span>Chat on WhatsApp</span>
    </a>
  );
}
