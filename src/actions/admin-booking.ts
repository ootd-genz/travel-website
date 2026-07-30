"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { sendBookingWaitingVerificationNotification } from "@/lib/notifications/whatsapp/service";
import { logger } from "@/lib/observability/logger";
import { createClient } from "@/lib/supabase/server";
import {
  bookingAdminNotesSchema,
  bookingTransitionSchema,
  retryWhatsAppNotificationSchema,
} from "@/validations/admin-booking";

export type AdminBookingActionState = {
  error: string | null;
};

const transitionResultSchema = z
  .array(
    z.object({
      outcome: z.enum([
        "transitioned",
        "already_current",
        "invalid_action",
        "invalid_note",
        "reason_required",
        "not_found",
        "invalid_transition",
      ]),
      previous_status: z.string().nullable(),
      current_status: z.string().nullable(),
    }),
  )
  .min(1);

const notesResultSchema = z
  .array(
    z.object({
      outcome: z.enum(["updated", "unchanged", "invalid_notes", "not_found"]),
    }),
  )
  .min(1);

function refreshBookingRoutes(bookingId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function transitionBookingStatusAction(
  _previousState: AdminBookingActionState,
  formData: FormData,
): Promise<AdminBookingActionState> {
  const parsed = bookingTransitionSchema.safeParse({
    bookingId: formData.get("bookingId"),
    action: formData.get("action"),
    reason: formData.get("reason") ?? "",
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.flatten().fieldErrors.reason?.[0] ??
        "Permintaan perubahan status tidak valid.",
    };
  }

  await requireAdmin();
  const client = await createClient();
  const { data, error } = await client.rpc("transition_booking_status", {
    p_booking_id: parsed.data.bookingId,
    p_action: parsed.data.action,
    p_note: parsed.data.reason || null,
  });

  if (error) {
    logger.error("admin.booking_transition_failed", {
      code: error.code,
      bookingId: parsed.data.bookingId,
    });
    return {
      error:
        "Status belum dapat diperbarui. Muat ulang halaman lalu coba kembali.",
    };
  }

  const outcome = transitionResultSchema.safeParse(data);
  if (!outcome.success) {
    return { error: "Respons perubahan status tidak valid." };
  }

  const result = outcome.data[0];
  if (result.outcome === "not_found") {
    return { error: "Booking tidak ditemukan." };
  }
  if (result.outcome === "invalid_transition") {
    return {
      error:
        "Status booking sudah berubah dan aksi ini tidak lagi diperbolehkan. Muat ulang halaman.",
    };
  }
  if (
    result.outcome === "invalid_action" ||
    result.outcome === "invalid_note" ||
    result.outcome === "reason_required"
  ) {
    return { error: "Aksi atau alasan perubahan status tidak valid." };
  }

  refreshBookingRoutes(parsed.data.bookingId);
  redirect(
    `/admin/bookings/${parsed.data.bookingId}?${result.outcome === "already_current" ? "unchanged" : "updated"}=1`,
  );
}

export async function updateBookingAdminNotesAction(
  _previousState: AdminBookingActionState,
  formData: FormData,
): Promise<AdminBookingActionState> {
  const parsed = bookingAdminNotesSchema.safeParse({
    bookingId: formData.get("bookingId"),
    adminNotes: formData.get("adminNotes") ?? "",
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.flatten().fieldErrors.adminNotes?.[0] ??
        "Catatan admin tidak valid.",
    };
  }

  await requireAdmin();
  const client = await createClient();
  const { data, error } = await client.rpc("update_booking_admin_notes", {
    p_booking_id: parsed.data.bookingId,
    p_admin_notes: parsed.data.adminNotes,
  });

  if (error) {
    logger.error("admin.booking_notes_failed", {
      code: error.code,
      bookingId: parsed.data.bookingId,
    });
    return {
      error: "Catatan belum dapat disimpan. Coba kembali beberapa saat.",
    };
  }

  const outcome = notesResultSchema.safeParse(data);
  if (!outcome.success) return { error: "Respons penyimpanan catatan tidak valid." };
  if (outcome.data[0].outcome === "not_found") {
    return { error: "Booking tidak ditemukan." };
  }
  if (outcome.data[0].outcome === "invalid_notes") {
    return { error: "Catatan admin terlalu panjang." };
  }

  refreshBookingRoutes(parsed.data.bookingId);
  redirect(
    `/admin/bookings/${parsed.data.bookingId}?${outcome.data[0].outcome === "unchanged" ? "notesUnchanged" : "notes"}=1`,
  );
}

export async function retryWhatsAppNotificationAction(
  _previousState: AdminBookingActionState,
  formData: FormData,
): Promise<AdminBookingActionState> {
  const parsed = retryWhatsAppNotificationSchema.safeParse({
    bookingId: formData.get("bookingId"),
  });
  if (!parsed.success) return { error: "ID booking tidak valid." };

  await requireAdmin();
  const result = await sendBookingWaitingVerificationNotification(
    parsed.data.bookingId,
  );

  if (result.outcome === "sent" || result.outcome === "already_sent") {
    refreshBookingRoutes(parsed.data.bookingId);
    redirect(
      `/admin/bookings/${parsed.data.bookingId}?notification=${result.outcome === "sent" ? "sent" : "unchanged"}`,
    );
  }

  if (result.outcome === "backoff" || result.outcome === "in_progress") {
    const availableAt = result.nextAttemptAt
      ? new Intl.DateTimeFormat("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(result.nextAttemptAt))
      : null;
    return {
      error: availableAt
        ? `Retry belum tersedia. Coba kembali setelah ${availableAt}.`
        : "Notifikasi sedang diproses. Tunggu sebentar lalu muat ulang halaman.",
    };
  }

  if (result.outcome === "max_attempts") {
    return {
      error:
        "Batas tiga percobaan sudah tercapai. Periksa konfigurasi/provider sebelum tindak lanjut manual.",
    };
  }
  if (result.outcome === "not_retryable") {
    return {
      error:
        "Error terakhir tidak aman untuk dicoba ulang. Periksa konfigurasi/provider terlebih dahulu.",
    };
  }
  if (result.outcome === "booking_unavailable") {
    return {
      error:
        "Booking tidak lagi berstatus Menunggu Verifikasi, sehingga notifikasi lama tidak dikirim ulang.",
    };
  }

  refreshBookingRoutes(parsed.data.bookingId);
  return {
    error:
      result.outcome === "failed"
        ? "Provider masih gagal. Delivery log sudah diperbarui dan retry tetap dibatasi."
        : "Notifikasi belum dapat diproses. Pastikan migration dan konfigurasi provider sudah aktif.",
  };
}
