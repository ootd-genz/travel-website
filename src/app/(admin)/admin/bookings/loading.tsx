import { Card } from "@/components/ui/card";

export default function BookingLoading() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Memuat pemesanan">
      <div className="grid gap-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
      </div>
      <Card className="h-44 animate-pulse bg-muted/50" />
      <Card className="h-96 animate-pulse bg-muted/50" />
    </div>
  );
}
