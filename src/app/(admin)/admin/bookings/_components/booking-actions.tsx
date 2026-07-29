"use client";

import { useActionState } from "react";

import {
  retryWhatsAppNotificationAction,
  transitionBookingStatusAction,
  updateBookingAdminNotesAction,
  type AdminBookingActionState,
} from "@/actions/admin-booking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAllowedBookingTransitions } from "@/lib/booking/status";
import type {
  BookingStatus,
  BookingTransitionAction,
} from "@/types/booking";

const INITIAL_STATE: AdminBookingActionState = { error: null };

const actionContent: Record<
  BookingTransitionAction,
  {
    label: string;
    title: string;
    description: string;
    submitLabel: string;
    reasonLabel: string;
    reasonRequired: boolean;
    destructive: boolean;
  }
> = {
  confirm: {
    label: "Konfirmasi Pembayaran",
    title: "Konfirmasi pembayaran ini?",
    description:
      "Status pemesanan akan berubah menjadi Dikonfirmasi dan tindakan akan tercatat di riwayat.",
    submitLabel: "Ya, Konfirmasi",
    reasonLabel: "Catatan verifikasi (opsional)",
    reasonRequired: false,
    destructive: false,
  },
  reject: {
    label: "Tolak Bukti Pembayaran",
    title: "Tolak bukti pembayaran?",
    description:
      "Status akan menjadi Bukti Ditolak. Alasan wajib agar catatan pemesanan tetap jelas.",
    submitLabel: "Tolak Bukti",
    reasonLabel: "Alasan penolakan",
    reasonRequired: true,
    destructive: true,
  },
  cancel: {
    label: "Batalkan Pemesanan",
    title: "Batalkan pemesanan ini?",
    description:
      "Pembatalan bersifat terminal pada alur versi pertama dan akan tercatat di riwayat.",
    submitLabel: "Batalkan Pemesanan",
    reasonLabel: "Alasan pembatalan",
    reasonRequired: true,
    destructive: true,
  },
  complete: {
    label: "Tandai Selesai",
    title: "Tandai pemesanan selesai?",
    description:
      "Gunakan aksi ini setelah layanan perjalanan selesai. Tindakan akan tercatat di riwayat.",
    submitLabel: "Tandai Selesai",
    reasonLabel: "Catatan penyelesaian (opsional)",
    reasonRequired: false,
    destructive: false,
  },
};

function BookingActionDialog({
  bookingId,
  action,
}: {
  bookingId: string;
  action: BookingTransitionAction;
}) {
  const [state, formAction, pending] = useActionState(
    transitionBookingStatusAction,
    INITIAL_STATE,
  );
  const content = actionContent[action];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={content.destructive ? "destructive" : "default"}
          className="w-full sm:w-auto"
        >
          {content.label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="grid gap-5">
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="action" value={action} />
          <DialogHeader>
            <DialogTitle>{content.title}</DialogTitle>
            <DialogDescription>{content.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={`reason-${action}`}>{content.reasonLabel}</Label>
            <Textarea
              id={`reason-${action}`}
              name="reason"
              maxLength={2_000}
              required={content.reasonRequired}
              minLength={content.reasonRequired ? 3 : undefined}
              placeholder={
                content.reasonRequired
                  ? "Tuliskan alasan yang jelas..."
                  : "Tambahkan catatan bila diperlukan..."
              }
            />
          </div>
          {state.error ? (
            <Alert className="border-destructive/40 bg-destructive/5">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Kembali
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant={content.destructive ? "destructive" : "default"}
              disabled={pending}
            >
              {pending ? "Memproses..." : content.submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BookingActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  const actions = getAllowedBookingTransitions(status);

  if (actions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Tidak ada aksi status yang tersedia untuk kondisi booking ini.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {actions.map((action) => (
        <BookingActionDialog
          key={action}
          bookingId={bookingId}
          action={action}
        />
      ))}
    </div>
  );
}

export function AdminNotesForm({
  bookingId,
  defaultValue,
}: {
  bookingId: string;
  defaultValue: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateBookingAdminNotesAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Label htmlFor="adminNotes">Catatan internal admin</Label>
      <Textarea
        id="adminNotes"
        name="adminNotes"
        defaultValue={defaultValue}
        maxLength={4_000}
        placeholder="Tambahkan catatan operasional yang aman dan relevan..."
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Maksimum 4.000 karakter. Catatan hanya terlihat oleh admin.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan Catatan"}
        </Button>
      </div>
      {state.error ? (
        <Alert className="border-destructive/40 bg-destructive/5">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}

export function RetryWhatsAppNotificationButton({
  bookingId,
}: {
  bookingId: string;
}) {
  const [state, formAction, pending] = useActionState(
    retryWhatsAppNotificationAction,
    INITIAL_STATE,
  );

  return (
    <form
      action={formAction}
      className="grid justify-items-start gap-2 sm:justify-items-end"
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Mengirim ulang..." : "Coba Kirim Ulang"}
      </Button>
      {state.error ? (
        <p className="max-w-md text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
