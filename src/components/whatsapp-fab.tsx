export function WhatsAppFab() {
  const message = encodeURIComponent("Hi Saarthians, I would like to know more about the learning programs.");
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const href = number
    ? `https://wa.me/${number}?text=${message}`
    : `https://wa.me/?text=${message}`;

  return (
    <a
      href={href}
      className="whatsapp-fab"
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Saarthians on WhatsApp"
    >
      <span className="whatsapp-icon" aria-hidden="true">✆</span>
      <span>Chat on WhatsApp</span>
    </a>
  );
}
