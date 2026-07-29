import type { Metadata } from "next";

import { EmptyState, PageHero, TripTypeCard } from "@/components/common/public-content";
import { getPublicCatalog } from "@/lib/public/content";

export const metadata: Metadata = { title: "Trip Types", description: "Pilih gaya perjalanan yang paling cocok untukmu, dari petualangan hingga liburan santai." };

export default async function TripTypesPage() {
  const { tripTypes } = await getPublicCatalog();
  return <><PageHero eyebrow="Trip Types" title="Setiap Traveler Punya Cara Menikmati Perjalanan." description="Pilih perjalanan yang sesuai ritmemu—aktif, santai, romantis, keluarga, budaya, atau penuh petualangan." /><section aria-labelledby="trip-types-list-heading" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"><div className="mb-8 max-w-2xl"><p className="text-sm font-medium text-primary">Gaya perjalanan</p><h2 id="trip-types-list-heading" className="mt-2 text-3xl font-bold tracking-tight">Temukan perjalanan yang terasa seperti kamu</h2></div>{tripTypes.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{tripTypes.map((tripType) => <TripTypeCard key={tripType.id} tripType={tripType} />)}</div> : <EmptyState title="Trip type belum tersedia" description="Kategori perjalanan aktif sedang disiapkan. Kamu dapat mulai dengan menjelajahi destinasi." />}</section></>;
}
