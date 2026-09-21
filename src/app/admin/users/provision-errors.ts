// Safe mapping of provision-user Edge Function invocation failures.
//
// Deliberately NOT in actions.ts: "use server" modules may only export async
// functions, so this pure helper module stays build-safe and unit-testable.
//
// Safety contract (never violated here):
// - Only HTTP status codes and short, curated `error` strings from OUR OWN
//   function response bodies are ever surfaced.
// - Bodies are length-capped and screened for URLs, tokens, secrets, and
//   passwords before display; anything suspicious falls back to generic text.
// - Request headers, tokens, SQL, and stack traces are never read or returned.
export function asSafeProvisionMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text.length < 1 || text.length > 300) return null;
  if (
    /https?:\/\/|Bearer\s|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|service[_-]?role|secret|password\s*[:=]/i.test(
      text,
    )
  ) {
    return null;
  }
  return text;
}

type InvokeErrorShape = {
  context?: unknown;
} | null
  | undefined;

function contextStatus(context: unknown): number | null {
  if (typeof context === "object" && context !== null && "status" in context) {
    const status = (context as { status: unknown }).status;
    return typeof status === "number" ? status : null;
  }
  return null;
}

async function readFunctionBody(context: unknown): Promise<{ error?: unknown } | null> {
  try {
    if (typeof Response !== "undefined" && context instanceof Response) {
      const text = await context.text();
      if (!text) return null;
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null) return parsed as { error?: unknown };
      return null;
    }
    // Defensive: some transports surface an already-parsed body on the error.
    if (typeof context === "object" && context !== null && "error" in context) {
      return { error: (context as { error: unknown }).error };
    }
    return null;
  } catch {
    return null;
  }
}

// Returns a displayable message, or null when nothing safe could be
// determined (caller falls back to the generic mapped error).
export async function mapProvisionInvokeError(error: unknown): Promise<string | null> {
  if (!error || typeof error !== "object") return null;
  const context = (error as InvokeErrorShape)?.context;

  // Prefer the function's own curated message (validation, duplicates,
  // auth-required, rollback notices) — it is written by our code for display.
  const body = await readFunctionBody(context);
  if (body) {
    const safe = asSafeProvisionMessage(body.error);
    if (safe) return safe;
  }

  switch (contextStatus(context)) {
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You are not authorized to perform this action.";
    case 404:
      return "The account service is not deployed. Ask the system owner to deploy the provision-user function.";
    default:
      return null;
  }
}
