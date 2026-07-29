import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileCheck2,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminBookingDetail } from "@/lib/booking/admin";
import { BOOKING_STATUS_LABELS, type BookingStatus } from "@/types/booking";

import {
  AdminNotesForm,
  BookingActions,
  RetryWhatsAppNotificationButton,
} from "../_components/booking-actions";
import { BookingStatusBadge } from "../_components/booking-status-badge";

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short",
});

function formatDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : "Belum tersedia";
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
        new Date(`${value}T00:00:00`),
      )
    : "Belum dipilih";
}

function formatMoney(value: number | null, currency: string) {
  if (value === null) return "Belum tersedia";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-medium">
        {value === null || value === "" ? "Belum tersedia" : value}
      </dd>
    </div>
  );
}

const eventLabels: Record<string, string> = {
  draft_created: "Draft dibuat",
  draft_expired: "Draft kedaluwarsa",
  booking_submitted: "Booking dikirim customer",
  payment_confirmed: "Pembayaran dikonfirmasi",
  payment_rejected: "Bukti pembayaran ditolak",
  booking_cancelled: "Booking dibatalkan",
  booking_completed: "Booking selesai",
  admin_note_updated: "Catatan admin diperbarui",
};

function transitionLabel(
  fromStatus: BookingStatus | null,
  toStatus: BookingStatus | null,
) {
  if (!fromStatus || !toStatus) return null;
  return `${BOOKING_STATUS_LABELS[fromStatus]} → ${BOOKING_STATUS_LABELS[toStatus]}`;
}

