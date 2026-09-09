import { requireRole } from "@/lib/auth";
import { WorkspaceNav } from "@/components/workspace-nav";

export default async function TeacherLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole(["teacher", "admin"]);
  return <><WorkspaceNav role="teacher" displayName={user.displayName} username={user.username} />{children}</>;
}
