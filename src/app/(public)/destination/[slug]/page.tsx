import type { Metadata } from "next";
import { CalendarRange, CheckCircle2, MapPin } from "lucide-react";
import { notFound } from "next/navigation";

import { EmptyState, PublicImage, SectionHeading, TripCard } from "@/components/common/public-content";
import { Badge } from "@/components/ui/badge";
import { getPublicActivities, getPublicDestination, getPublicTrips, publicMediaUrl } from "@/lib/public/content";
import { createPublicMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const item = await getPublicDestination((await params).slug); if (!item) notFound(); return createPublicMetadata({ title: item.seoTitle ?? item.name, description: item.seoDescription ?? item.shortDescription, path: `/destination/${item.slug}`, image: publicMediaUrl(item.imagePath) }); }

export default async function DestinationDetailPage({ params }: Props) {
  const slug = (await params).slug;
  const [destination, allTrips, allActivities] = await Promise.all([getPublicDestination(slug), getPublicTrips(), getPublicActivities()]);
  if (!destination) notFound();
  const trips = allTrips.filter((trip) => trip.destinations.some((item) => item.id === destination.id));
  const activityIds = new Set(trips.flatMap((trip) => trip.activities.map((item) => item.id)));
  const activities = allActivities.filter((item) => activityIds.has(item.id));
  const location = [destination.city, destination.region, destination.country].filter(Boolean).join(", ");
  return <><section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:px-8 lg:py-20"><div><p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary"><MapPin className="size-4" aria-hidden="true" />Destination</p><h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">{destination.name} — Tempat untuk Cerita Berikutnya.</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">{destination.shortDescription}</p><div className="mt-6 flex flex-wrap gap-2"><Badge variant="secondary">{location}</Badge>{destination.bestTimeToVisit ? <Badge variant="outline" className="gap-1.5"><CalendarRange className="size-3.5" aria-hidden="true" />{destination.bestTimeToVisit}</Badge> : null}</div></div><PublicImage path={destination.imagePath} alt={`Pemandangan ${destination.name}`} priority sizes="(max-width: 1024px) 100vw, 45vw" className="aspect-[4/3] rounded-[2rem] border shadow-xl" /></section><section className="border-y bg-muted/25"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.7fr] lg:px-8"><div><h2 className="text-3xl font-bold tracking-tight">Kenali {destination.name}</h2>{destination.description.split(/\n+/).filter(Boolean).map((paragraph) => <p key={paragraph} className="mt-4 leading-8 text-muted-foreground">{paragraph}</p>)}</div><div><h2 className="text-xl font-semibold">Yang menarik di sini</h2>{destination.highlights.length ? <ul className="mt-4 grid gap-3">{destination.highlights.map((item) => <li key={item} className="flex gap-3 rounded-xl border bg-background p-4 text-sm"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><span>{item}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Highlight destinasi akan segera dilengkapi.</p>}{activities.length ? <div className="mt-7"><h3 className="font-semibold">Aktivitas terkait</h3><div className="mt-3 flex flex-wrap gap-2">{activities.map((item) => <Badge key={item.id} variant="secondary">{item.name}</Badge>)}</div></div> : null}</div></div></section><section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><SectionHeading eyebrow="Paket terkait" title={`Jelajahi ${destination.name} lebih dekat`} description="Pilih itinerary yang sesuai dengan waktu dan gaya perjalananmu." />{trips.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}</div> : <EmptyState title="Belum ada paket aktif di destinasi ini" description="Jelajahi destinasi lain yang tidak kalah menarik." />}</section></>;
}
