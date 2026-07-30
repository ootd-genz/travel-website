import { Filter, Search, X } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/select";
import {
  getAdminBookingPackageOptions,
  getAdminBookings,
} from "@/lib/booking/admin";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
} from "@/types/booking";
import {
  adminBookingFiltersSchema,
  type AdminBookingFilters,
} from "@/validations/admin-booking";

import { BookingTable } from "./_components/booking-table";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function parseFilters(params: SearchParams) {
  const result = adminBookingFiltersSchema.safeParse({
    q: firstValue(params.q),
    status: firstValue(params.status),
    packageId: firstValue(params.packageId),
    from: firstValue(params.from),
    to: firstValue(params.to),
    page: firstValue(params.page) || 1,
  });

  return {
    filters: result.success
      ? result.data
      : adminBookingFiltersSchema.parse({}),
    invalid: !result.success,
  };
}

function bookingListUrl(filters: AdminBookingFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.packageId) params.set("packageId", filters.packageId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/admin/bookings?${search}` : "/admin/bookings";
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { filters, invalid } = parseFilters(params);
  const [result, packages] = await Promise.all([
    getAdminBookings(filters),
    getAdminBookingPackageOptions(),
  ]);
  const hasFilters = Boolean(
    filters.q ||
      filters.status ||
      filters.packageId ||
      filters.from ||
      filters.to,
  );

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pemesanan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Periksa booking, bukti transfer, status pembayaran, dan riwayat
          operasional dari satu tempat.
        </p>
      </div>

      {invalid ? (
        <Alert className="border-destructive/40 bg-destructive/5">
          <AlertTitle>Filter tidak valid</AlertTitle>
          <AlertDescription>
            Filter dikembalikan ke nilai awal. Periksa rentang tanggal dan pilihan
            yang digunakan.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="p-4">
          <form
            action="/admin/bookings"
            className="grid gap-4 lg:grid-cols-12 lg:items-end"
          >
            <div className="grid gap-2 lg:col-span-4">
              <Label htmlFor="booking-search">
                Kode, nama, atau WhatsApp
              </Label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-3 size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="booking-search"
                  name="q"
                  defaultValue={filters.q}
                  maxLength={100}
                  placeholder="Cari booking..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="booking-status">Status</Label>
              <FormSelect
                id="booking-status"
                name="status"
                defaultValue={filters.status}
                options={[
                  { value: "", label: "Semua status" },
                  ...BOOKING_STATUSES.map((status) => ({
                    value: status,
                    label: BOOKING_STATUS_LABELS[status],
                  })),
                ]}
              />
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="booking-package">Paket</Label>
              <FormSelect
                id="booking-package"
                name="packageId"
                defaultValue={filters.packageId}
                options={[
                  { value: "", label: "Semua paket" },
                  ...packages.map((trip) => ({
                    value: trip.id,
                    label: trip.name,
                  })),
                ]}
              />
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="booking-from">Dari tanggal</Label>
              <Input
                id="booking-from"
                name="from"
                type="date"
                defaultValue={filters.from}
              />
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="booking-to">Sampai tanggal</Label>
              <Input
                id="booking-to"
                name="to"
                type="date"
                defaultValue={filters.to}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:col-span-12 lg:justify-end">
              {hasFilters ? (
                <Button asChild type="button" variant="ghost">
                  <Link href="/admin/bookings">
                    <X className="size-4" aria-hidden="true" />
                    Reset
                  </Link>
                </Button>
              ) : null}
              <Button type="submit">
                <Filter className="size-4" aria-hidden="true" />
                Terapkan Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          Menampilkan {result.items.length} dari {result.total} booking
        </p>
        <p className="text-muted-foreground">
          Halaman {result.page} dari {result.totalPages}
        </p>
      </div>

      <Card className="overflow-hidden">
        {result.items.length === 0 ? (
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <p className="font-medium">
              Belum ada pemesanan yang cocok dengan filter ini.
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Ubah filter pencarian atau reset untuk melihat seluruh booking.
            </p>
            {hasFilters ? (
              <Button asChild className="mt-4" variant="outline">
                <Link href="/admin/bookings">Reset Filter</Link>
              </Button>
            ) : null}
          </CardContent>
        ) : (
          <BookingTable items={result.items} />
        )}
      </Card>

      {result.totalPages > 1 ? (
        <nav
          aria-label="Pagination booking"
          className="flex items-center justify-between gap-3"
        >
          <Button
            asChild={result.page > 1}
            variant="outline"
            disabled={result.page <= 1}
          >
            {result.page > 1 ? (
              <Link href={bookingListUrl(filters, result.page - 1)}>
                Sebelumnya
              </Link>
            ) : (
              <span>Sebelumnya</span>
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            {result.page} / {result.totalPages}
          </span>
          <Button
            asChild={result.page < result.totalPages}
            variant="outline"
            disabled={result.page >= result.totalPages}
          >
            {result.page < result.totalPages ? (
              <Link href={bookingListUrl(filters, result.page + 1)}>
                Berikutnya
              </Link>
            ) : (
              <span>Berikutnya</span>
            )}
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
