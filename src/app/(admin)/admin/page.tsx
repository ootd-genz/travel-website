import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  FileText,
  MapPinned,
  PackageCheck,
  PackagePlus,
  PlaneTakeoff,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminBookingDashboard } from "@/lib/booking/admin";
import { getCmsDashboardSummary } from "@/lib/cms/queries";

import { BookingTable } from "./bookings/_components/booking-table";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const quickActions = [
  {
    href: "/admin/trips/new",
    label: "Buat paket travel",
    description: "Tambahkan paket dan susun itinerary baru.",
    icon: PackagePlus,
  },
  {
    href: "/admin/promotions",
    label: "Kelola promo",
    description: "Atur penawaran yang tampil di website.",
    icon: Sparkles,
  },
  {
    href: "/admin/home",
    label: "Perbarui halaman home",
    description: "Sesuaikan hero, CTA, dan konten utama.",
    icon: PlaneTakeoff,
  },
] as const;

export default async function AdminPage() {
  const [admin, summary, bookings] = await Promise.all([
    requireAdmin(),
    getCmsDashboardSummary(),
    getAdminBookingDashboard(),
  ]);
  const unpublishedTrips = Math.max(summary.trips - summary.publishedTrips, 0);
  const todayLabel = dateFormatter.format(new Date());
  const stats = [
    {
      label: "Menunggu Verifikasi",
      value: bookings.waitingVerification,
      description: "booking menunggu pemeriksaan",
      icon: CircleAlert,
      iconClassName:
        "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
    },
    {
      label: "Sudah dikonfirmasi",
      value: bookings.confirmed,
      description: "booking aktif terkonfirmasi",
      icon: CheckCircle2,
      iconClassName:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
    },
    {
      label: "Masuk bulan ini",
      value: bookings.thisMonth,
      description: "booking terkirim bulan ini",
      icon: CalendarDays,
      iconClassName:
        "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300",
    },
    {
      label: "Paket tayang",
      value: summary.publishedTrips,
      description:
        unpublishedTrips > 0
          ? `${unpublishedTrips} paket belum ditayangkan`
          : "semua paket sudah ditayangkan",
      icon: PackageCheck,
      iconClassName: "bg-primary/10 text-primary",
    },
  ] as const;

  return (
    <div className="grid gap-6 sm:gap-8">
      <section className="relative overflow-hidden rounded-2xl border bg-card px-5 py-6 shadow-sm sm:px-8 sm:py-8">
        <div
          className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-primary/5"
          aria-hidden="true"
        />
        <div className="relative grid items-center gap-7 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-background/80">
                <span className="mr-1.5 size-2 rounded-full bg-emerald-500" />
                Operasional hari ini
              </Badge>
              <span className="text-xs capitalize text-muted-foreground">
                {todayLabel}
              </span>
            </div>
            <h1 className="max-w-3xl text-2xl font-semibold tracking-tight sm:text-3xl">
              Selamat datang, {admin.displayName}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Pantau pemesanan yang masuk dan selesaikan pekerjaan paling penting
              dari satu tempat.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/admin/bookings?status=waiting_verification">
                  Periksa booking
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/trips/new">
                  <Plus className="size-4" aria-hidden="true" />
                  Tambah paket
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Prioritas utama
                </p>
                <p className="mt-1 text-4xl font-semibold tracking-tight">
                  {bookings.waitingVerification}
                </p>
              </div>
              <span className="grid size-10 place-items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
                <CircleAlert className="size-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-sm leading-5 text-amber-800 dark:text-amber-200">
              {bookings.waitingVerification > 0
                ? "Booking menunggu verifikasi pembayaran dan tindak lanjut."
                : "Tidak ada booking yang menunggu verifikasi saat ini."}
            </p>
            <Link
              href="/admin/bookings?status=waiting_verification"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
            >
              Buka antrean
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="dashboard-summary-title">
        <div className="mb-4">
          <h2 id="dashboard-summary-title" className="text-lg font-semibold">
            Ringkasan bisnis
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Angka penting yang perlu dipantau hari ini.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, description, icon: Icon, iconClassName }) => (
            <Card key={label} className="shadow-none">
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {description}
                  </p>
                </div>
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-lg ${iconClassName}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="overflow-hidden shadow-none">
        <CardHeader className="flex-row items-start justify-between gap-4 border-b">
          <div className="grid gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Pemesanan Terbaru</CardTitle>
              {bookings.recent.length > 0 ? (
                <Badge variant="secondary">{bookings.recent.length} terbaru</Badge>
              ) : null}
            </div>
            <CardDescription>
              Booking yang sudah dikirim customer, diurutkan dari yang terbaru.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href="/admin/bookings">
              <span className="hidden sm:inline">Lihat semua</span>
              <ArrowRight className="size-4" aria-hidden="true" />
              <span className="sr-only sm:hidden">Lihat semua pemesanan</span>
            </Link>
          </Button>
        </CardHeader>
        {bookings.recent.length > 0 ? (
          <BookingTable items={bookings.recent} />
        ) : (
          <CardContent className="grid min-h-48 place-items-center py-10 text-center">
            <div>
              <span className="mx-auto grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
                <CalendarDays className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-3 font-medium">Belum ada pemesanan</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pemesanan terbaru akan tampil di bagian ini.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Aksi cepat</CardTitle>
            <CardDescription>
              Jalan pintas untuk pekerjaan konten yang paling sering dilakukan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {quickActions.map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-xl border bg-background p-4 transition-colors hover:border-primary/30 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-semibold group-hover:text-primary">
                  {label}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {description}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Kesiapan konten</CardTitle>
            <CardDescription>Ringkasan isi katalog website.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-1">
              {[
                {
                  label: "Total paket",
                  value: summary.trips,
                  icon: PackageCheck,
                  href: "/admin/trips",
                },
                {
                  label: "Destinasi",
                  value: summary.destinations,
                  icon: MapPinned,
                  href: "/admin/destinations",
                },
                {
                  label: "Artikel blog",
                  value: summary.posts,
                  icon: FileText,
                  href: "/admin/blog",
                },
              ].map(({ label, value, icon: Icon, href }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 border-b py-3 last:border-0"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <dt className="min-w-0 flex-1 text-sm text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="text-sm font-semibold">{value}</dd>
                  <Link
                    href={href}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ArrowRight className="size-4" aria-hidden="true" />
                    <span className="sr-only">Buka {label}</span>
                  </Link>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
