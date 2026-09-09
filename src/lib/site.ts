// Public business identity for Saarthi Classes (Saarthians).
// These are published contact facts, intentionally committed — not secrets.

export const SITE_NAME = "Saarthians";
export const BRAND_DOMAIN = "saarthians.online";
export const CONTACT_EMAIL = "hello@saarthians.online";

export const FOUNDER_NAME = "Abhi Yadav";
export const FOUNDER_TITLE = "Founder, Saarthi Classes";
export const FOUNDER_QUOTE =
  "Never doubt the best-selling author — God. He has written your book beautifully.";

// WhatsApp in international digits-only format. The NEXT_PUBLIC_ variable wins
// when set (baked at build time); the constant below is the published official
// number and acts as the fallback so contact surfaces never break.
export const WHATSAPP_NUMBER_FALLBACK = "919311230129";
export const WHATSAPP_DISPLAY = "+91 93112 30129";

export function whatsAppNumber() {
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  return fromEnv || WHATSAPP_NUMBER_FALLBACK;
}

export function whatsAppLink(message: string) {
  return `https://wa.me/${whatsAppNumber()}?text=${encodeURIComponent(message)}`;
}

export const ADDRESS_LINES = [
  "267, Gali No. 16, Balbir Nagar Extension",
  "Shahdara, Delhi, 110032",
];

export const MAPS_PLACE_URL =
  "https://www.google.com/maps/place/Saarthi+Classes/@28.6874233,77.2849984,17z/data=!4m8!3m7!1s0x390cfb46ebccb6a5:0x4226d376cd43e772!8m2!3d28.6874233!4d77.2875733!9m1!1b1!16s%2Fg%2F11nq3lqyg6?entry=ttu";

export const MAPS_EMBED_URL =
  "https://www.google.com/maps?q=Saarthi%20Classes%2C%20267%20Gali%20No.%2016%20Balbir%20Nagar%20Extension%2C%20Shahdara%2C%20Delhi%20110032&output=embed";

export type Course = { tag: string; title: string; body: string };

export const COURSES: Course[] = [
  {
    tag: "CLASS 9 · ALL SUBJECTS",
    title: "Strong foundations early",
    body: "Complete Class 9 coverage across all subjects with concept-first teaching that prepares students for board and competitive thinking.",
  },
  {
    tag: "CLASS 10 · ALL SUBJECTS",
    title: "Board year, done right",
    body: "All-subject Class 10 coaching with structured practice, regular assessment, and revision planned around board success.",
  },
  {
    tag: "CLASS 11 · SCIENCE + JEE / NEET",
    title: "The competitive launchpad",
    body: "Physics, Chemistry, Maths and Biology aligned to Class 11 with JEE and NEET orientation built in from day one.",
  },
  {
    tag: "CLASS 12 · SCIENCE + JEE / NEET",
    title: "Rank-focused finishing",
    body: "Class 12 boards plus intensive JEE and NEET preparation — problem solving, test temperament, and rank-oriented mentoring.",
  },
  {
    tag: "NEET COACHING",
    title: "Medical entrance, mentored",
    body: "Biology-first NEET preparation with NCERT mastery, assertion-reason practice, and regular mock analysis.",
  },
  {
    tag: "JEE COACHING",
    title: "Engineering entrance, engineered",
    body: "Physics, Chemistry and Maths drilled the JEE way — from Mains-level speed to Advanced-level depth.",
  },
];

// Local brand assets. The image files are provided by the founder and live in
// public/images/. SafeImage hides itself gracefully if a file is missing, so
// pages never render broken-image icons.
export const BRAND_IMAGES = {
  logo: "/images/saarthi-logo.png",
  signature: "/images/founder-signature.jpg",
  classroom: "/images/classroom.jpg",
};

export type Review = {
  name: string;
  meta: string;
  stars: number;
  text: string;
  ownerResponse?: string;
};

// Verbatim excerpts from the Saarthi Classes Google Maps listing (truncation
// marked with …). Never invent reviewer names, stars, or words.
export const REVIEWS: Review[] = [
  {
    name: "Pragya Sharma",
    meta: "Google review · 2 months ago",
    stars: 5,
    text: "Sarthi Classes provides an excellent learning experience. Abhi Sir is an outstanding teacher with remarkable concept clarity and a unique way of explaining topics that makes even difficult concepts easy to understand…",
  },
  {
    name: "Google review",
    meta: "5 stars · 2 months ago",
    stars: 5,
    text: "Sarthi Classes is one of the best coaching institutes I have come across…",
    ownerResponse: "Response from the owner: Thanks for the descriptive review!",
  },
];