export default async function AdminBookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const booking = await getAdminBookingDetail(id);
  if (!booking) notFound();

  return (
    <div className="grid gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-3">
          <Link href="/admin/bookings">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke Pemesanan
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {booking.bookingCode}
              </h1>
              <BookingStatusBadge status={booking.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Masuk {formatDateTime(booking.submittedAt ?? booking.createdAt)}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Terakhir diperbarui {formatDateTime(booking.updatedAt)}
          </p>
        </div>
      </div>

      {query.updated ? (
        <Alert className="border-primary/30 bg-primary/5">
          <AlertTitle>Status berhasil diperbarui</AlertTitle>
          <AlertDescription>
            Perubahan status dan actor admin sudah tercatat pada riwayat booking.
          </AlertDescription>
        </Alert>
      ) : null}
      {query.unchanged ? (
        <Alert>
          <AlertTitle>Status tidak berubah</AlertTitle>
          <AlertDescription>
            Booking sudah berada pada status tujuan; event duplikat tidak dibuat.
          </AlertDescription>
        </Alert>
      ) : null}
      {query.notes ? (
        <Alert className="border-primary/30 bg-primary/5">
          <AlertTitle>Catatan admin tersimpan</AlertTitle>
          <AlertDescription>
            Perubahan catatan sudah dicatat pada riwayat operasional.
          </AlertDescription>
        </Alert>
      ) : null}
      {query.notesUnchanged ? (
        <Alert>
          <AlertTitle>Catatan tidak berubah</AlertTitle>
          <AlertDescription>
            Isi catatan sama dengan data sebelumnya; event duplikat tidak dibuat.
          </AlertDescription>
        </Alert>
      ) : null}
      {query.notification === "sent" ? (
        <Alert className="border-primary/30 bg-primary/5">
          <AlertTitle>Notifikasi WhatsApp terkirim</AlertTitle>
          <AlertDescription>
            Provider menerima pesan dan delivery log sudah diperbarui.
          </AlertDescription>
        </Alert>
      ) : null}
      {query.notification === "unchanged" ? (
        <Alert>
          <AlertTitle>Notifikasi sudah terkirim</AlertTitle>
          <AlertDescription>
            Retry tidak membuat pesan kedua karena event ini sudah tercatat
            terkirim.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Aksi Pemesanan</CardTitle>
          <CardDescription>
            Aksi hanya tersedia untuk transisi yang sah. Setiap perubahan diproses
            server-side dan dicatat secara atomik.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingActions bookingId={booking.id} status={booking.status} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Paket & Total</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailItem label="Paket" value={booking.packageName} />
              <DetailItem
                label="Jumlah traveler"
                value={`${booking.travelerCount} orang`}
              />
              <DetailItem
                label="Harga unit"
                value={`${formatMoney(booking.unitPrice, booking.currency)} / ${
                  booking.priceUnit === "per_person" ? "orang" : "paket"
                }`}
              />
              <DetailItem
                label="Subtotal"
                value={formatMoney(booking.subtotalAmount, booking.currency)}
              />
              <DetailItem
                label="Promo"
                value={booking.promotionName ?? "Tidak ada promo"}
              />
              <DetailItem
                label="Diskon"
                value={formatMoney(booking.discountAmount, booking.currency)}
              />
              <div className="rounded-lg border bg-primary/5 p-4 sm:col-span-2">
                <dt className="text-sm font-medium text-primary">
                  Total snapshot
                </dt>
                <dd className="mt-1 text-2xl font-bold">
                  {formatMoney(booking.totalAmount, booking.currency)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5" aria-hidden="true" />
              Data Pemesan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailItem label="Nama lengkap" value={booking.customerName} />
              <DetailItem
                label="Nomor WhatsApp"
                value={booking.customerWhatsapp}
              />
              <DetailItem label="Email" value={booking.customerEmail} />
              <DetailItem label="Kota domisili" value={booking.customerCity} />
              <div className="sm:col-span-2">
                <DetailItem
                  label="Catatan customer"
                  value={booking.customerNotes}
                />
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-5" aria-hidden="true" />
              Data Perjalanan
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Tanggal keberangkatan"
                value={formatDate(booking.departureDate)}
              />
              <DetailItem
                label="Opsi keberangkatan"
                value={booking.departureOption}
              />
            </dl>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Nama peserta
              </h3>
              {booking.participants.length > 0 ? (
                <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                  {booking.participants.map((participant, index) => (
                    <li
                      key={participant.id}
                      className="rounded-md border bg-muted/30 px-3 py-2 text-sm"
                    >
                      {index + 1}. {participant.fullName}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Data peserta belum tersedia.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Bank pengirim"
                value={booking.senderBankName}
              />
              <DetailItem
                label="Nama rekening pengirim"
                value={booking.senderAccountName}
              />
              <DetailItem
                label="Nominal dideklarasikan"
                value={formatMoney(
                  booking.declaredTransferAmount,
                  booking.currency,
                )}
              />
              <DetailItem
                label="Waktu transfer"
                value={formatDateTime(booking.transferredAt)}
              />
            </dl>
            {booking.declaredTransferAmount !== null &&
            booking.declaredTransferAmount !== booking.totalAmount ? (
              <Alert className="mt-5 border-destructive/40 bg-destructive/5">
                <AlertTitle>Nominal tidak sesuai snapshot</AlertTitle>
                <AlertDescription>
                  Periksa kembali bukti dan mutasi rekening sebelum mengambil
                  tindakan.
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="size-5" aria-hidden="true" />
            Bukti Transfer Private
          </CardTitle>
          <CardDescription>
            Akses sementara berlaku {booking.proof?.expiresInSeconds ?? 300} detik
            dan hanya dibuat setelah authorization admin berhasil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {booking.proof?.url ? (
            <div className="grid gap-4">
              {booking.proof.fileKind === "image" ? (
                <div className="relative min-h-80 overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={booking.proof.url}
                    alt={`Bukti transfer ${booking.bookingCode}`}
                    fill
                    unoptimized
                    className="object-contain"
                    sizes="(max-width: 1280px) 100vw, 960px"
                  />
                </div>
              ) : booking.proof.fileKind === "pdf" ? (
                <iframe
                  title={`Bukti transfer ${booking.bookingCode}`}
                  src={booking.proof.url}
                  className="h-[36rem] w-full rounded-lg border bg-background"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Alert>
                  <AlertTitle>Preview tidak tersedia</AlertTitle>
                  <AlertDescription>
                    Format bukti tidak dapat dipreview, tetapi file dapat dibuka
                    melalui akses sementara.
                  </AlertDescription>
                </Alert>
              )}
              <Button asChild variant="outline" className="w-full sm:w-fit">
                <a
                  href={booking.proof.url}
                  target="_blank"
                  rel="noreferrer"
                  referrerPolicy="no-referrer"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Buka Bukti di Tab Baru
                </a>
              </Button>
            </div>
          ) : (
            <Alert className="border-destructive/40 bg-destructive/5">
              <AlertTitle>Bukti belum dapat ditampilkan</AlertTitle>
              <AlertDescription>
                File belum tersedia, sudah melewati retensi, atau signed URL gagal
                dibuat. Muat ulang halaman untuk mencoba akses baru.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catatan Admin</CardTitle>
          <CardDescription>
            Simpan catatan operasional tanpa memasukkan secret atau signed URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminNotesForm
            bookingId={booking.id}
            defaultValue={booking.adminNotes ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Status & Audit</CardTitle>
          <CardDescription>
            Event terbaru ditampilkan paling atas, lengkap dengan actor dan waktu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {booking.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada event untuk booking ini.
            </p>
          ) : (
            <ol className="relative ml-2 border-l">
              {booking.events.map((event) => {
                const transition = transitionLabel(
                  event.fromStatus,
                  event.toStatus,
                );
                return (
                  <li key={event.id} className="relative pb-6 pl-6 last:pb-0">
                    <span className="absolute -left-1.5 top-1 size-3 rounded-full border-2 border-background bg-primary" />
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-medium">
                          {eventLabels[event.eventType] ?? event.eventType}
                        </p>
                        {transition ? (
                          <p className="text-sm text-muted-foreground">
                            {transition}
                          </p>
                        ) : null}
                      </div>
                      <time className="text-xs text-muted-foreground">
                        {formatDateTime(event.createdAt)}
                      </time>
                    </div>
                    <p className="mt-2 text-sm">
                      Actor: <span className="font-medium">{event.actorLabel}</span>
                    </p>
                    {event.note ? (
                      <p className="mt-2 rounded-md bg-muted/60 p-3 text-sm">
                        {event.note}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Notifikasi WhatsApp</CardTitle>
          <CardDescription>
            Delivery log membantu operasional; database tetap menjadi sumber
            kebenaran booking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {booking.notifications.length === 0 ? (
            <Alert>
              <AlertTitle>Belum ada delivery log</AlertTitle>
              <AlertDescription>
                Booking ini belum memiliki percobaan notifikasi WhatsApp.
                Database tetap menjadi sumber kebenaran operasional.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-3">
              {booking.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">WhatsApp · {notification.eventType}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tujuan {notification.destinationNumber} · Percobaan{" "}
                      {notification.attemptCount}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {notification.sentAt
                        ? `Terkirim ${formatDateTime(notification.sentAt)}`
                        : `Diperbarui ${formatDateTime(notification.updatedAt)}`}
                    </p>
                    {notification.lastErrorCode ? (
                      <p className="mt-1 text-sm text-destructive">
                        Error: {notification.lastErrorCode}
                      </p>
                    ) : null}
                    {notification.status === "failed" &&
                    notification.nextAttemptAt ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Retry aman setelah{" "}
                        {formatDateTime(notification.nextAttemptAt)}.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                    <Badge
                      variant={
                        notification.status === "failed"
                          ? "destructive"
                          : notification.status === "sent"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {notification.status === "sent"
                        ? "Terkirim"
                        : notification.status === "failed"
                          ? "Gagal"
                          : "Menunggu"}
                    </Badge>
                    {notification.status === "failed" &&
                    notification.nextAttemptAt &&
                    notification.attemptCount < 3 &&
                    booking.status === "waiting_verification" ? (
                      <RetryWhatsAppNotificationButton bookingId={booking.id} />
                    ) : null}
                    {notification.status === "failed" &&
                    !notification.nextAttemptAt &&
                    booking.status === "waiting_verification" ? (
                      <p className="max-w-64 text-xs text-muted-foreground">
                        Retry dinonaktifkan untuk error permanen atau setelah
                        batas percobaan.
                      </p>
                    ) : null}
                    {notification.status === "failed" &&
                    booking.status !== "waiting_verification" ? (
                      <p className="max-w-64 text-xs text-muted-foreground">
                        Booking tidak lagi menunggu verifikasi; notifikasi lama
                        tidak dikirim ulang.
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
