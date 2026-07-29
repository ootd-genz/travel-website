import type { Metadata } from "next";
import {
  BadgeCheck,
  CircleAlert,
  Clock3,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";

import { formatPrice } from "@/components/common/public-content";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBookingSuccessByToken } from "@/lib/booking/submissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Pemesanan Diterima",
  description: "Status pengiriman data dan bukti transfer pemesanan.",
  robots: { index: false, follow: false },
};

const statusLabels = {
  waiting_verification: "Menunggu Verifikasi",
  confirmed: "Dikonfirmasi",
  payment_rejected: "Bukti Ditolak",
  cancelled: "Dibatalkan",
  completed: "Selesai",
} as const;

export default async function BookingSuccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  noStore();
  const { token } = await params;
  const booking = await getBookingSuccessByToken(token);
  if (!booking) redirect(`/booking/${token}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
          <BadgeCheck className="size-8" aria-hidden="true" />
        </span>
        <Badge className="mt-5" variant="secondary">
          Data tersimpan
        </Badge>
        <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Pemesananmu Sudah Kami Terima 🎉
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
          Terima kasih. Data dan bukti transfer sudah masuk. Admin akan
          memeriksa pembayaran sebelum pemesanan dikonfirmasi.
        </p>
      </div>

      <Card className="mt-10">
        <CardHeader>
          <p className="text-sm font-medium text-primary">Kode booking</p>
          <CardTitle className="text-3xl">{booking.bookingCode}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Paket</dt>
              <dd className="mt-1 font-semibold">{booking.packageName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd className="mt-1 inline-flex items-center gap-2 font-semibold">
                <Clock3 className="size-4 text-primary" aria-hidden="true" />
                {statusLabels[booking.status]}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <ReceiptText className="size-4" aria-hidden="true" />
                Total transfer
              </dt>
              <dd className="mt-1 text-2xl font-bold">
                {formatPrice(booking.totalAmount, booking.currency)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Alert className="mt-6 border-primary/30 bg-primary/[0.04]">
        <ShieldCheck className="size-4" aria-hidden="true" />
        <AlertTitle>Simpan kode booking ini</AlertTitle>
        <AlertDescription>
          Gunakan kode tersebut saat berkomunikasi dengan admin. Bukti transfer
          tetap private dan tidak ditampilkan melalui halaman ini.
        </AlertDescription>
      </Alert>

      <Alert className="mt-4 border-accent bg-accent/40">
        <CircleAlert className="size-4" aria-hidden="true" />
        <AlertTitle>Jangan melakukan transfer kedua</AlertTitle>
        <AlertDescription>
          Jangan melakukan transfer atau mengirim bukti kedua untuk kode booking
          yang sama.
        </AlertDescription>
      </Alert>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/trips">Jelajahi Paket Lain</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Kembali ke Home</Link>
        </Button>
      </div>
    </div>
  );
}
