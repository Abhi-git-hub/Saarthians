import { z } from "zod";

// AI tutor security policy, enforced server-side on every request.
//
// Rules:
// - Only signed-in users with role "student" may use the tutor. Teachers and
//   admins have their own workspaces; the tutor is a student learning tool.
// - Every data-access function receives the authenticated user id from the
//   session. Client input (conversation ids, message text) is validated but
//   never trusted for authorization: ownership is always re-checked against
//   the session user id in both the application layer and RLS.
// - Context is restricted to the student's own records. Cross-user reads are
//   impossible by construction: no function accepts a foreign user id.
// - Provider credentials (if ever configured) live only in server-side
//   environment variables and are never imported into browser code.

export const chatMessageSchema = z.object({
  conversationId: z.string().uuid().nullable(),
  content: z.string().trim().min(1).max(2000),
});

export const conversationIdSchema = z.string().uuid();

// Maximum student messages per rolling 24 hours. Prevents runaway usage and
// keeps the feature cheap to operate. Enforced by counting persisted rows.
export const MAX_MESSAGES_PER_DAY = 30;

// Maximum stored messages per conversation kept readable in the UI query.
// History beyond this is still stored; only the render window is capped.
export const MESSAGE_WINDOW = 100;

// Hard cap on generated answer length (characters). The engine truncates,
// never silently drops structure.
export const MAX_ANSWER_CHARS = 4000;
