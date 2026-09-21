import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { WorkspaceNav } from "@/components/workspace-nav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole(["admin"]);
  return <><WorkspaceNav role="admin" displayName={user.displayName} username={user.username} />{children}</>;
}
