import { requireRole } from "@/lib/auth";
import { StudentNav } from "./student-nav";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireRole(["student"]);

  return (
    <>
      <StudentNav />
      {children}
    </>
  );
}
