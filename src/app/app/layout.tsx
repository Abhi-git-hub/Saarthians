import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { StudentNav } from "./student-nav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireRole(["student"]);
  return <><StudentNav user={user} />{children}</>;
}
