import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return <div className="grid animate-pulse gap-6" aria-label="Memuat data admin"><div className="h-8 w-56 rounded bg-muted" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Card key={index}><CardHeader><div className="h-4 w-24 rounded bg-muted" /></CardHeader><CardContent><div className="h-9 w-16 rounded bg-muted" /></CardContent></Card>)}</div><Card><CardContent className="h-72 p-6"><div className="h-full rounded bg-muted" /></CardContent></Card></div>;
}
