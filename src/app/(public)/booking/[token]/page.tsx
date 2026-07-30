import type { Metadata } from "next";
import {
  CalendarDays,
  Check,
  Clock3,
  Landmark,
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
import { getBookingPaymentInstructions } from "@/lib/booking/submissions";

import { BookingSubmissionForm } from "./_components/booking-submission-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Transfer & Lengkapi Pemesanan",
  description:
    "Instruksi transfer, data pemesan, dan pengiriman bukti pembayaran.",
  robots: { index: false, follow: false },
};

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

const steps = [
  "Ringkasan",
  "Transfer",
  "Data & Bukti",
  "Selesai",
] as const;

export default async function BookingSummaryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  noStore();
  const { token } = await params;
  const draft = await getBookingDraftByToken(token);
  if (!draft) notFound();

  if (draft.status === "expired") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
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
              <Link
                href={
                  draft.packageSlug ? `/trips/${draft.packageSlug}` : "/trips"
                }
              >
                Mulai Kembali Pemesanan
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (draft.status === "unavailable") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <Alert>
          <ShieldCheck className="size-4" aria-hidden="true" />
          <AlertTitle>Draft ini sudah diproses</AlertTitle>
          <AlertDescription>
            Data pemesanan mungkin sudah diterima. Buka halaman status agar
            kamu tidak mengirim pembayaran atau bukti kedua kali.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-6">
          <Link href={`/booking/${token}/success`}>
            Lihat Status Pemesanan
          </Link>
        </Button>
      </div>
    );
  }

  const payment = await getBookingPaymentInstructions();

  return (
    <div>
      <section className="border-b bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Badge variant="secondary">Pemesanan aman & terverifikasi manual</Badge>
          <h1 className="mt-4 max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Satu Langkah Lagi untuk Mengamankan Perjalananmu.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
            Periksa ringkasan, transfer tepat sesuai total, lalu kirim data
            diri dan bukti transfer agar admin dapat memverifikasi pesananmu.
          </p>

          <ol
            className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
            aria-label="Tahapan pemesanan"
          >
            {steps.map((step, index) => (
              <li
                key={step}
                aria-current={index === 2 ? "step" : undefined}
                className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {index < 2 ? (
                  <Check
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                ) : (
                  <span
                    className="grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                )}
                <span className={index === 2 ? "font-semibold" : ""}>
                  {step}
                  {index < 2 ? <span className="sr-only"> — selesai</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.74fr]">
          <Card>
            <CardHeader>
              <p className="text-sm font-medium text-primary">
                Langkah 1 · Kode booking sementara
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
                      Sesi berlaku sampai
                    </dt>
                    <dd className="mt-1 font-medium">
                      {formatExpiry(draft.expiresAt)} WIB
                    </dd>
                  </div>
                </div>
              </dl>

              <dl className="mt-6 grid gap-3 border-t pt-5 text-sm">
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
                      {draft.promotionCode ? ` (${draft.promotionCode})` : ""}
                    </dt>
                    <dd>
                      −{formatPrice(draft.discountAmount, draft.currency)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4 border-t pt-4 text-base font-bold">
                  <dt>Total transfer</dt>
                  <dd>{formatPrice(draft.totalAmount, draft.currency)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/[0.04]">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Landmark className="size-4" aria-hidden="true" />
                Langkah 2 · Transfer ke Rekening Resmi
              </div>
              <CardTitle className="text-3xl">{payment.bank_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Nomor rekening
                  </dt>
                  <dd className="mt-1 break-all text-2xl font-bold tracking-wide">
                    {payment.bank_account_number}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Atas nama</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {payment.bank_account_holder}
                  </dd>
                </div>
                <div className="rounded-lg bg-background p-4">
                  <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ReceiptText className="size-4" aria-hidden="true" />
                    Nominal tepat
                  </dt>
                  <dd className="mt-2 text-2xl font-bold text-primary">
                    {formatPrice(draft.totalAmount, draft.currency)}
                  </dd>
                </div>
              </dl>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                Transfer tepat sesuai total yang tertera agar proses verifikasi
                lebih mudah. Simpan bukti transfer untuk langkah berikutnya.
              </p>
            </CardContent>
          </Card>
        </div>

        <Alert className="mt-6">
          <ShieldCheck className="size-4" aria-hidden="true" />
          <AlertTitle>Periksa sebelum transfer</AlertTitle>
          <AlertDescription>
            Pastikan bank, nomor rekening, nama pemilik, dan nominal sama
            persis dengan informasi di halaman ini. Submit form belum berarti
            pembayaran sudah dikonfirmasi.
          </AlertDescription>
        </Alert>

        <div className="mt-8">
          <BookingSubmissionForm
            token={token}
            travelerCount={draft.travelerCount}
            totalAmount={draft.totalAmount}
          />
        </div>
      </section>
    </div>
  );
}
