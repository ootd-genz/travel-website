import type { Metadata } from "next";

import { ActivityCard, EmptyState, PageHero } from "@/components/common/public-content";
import { getPublicActivities } from "@/lib/public/content";
import { createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  title: "Aktivitas Perjalanan",
  description:
    "Temukan aktivitas seru dan paket perjalanan yang menghadirkan pengalaman tersebut.",
  path: "/activities",
});

export default async function ActivitiesPage() {
  const activities = await getPublicActivities();
  return <><PageHero eyebrow="Activities" title="Jangan Cuma Datang. Rasakan Destinasinya." description="Temukan aktivitas yang membuat perjalananmu lebih hidup—dari petualangan penuh adrenalin sampai pengalaman santai yang sulit dilupakan." /><section aria-labelledby="activities-list-heading" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"><div className="mb-8 max-w-2xl"><p className="text-sm font-medium text-primary">Pengalaman pilihan</p><h2 id="activities-list-heading" className="mt-2 text-3xl font-bold tracking-tight">Pilih pengalaman yang ingin kamu bawa pulang</h2></div>{activities.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{activities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}</div> : <EmptyState title="Aktivitas belum tersedia" description="Aktivitas aktif sedang disiapkan. Jelajahi destinasi pilihan yang sudah tersedia." />}</section></>;
}
