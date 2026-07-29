import type { Metadata } from "next";
import { Search } from "lucide-react";

import { EmptyState, PageHero, TripCard } from "@/components/common/public-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPublicCatalog } from "@/lib/public/content";

export const metadata: Metadata = { title: "Paket Perjalanan", description: "Bandingkan paket perjalanan published berdasarkan destinasi, aktivitas, durasi, dan harga." };

export default async function TripsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim().slice(0, 100) ?? "";
  const { trips } = await getPublicCatalog();
  const normalized = query.toLocaleLowerCase("id-ID");
  const filtered = normalized ? trips.filter((trip) => [trip.name, trip.shortDescription, ...trip.destinations.map((item) => item.name), ...trip.activities.map((item) => item.name), ...trip.tripTypes.map((item) => item.name)].some((value) => value.toLocaleLowerCase("id-ID").includes(normalized))) : trips;
  return <><PageHero eyebrow="Paket travel" title="Pilih Paketnya. Siapkan Ceritanya." description="Bandingkan itinerary, durasi, pengalaman, dan harga dengan jelas sebelum kamu memesan."><form role="search" className="flex max-w-xl flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Label htmlFor="trip-search" className="sr-only">Cari paket</Label><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input id="trip-search" name="q" defaultValue={query} placeholder="Cari paket, destinasi, atau aktivitas..." className="h-11 bg-background pl-9" /></div><Button type="submit" size="lg">Cari Paket</Button></form></PageHero><section aria-labelledby="trips-list-heading" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"><div className="mb-8"><p className="text-sm font-medium text-primary">{query ? `Hasil pencarian “${query}”` : "Seluruh paket"}</p><h2 id="trips-list-heading" className="mt-2 text-3xl font-bold tracking-tight">Perjalanan yang siap dipilih</h2></div>{filtered.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filtered.map((trip) => <TripCard key={trip.id} trip={trip} />)}</div> : <EmptyState title="Belum ada paket yang cocok" description="Coba kata kunci lain atau jelajahi destinasi untuk menemukan inspirasi baru." />}</section></>;
}
