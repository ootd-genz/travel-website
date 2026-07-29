import type { Metadata } from "next";
import { Gauge, Timer } from "lucide-react";
import { notFound } from "next/navigation";

import { EmptyState, PublicImage, SectionHeading, TripCard } from "@/components/common/public-content";
import { Badge } from "@/components/ui/badge";
import { getPublicActivity, getPublicDestinations, getPublicTrips, publicMediaUrl } from "@/lib/public/content";
import { createPublicMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const item = await getPublicActivity((await params).slug); if (!item) notFound(); return createPublicMetadata({ title: item.seoTitle ?? item.name, description: item.seoDescription ?? item.shortDescription, path: `/activities/${item.slug}`, image: publicMediaUrl(item.imagePath) }); }

export default async function ActivityDetailPage({ params }: Props) {
  const slug = (await params).slug; const [activity, allTrips, allDestinations] = await Promise.all([getPublicActivity(slug), getPublicTrips(), getPublicDestinations()]); if (!activity) notFound();
  const trips = allTrips.filter((trip) => trip.activities.some((item) => item.id === activity.id));
  const destinations = allDestinations.filter((destination) => trips.some((trip) => trip.destinations.some((item) => item.id === destination.id)));
  return <><section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:px-8 lg:py-20"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Activity</p><h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">{activity.name} — Lebih dari Sekadar Datang.</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">{activity.shortDescription}</p><div className="mt-6 flex flex-wrap gap-2">{activity.difficulty ? <Badge variant="secondary" className="gap-1.5"><Gauge className="size-3.5" aria-hidden="true" />{activity.difficulty}</Badge> : null}{activity.durationText ? <Badge variant="outline" className="gap-1.5"><Timer className="size-3.5" aria-hidden="true" />{activity.durationText}</Badge> : null}</div></div><PublicImage path={activity.imagePath} alt={`Pengalaman ${activity.name}`} priority sizes="(max-width: 1024px) 100vw, 45vw" className="aspect-[4/3] rounded-[2rem] border shadow-xl" /></section><section className="border-y bg-muted/25"><div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8"><h2 className="text-3xl font-bold tracking-tight">Tentang pengalaman ini</h2>{activity.description.split(/\n+/).filter(Boolean).map((paragraph) => <p key={paragraph} className="mt-4 leading-8 text-muted-foreground">{paragraph}</p>)}{destinations.length ? <div className="mt-8"><h3 className="font-semibold">Bisa kamu temukan di</h3><div className="mt-3 flex flex-wrap gap-2">{destinations.map((item) => <Badge key={item.id} variant="secondary">{item.name}</Badge>)}</div></div> : null}</div></section><section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><SectionHeading eyebrow="Paket terkait" title={`Temukan Paket dengan ${activity.name}`} description="Lihat perjalanan aktif yang sudah memasukkan pengalaman ini ke dalam itinerary." />{trips.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}</div> : <EmptyState title="Aktivitas ini belum punya paket aktif" description="Jelajahi aktivitas lain yang tidak kalah seru." href="/activities" action="Lihat Aktivitas Lain" />}</section></>;
}
