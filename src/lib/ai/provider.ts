import type { ProviderResult, TutorContext, TutorIntent } from "./types";

// Provider seam for a future external model.
//
// Today this module always reports "not configured": there is no AI provider
// key in the environment and none is required, because the local deterministic
// engine answers from the student's own records. When the product is ready to
// use a hosted model, implement `generateWithProvider` against the provider's
// server-side API (key from a server-only env var, never the browser) and flip
// `isProviderConfigured`. The pipeline in actions.ts already routes through
// `resolveTutorAnswer`, so no UI or authorization code has to change.
//
// Deliberately, the UI never claims a hosted model is answering today.
export function isProviderConfigured(): boolean {
  return Boolean(process.env.AI_PROVIDER_URL && process.env.AI_PROVIDER_API_KEY);
}

export async function generateWithProvider(
  _intent: TutorIntent,
  _context: TutorContext,
): Promise<ProviderResult> {
  throw new Error("AI_PROVIDER_NOT_CONFIGURED");
}
