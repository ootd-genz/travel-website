import type { Metadata } from "next";

import { DestinationCard, EmptyState, PageHero } from "@/components/common/public-content";
import { getPublicCatalog } from "@/lib/public/content";

export const metadata: Metadata = { title: "Destinasi Pilihan", description: "Jelajahi destinasi pilihan, aktivitas, waktu terbaik, dan paket perjalanan yang tersedia." };

export default async function DestinationPage() {
  const { destinations } = await getPublicCatalog();
  return <><PageHero eyebrow="Destination" title="Dunia Luas. Pilih Tempat yang Ingin Kamu Kenang." description="Jelajahi destinasi pilihan dan temukan paket, aktivitas, serta waktu terbaik untuk menikmati setiap tempat." /><section aria-labelledby="destination-list-heading" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"><div className="mb-8 max-w-2xl"><p className="text-sm font-medium text-primary">Tempat untuk dijelajahi</p><h2 id="destination-list-heading" className="mt-2 text-3xl font-bold tracking-tight">Mulai dari tempat yang memanggilmu</h2></div>{destinations.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{destinations.map((destination) => <DestinationCard key={destination.id} destination={destination} />)}</div> : <EmptyState title="Destinasi belum tersedia" description="Destinasi published sedang disiapkan. Kembali lagi setelah admin menayangkan pilihan terbaru." href="/" action="Kembali ke Home" />}</section></>;
}
