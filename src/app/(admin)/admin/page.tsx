import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getCmsDashboardSummary } from "@/lib/cms/queries";

export default async function AdminPage() {
  const [admin, summary] = await Promise.all([requireAdmin(), getCmsDashboardSummary()]);

  return (
    <div className="grid gap-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Ringkasan Hari Ini</h1><p className="mt-1 text-sm text-muted-foreground">Selamat datang, {admin.displayName}. Kelola katalog dan konten publik dari satu tempat.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{ label: "Total Paket", value: summary.trips }, { label: "Paket Published", value: summary.publishedTrips }, { label: "Destinasi", value: summary.destinations }, { label: "Artikel Blog", value: summary.posts }].map((item) => <Card key={item.label}><CardHeader className="pb-2"><CardDescription>{item.label}</CardDescription><CardTitle className="text-3xl">{item.value}</CardTitle></CardHeader></Card>)}
      </div>
      <Card><CardHeader><CardTitle>Mulai mengelola konten</CardTitle><CardDescription>Urutan yang disarankan: siapkan destinasi, aktivitas, dan trip type sebelum membuat paket travel.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-3"><Button asChild><Link href="/admin/trips/new">Tambah Paket</Link></Button><Button asChild variant="outline"><Link href="/admin/destinations">Kelola Destinasi</Link></Button><Button asChild variant="outline"><Link href="/admin/home">Atur Halaman Home</Link></Button></CardContent></Card>
      <Card><CardHeader><CardTitle>Pemesanan</CardTitle><CardDescription>Management booking, bukti transfer, dan counter Menunggu Verifikasi dikerjakan pada Phase 8 sesuai roadmap.</CardDescription></CardHeader></Card>
    </div>
  );
}
