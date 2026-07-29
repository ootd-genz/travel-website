import type { Metadata } from "next";
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

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
import { getBookingDraftByToken } from "@/lib/booking/drafts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Ringkasan Pemesanan",
  description: "Ringkasan harga pemesanan perjalanan yang dihitung server.",
  robots: { index: false, follow: false },
};

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default async function BookingSummaryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  noStore();
  const draft = await getBookingDraftByToken((await params).token);
  if (!draft) notFound();

  if (draft.status === "expired") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <Badge variant="secondary">Sesi berakhir</Badge>
        <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight">
          Sesi pemesanan sudah berakhir.
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Harga atau ketersediaan paket ini perlu diperbarui. Mulai kembali
          pemesanan agar kamu mendapatkan informasi terbaru.
        </p>
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{draft.packageName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Kode draft: {draft.bookingCode}
            </p>
            <Button asChild className="mt-6">
              <Link href={draft.packageSlug ? `/trips/${draft.packageSlug}` : "/trips"}>
                Mulai Kembali Pemesanan
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (draft.status === "unavailable") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <Alert>
          <ShieldCheck className="size-4" aria-hidden="true" />
          <AlertTitle>Draft ini tidak dapat dilanjutkan</AlertTitle>
          <AlertDescription>
            Status pemesanan sudah berubah atau sesi tidak lagi tersedia.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/trips">Lihat Paket Lainnya</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="bg-muted/20">
      <section className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <nav aria-label="Tahapan pemesanan">
            <ol className="grid gap-2 text-sm sm:grid-cols-4">
              {["Ringkasan", "Transfer", "Data & Bukti", "Selesai"].map(
                (step, index) => (
                  <li
                    key={step}
                    className={
                      index === 0
                        ? "rounded-lg bg-primary px-3 py-2 font-semibold text-primary-foreground"
                        : "rounded-lg border px-3 py-2 text-muted-foreground"
                    }
                    aria-current={index === 0 ? "step" : undefined}
                  >
                    {index + 1}. {step}
                  </li>
                ),
              )}
            </ol>
          </nav>

          <Badge className="mt-8" variant="secondary">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            Harga sudah dikunci server
          </Badge>
          <h1 className="mt-4 max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Satu Langkah Lagi untuk Mengamankan Perjalananmu.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            Periksa detail dan total hasil perhitungan server. Ringkasan ini
            belum berarti pembayaran atau pemesananmu sudah dikonfirmasi.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.72fr] lg:px-8 lg:py-14">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <p className="text-sm font-medium text-primary">
                Kode booking sementara
              </p>
              <CardTitle className="text-2xl">{draft.bookingCode}</CardTitle>
            </CardHeader>
            <CardContent>
              <h2 className="text-xl font-semibold">{draft.packageName}</h2>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                {draft.destinationName ? (
                  <div className="flex gap-3">
                    <MapPin
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="text-muted-foreground">Destinasi</dt>
                      <dd className="mt-1 font-medium">
                        {draft.destinationName}
                      </dd>
                    </div>
                  </div>
                ) : null}
                <div className="flex gap-3">
                  <Users
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-muted-foreground">Traveler</dt>
                    <dd className="mt-1 font-medium">
                      {draft.travelerCount} orang
                    </dd>
                  </div>
                </div>
                {draft.departureOption ? (
                  <div className="flex gap-3">
                    <CalendarDays
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="text-muted-foreground">Keberangkatan</dt>
                      <dd className="mt-1 font-medium">
                        {draft.departureOption}
                      </dd>
                    </div>
                  </div>
                ) : null}
                <div className="flex gap-3">
                  <Clock3
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-muted-foreground">
                      Ringkasan berlaku sampai
                    </dt>
                    <dd className="mt-1 font-medium">
                      {formatExpiry(draft.expiresAt)} WIB
                    </dd>
                  </div>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Alert>
            <ShieldCheck className="size-4" aria-hidden="true" />
            <AlertTitle>Total tidak berasal dari browser</AlertTitle>
            <AlertDescription>
              Harga paket, promo, jumlah traveler, dan total sudah disimpan
              sebagai snapshot yang tidak dapat diubah dari halaman ini.
            </AlertDescription>
          </Alert>
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm text-primary">
              <ReceiptText className="size-4" aria-hidden="true" />
              Ringkasan Harga
            </div>
            <CardTitle className="text-3xl">
              {formatPrice(draft.totalAmount, draft.currency)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Harga{" "}
                  {draft.priceUnit === "per_person"
                    ? `per orang × ${draft.travelerCount}`
                    : "per paket"}
                </dt>
                <dd>{formatPrice(draft.subtotalAmount, draft.currency)}</dd>
              </div>
              {draft.discountAmount > 0 ? (
                <div className="flex justify-between gap-4 text-primary">
                  <dt>
                    Diskon
                    {draft.promotionName ? ` — ${draft.promotionName}` : ""}
                  </dt>
                  <dd>
                    −{formatPrice(draft.discountAmount, draft.currency)}
                  </dd>
                </div>
              ) : null}
              <div className="mt-2 flex justify-between gap-4 border-t pt-4 text-base font-bold">
                <dt>Total snapshot</dt>
                <dd>{formatPrice(draft.totalAmount, draft.currency)}</dd>
              </div>
            </dl>
            <Button className="mt-6 w-full" size="lg" disabled>
              Lanjut ke Pembayaran
            </Button>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Instruksi transfer dan pengiriman bukti pembayaran akan tersedia
              pada tahap booking berikutnya.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
