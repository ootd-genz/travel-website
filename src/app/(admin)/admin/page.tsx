import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminBookingDashboard } from "@/lib/booking/admin";
import { getCmsDashboardSummary } from "@/lib/cms/queries";

import { BookingTable } from "./bookings/_components/booking-table";

export default async function AdminPage() {
  const [admin, summary, bookings] = await Promise.all([
    requireAdmin(),
    getCmsDashboardSummary(),
    getAdminBookingDashboard(),
  ]);

  return (
    <div className="grid gap-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Ringkasan Hari Ini</h1><p className="mt-1 text-sm text-muted-foreground">Selamat datang, {admin.displayName}. Prioritaskan booking yang menunggu verifikasi, lalu kelola katalog bila diperlukan.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Menunggu Verifikasi", value: bookings.waitingVerification },
          { label: "Dikonfirmasi", value: bookings.confirmed },
          { label: "Pemesanan Bulan Ini", value: bookings.thisMonth },
          { label: "Paket Aktif", value: summary.publishedTrips },
        ].map((item) => <Card key={item.label}><CardHeader className="pb-2"><CardDescription>{item.label}</CardDescription><CardTitle className="text-3xl">{item.value}</CardTitle></CardHeader></Card>)}
      </div>
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="grid gap-1.5">
            <CardTitle>Pemesanan Terbaru</CardTitle>
            <CardDescription>Booking yang sudah dikirim customer, terbaru lebih dulu.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm"><Link href="/admin/bookings">Lihat Semua</Link></Button>
        </CardHeader>
        {bookings.recent.length > 0 ? <BookingTable items={bookings.recent} /> : <CardContent><p className="py-8 text-center text-sm text-muted-foreground">Belum ada pemesanan yang perlu diperiksa.</p></CardContent>}
      </Card>
      <Card><CardHeader><CardTitle>Mulai mengelola konten</CardTitle><CardDescription>Urutan yang disarankan: siapkan destinasi, aktivitas, dan trip type sebelum membuat paket travel.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-3"><Button asChild><Link href="/admin/trips/new">Tambah Paket</Link></Button><Button asChild variant="outline"><Link href="/admin/destinations">Kelola Destinasi</Link></Button><Button asChild variant="outline"><Link href="/admin/home">Atur Halaman Home</Link></Button></CardContent></Card>
    </div>
  );
}
