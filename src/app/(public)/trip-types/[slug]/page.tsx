import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmptyState, PublicImage, SectionHeading, TripCard } from "@/components/common/public-content";
import { getPublicCatalog, getPublicTripType } from "@/lib/public/content";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const item = await getPublicTripType((await params).slug); if (!item) notFound(); return { title: item.seoTitle ?? item.name, description: item.seoDescription ?? item.shortDescription ?? item.description.slice(0, 160) }; }

export default async function TripTypeDetailPage({ params }: Props) {
  const slug = (await params).slug; const [tripType, catalog] = await Promise.all([getPublicTripType(slug), getPublicCatalog()]); if (!tripType) notFound();
  const trips = catalog.trips.filter((trip) => trip.tripTypes.some((item) => item.id === tripType.id));
  return <><section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:px-8 lg:py-20"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Trip Type</p><h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">{tripType.name} — Perjalanan dengan Ritmemu.</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">{tripType.shortDescription ?? tripType.description}</p></div><PublicImage path={tripType.imagePath} alt={`Gaya perjalanan ${tripType.name}`} priority sizes="(max-width: 1024px) 100vw, 45vw" className="aspect-[4/3] rounded-[2rem] border shadow-xl" /></section><section className="border-y bg-muted/25"><div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8"><h2 className="text-3xl font-bold tracking-tight">Seperti apa {tripType.name}?</h2>{tripType.description.split(/\n+/).filter(Boolean).map((paragraph) => <p key={paragraph} className="mt-4 leading-8 text-muted-foreground">{paragraph}</p>)}</div></section><section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><SectionHeading eyebrow="Paket terkait" title={`Paket ${tripType.name} untuk cerita berikutnya`} description="Bandingkan perjalanan aktif dan pilih detail yang paling cocok untukmu." />{trips.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}</div> : <EmptyState title="Belum ada paket aktif untuk trip type ini" description="Jelajahi gaya perjalanan lain atau lihat seluruh paket yang tersedia." href="/trips" action="Lihat Semua Paket" />}</section></>;
}
