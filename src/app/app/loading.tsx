import { LoadingState } from "@/components/ui";

export default function StudentLoading() {
  return (
    <main className="workspace-page">
      <div className="container">
        <LoadingState label="Opening your workspace…" lines={4} />
      </div>
    </main>
  );
}
