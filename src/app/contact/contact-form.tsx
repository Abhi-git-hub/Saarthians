"use client";

import { useState, useTransition } from "react";
import { submitContactMessage } from "./actions";

export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitContactMessage(formData);
      if ("error" in result) setError(result.error);
      else setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="contact-panel contact-panel-accent" role="status">
        <h2>Message received.</h2>
        <p>We read every enquiry personally and reply within a day — usually much faster on WhatsApp.</p>
      </div>
    );
  }

  return (
    <form action={submit} className="contact-panel" aria-label="Contact form">
      <h2>Write to us</h2>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>Admissions, batches, fees, visits — anything.</p>
      <label className="upload-field">
        Your name
        <input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="e.g. Rohan's father" />
      </label>
      <label className="upload-field">
        Phone or email (so we can reply)
        <input name="contact" required minLength={5} maxLength={160} autoComplete="tel" placeholder="e.g. 98XXX XXXXX" />
      </label>
      <label className="upload-field">
        Message
        <textarea name="message" required minLength={10} maxLength={2000} rows={4} placeholder="Which class, which subjects, what would you like to know?" />
      </label>
      {/* Honeypot: hidden from humans, irresistible to bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }} />
      {error && <p role="alert" className="form-error">{error}</p>}
      <div>
        <button type="submit" disabled={pending} className="public-button public-button-primary">
          {pending ? "Sending…" : "Send message →"}
        </button>
      </div>
    </form>
  );
}
