"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  contact: z.string().trim().min(5).max(160),
  message: z.string().trim().min(10).max(2000),
  // Honeypot: real visitors leave it empty; bots fill it.
  website: z.string().max(0).optional(),
});

export async function submitContactMessage(formData: FormData): Promise<{ ok: true } | { error: string }> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    contact: formData.get("contact"),
    message: formData.get("message"),
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return { error: "Please add your name, a way to reach you, and a message of at least 10 characters." };
  }
  if (parsed.data.website) {
    // Bot trap: pretend success so automated submitters move on.
    return { ok: true };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("cf-connecting-ip") ??
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const budget = checkRateLimit(`contact:${ip}`, 3, 60 * 60 * 1000);
  if (!budget.allowed) {
    return { error: "You have sent several messages already. Please try again in an hour, or WhatsApp us directly." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    contact: parsed.data.contact,
    message: parsed.data.message,
  });
  if (error) {
    return { error: "We couldn't send your message. Check your connection and try again, or WhatsApp us directly." };
  }
  return { ok: true };
}
