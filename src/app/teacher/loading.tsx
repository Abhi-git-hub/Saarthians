import { LoadingState } from "@/components/ui";

export default function TeacherLoading() {
  return (
    <main className="workspace-page">
      <div className="container">
        <LoadingState label="Opening your command center…" lines={4} />
      </div>
    </main>
  );
}
