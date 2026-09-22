import { LoadingState } from "@/components/ui";

export default function AdminLoading() {
  return (
    <main className="container" style={{ padding: "48px 0 80px" }}>
      <LoadingState label="Loading operations…" lines={5} />
    </main>
  );
}
