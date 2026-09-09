import { WorkspaceNav } from "@/components/workspace-nav";
import type { AuthenticatedUser } from "@/lib/auth";

export async function StudentNav({ user }: { user: AuthenticatedUser }) {
  return <WorkspaceNav role="student" displayName={user.displayName} username={user.username} />;
}
