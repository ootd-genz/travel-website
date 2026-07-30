import "server-only";

import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { logger } from "@/lib/observability/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  BOOKING_STATUSES,
  NOTIFICATION_DELIVERY_STATUSES,
  type AdminBookingListItem,
  type BookingStatus,
} from "@/types/booking";
import type { AdminBookingFilters } from "@/validations/admin-booking";

const BOOKING_PAGE_SIZE = 20;
const TRANSFER_PROOF_SIGNED_URL_TTL_SECONDS = 5 * 60;

const bookingListRowSchema = z.object({
  id: z.string().uuid(),
  booking_code: z.string(),
  customer_name: z.string().nullable(),
  customer_whatsapp: z.string().nullable(),
  package_name_snapshot: z.string(),
  departure_date: z.string().nullable(),
  total_amount_snapshot: z.coerce.number(),
  currency_snapshot: z.string(),
  status: z.enum(BOOKING_STATUSES),
  notification_deliveries: z
    .array(
      z.object({
        status: z.enum(NOTIFICATION_DELIVERY_STATUSES),
      }),
    ),
  submitted_at: z.string().nullable(),
  created_at: z.string(),
});

const bookingDetailRowSchema = z.object({
  id: z.string().uuid(),
  booking_code: z.string(),
  status: z.enum(BOOKING_STATUSES),
  package_id: z.string().uuid(),
  package_name_snapshot: z.string(),
  promotion_name_snapshot: z.string().nullable(),
  promotion_code_snapshot: z.string().nullable(),
  unit_price_snapshot: z.coerce.number(),
  price_unit_snapshot: z.enum(["per_person", "per_package"]),
  subtotal_amount_snapshot: z.coerce.number(),
  discount_snapshot: z.coerce.number(),
  traveler_count: z.number().int(),
  total_amount_snapshot: z.coerce.number(),
  currency_snapshot: z.string(),
  departure_date: z.string().nullable(),
  departure_option_snapshot: z.string().nullable(),
  customer_name: z.string().nullable(),
  customer_whatsapp: z.string().nullable(),
  customer_email: z.string().nullable(),
  customer_city: z.string().nullable(),
  sender_bank_name: z.string().nullable(),
  sender_account_name: z.string().nullable(),
  declared_transfer_amount: z.coerce.number().nullable(),
  transferred_at: z.string().nullable(),
  transfer_proof_path: z.string().nullable(),
  customer_notes: z.string().nullable(),
  admin_notes: z.string().nullable(),
  submitted_at: z.string().nullable(),
  confirmed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const participantRowSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  sort_order: z.number().int(),
});

const eventRowSchema = z.object({
  id: z.string().uuid(),
  event_type: z.string(),
  from_status: z.enum(BOOKING_STATUSES).nullable(),
  to_status: z.enum(BOOKING_STATUSES).nullable(),
  actor_type: z.enum(["system", "admin"]),
  actor_id: z.string().uuid().nullable(),
  note: z.string().nullable(),
  created_at: z.string(),
});

const notificationRowSchema = z.object({
  id: z.string().uuid(),
  channel: z.literal("whatsapp"),
  event_type: z.string(),
  destination_number: z.string(),
  status: z.enum(["pending", "sent", "failed"]),
  attempt_count: z.number().int(),
  last_error_code: z.string().nullable(),
  sent_at: z.string().nullable(),
  next_attempt_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

function sanitizeSearchTerm(value: string) {
  return value.replace(/[^\p{L}\p{N}\s+@._-]/gu, "").trim();
}

function mapBookingListRow(
  input: z.infer<typeof bookingListRowSchema>,
): AdminBookingListItem {
  return {
    id: input.id,
    bookingCode: input.booking_code,
    customerName: input.customer_name,
    customerWhatsapp: input.customer_whatsapp,
    packageName: input.package_name_snapshot,
    departureDate: input.departure_date,
    totalAmount: input.total_amount_snapshot,
    currency: input.currency_snapshot,
    status: input.status,
    whatsappNotificationStatus:
      input.notification_deliveries[0]?.status ?? null,
    submittedAt: input.submitted_at,
    createdAt: input.created_at,
  };
}

function parseRows<T>(
  rows: unknown[] | null,
  schema: z.ZodType<T>,
  context: string,
) {
  const parsed = z.array(schema).safeParse(rows ?? []);
  if (!parsed.success) {
    throw new Error(`Data ${context} dari database tidak valid.`);
  }
  return parsed.data;
}

export async function getAdminBookings(filters: AdminBookingFilters) {
  await requireAdmin();
  const client = await createClient();
  const offset = (filters.page - 1) * BOOKING_PAGE_SIZE;

  let query = client
    .from("bookings")
    .select(
      "id,booking_code,customer_name,customer_whatsapp,package_name_snapshot,departure_date,total_amount_snapshot,currency_snapshot,status,submitted_at,created_at,notification_deliveries(status)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + BOOKING_PAGE_SIZE - 1);

  const search = sanitizeSearchTerm(filters.q);
  if (search) {
    query = query.or(
      `booking_code.ilike.%${search}%,customer_name.ilike.%${search}%,customer_whatsapp.ilike.%${search}%`,
    );
  }
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.packageId) query = query.eq("package_id", filters.packageId);
  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00`);
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59.999`);

  const { data, error, count } = await query;
  if (error) {
    throw new Error(`Daftar booking tidak dapat dimuat (${error.code}).`);
  }

  const items = parseRows(data, bookingListRowSchema, "booking").map(
    mapBookingListRow,
  );
  const total = count ?? 0;

  return {
    items,
    total,
    page: filters.page,
    pageSize: BOOKING_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / BOOKING_PAGE_SIZE)),
  };
}

export async function getAdminBookingPackageOptions() {
  await requireAdmin();
  const client = await createClient();
  const { data, error } = await client
    .from("trips")
    .select("id,name")
    .order("name");

  if (error) {
    throw new Error(`Pilihan paket tidak dapat dimuat (${error.code}).`);
  }

  return z
    .array(z.object({ id: z.string().uuid(), name: z.string() }))
    .parse(data ?? []);
}

export async function getTransferProofSignedUrl(bookingId: string) {
  const parsedId = z.string().uuid().safeParse(bookingId);
  if (!parsedId.success) return null;

  await requireAdmin();
  const client = await createClient();
  const { data: booking, error: bookingError } = await client
    .from("bookings")
    .select("booking_code,transfer_proof_path")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (bookingError) {
    throw new Error(`Bukti transfer tidak dapat diperiksa (${bookingError.code}).`);
  }
  if (!booking?.transfer_proof_path) return null;

  const extension =
    booking.transfer_proof_path.split(".").pop()?.toLowerCase() ?? "";
  const fileKind =
    extension === "pdf"
      ? "pdf"
      : extension === "jpg" || extension === "jpeg" || extension === "png"
        ? "image"
        : "unknown";

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.storage
    .from("booking-transfer-proofs")
    .createSignedUrl(
      booking.transfer_proof_path,
      TRANSFER_PROOF_SIGNED_URL_TTL_SECONDS,
    );

  if (error || !data?.signedUrl) {
    logger.error("admin.transfer_proof_signing_failed", {
      code: error?.name ?? "missing_signed_url",
      bookingId: parsedId.data,
    });
    return {
      url: null,
      fileKind,
      expiresInSeconds: TRANSFER_PROOF_SIGNED_URL_TTL_SECONDS,
    } as const;
  }

  const { error: auditError } = await client.rpc(
    "record_booking_proof_access",
    { p_booking_id: parsedId.data },
  );
  if (auditError) {
    logger.error("admin.transfer_proof_audit_failed", {
      code: auditError.code,
      bookingId: parsedId.data,
    });
    return {
      url: null,
      fileKind,
      expiresInSeconds: TRANSFER_PROOF_SIGNED_URL_TTL_SECONDS,
    } as const;
  }

  return {
    url: data.signedUrl,
    fileKind,
    expiresInSeconds: TRANSFER_PROOF_SIGNED_URL_TTL_SECONDS,
  } as const;
}

export async function getAdminBookingDetail(bookingId: string) {
  const parsedId = z.string().uuid().safeParse(bookingId);
  if (!parsedId.success) return null;

  const admin = await requireAdmin();
  const client = await createClient();
  const { data, error } = await client
    .from("bookings")
    .select(
      "id,booking_code,status,package_id,package_name_snapshot,promotion_name_snapshot,promotion_code_snapshot,unit_price_snapshot,price_unit_snapshot,subtotal_amount_snapshot,discount_snapshot,traveler_count,total_amount_snapshot,currency_snapshot,departure_date,departure_option_snapshot,customer_name,customer_whatsapp,customer_email,customer_city,sender_bank_name,sender_account_name,declared_transfer_amount,transferred_at,transfer_proof_path,customer_notes,admin_notes,submitted_at,confirmed_at,created_at,updated_at",
    )
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error) {
    throw new Error(`Detail booking tidak dapat dimuat (${error.code}).`);
  }
  const parsedBooking = bookingDetailRowSchema.safeParse(data);
  if (!parsedBooking.success) return null;

  const [participantsResult, eventsResult, notificationsResult, proof] =
    await Promise.all([
      client
        .from("booking_participants")
        .select("id,full_name,sort_order")
        .eq("booking_id", parsedId.data)
        .order("sort_order"),
      client
        .from("booking_events")
        .select(
          "id,event_type,from_status,to_status,actor_type,actor_id,note,created_at",
        )
        .eq("booking_id", parsedId.data)
        .order("created_at", { ascending: false }),
      client
        .from("notification_deliveries")
        .select(
          "id,channel,event_type,destination_number,status,attempt_count,last_error_code,sent_at,next_attempt_at,created_at,updated_at",
        )
        .eq("booking_id", parsedId.data)
        .order("created_at", { ascending: false }),
      parsedBooking.data.transfer_proof_path
        ? getTransferProofSignedUrl(parsedId.data)
        : Promise.resolve(null),
    ]);

  const failed = [
    participantsResult.error,
    eventsResult.error,
    notificationsResult.error,
  ].find(Boolean);
  if (failed) {
    throw new Error(`Data pendukung booking tidak dapat dimuat (${failed.code}).`);
  }

  const booking = parsedBooking.data;

  return {
    id: booking.id,
    bookingCode: booking.booking_code,
    status: booking.status,
    packageId: booking.package_id,
    packageName: booking.package_name_snapshot,
    promotionName: booking.promotion_name_snapshot,
    promotionCode: booking.promotion_code_snapshot,
    unitPrice: booking.unit_price_snapshot,
    priceUnit: booking.price_unit_snapshot,
    subtotalAmount: booking.subtotal_amount_snapshot,
    discountAmount: booking.discount_snapshot,
    travelerCount: booking.traveler_count,
    totalAmount: booking.total_amount_snapshot,
    currency: booking.currency_snapshot,
    departureDate: booking.departure_date,
    departureOption: booking.departure_option_snapshot,
    customerName: booking.customer_name,
    customerWhatsapp: booking.customer_whatsapp,
    customerEmail: booking.customer_email,
    customerCity: booking.customer_city,
    senderBankName: booking.sender_bank_name,
    senderAccountName: booking.sender_account_name,
    declaredTransferAmount: booking.declared_transfer_amount,
    transferredAt: booking.transferred_at,
    customerNotes: booking.customer_notes,
    adminNotes: booking.admin_notes,
    submittedAt: booking.submitted_at,
    confirmedAt: booking.confirmed_at,
    createdAt: booking.created_at,
    updatedAt: booking.updated_at,
    proof,
    participants: parseRows(
      participantsResult.data,
      participantRowSchema,
      "peserta booking",
    ).map((participant) => ({
      id: participant.id,
      fullName: participant.full_name,
      sortOrder: participant.sort_order,
    })),
    events: parseRows(
      eventsResult.data,
      eventRowSchema,
      "riwayat booking",
    ).map((event) => ({
      id: event.id,
      eventType: event.event_type,
      fromStatus: event.from_status,
      toStatus: event.to_status,
      actorType: event.actor_type,
      actorLabel:
        event.actor_type === "admin" ? admin.displayName : "Sistem",
      note: event.note,
      createdAt: event.created_at,
    })),
    notifications: parseRows(
      notificationsResult.data,
      notificationRowSchema,
      "notifikasi booking",
    ).map((notification) => ({
      id: notification.id,
      channel: notification.channel,
      eventType: notification.event_type,
      destinationNumber: notification.destination_number,
      status: notification.status,
      attemptCount: notification.attempt_count,
      lastErrorCode: notification.last_error_code,
      sentAt: notification.sent_at,
      nextAttemptAt: notification.next_attempt_at,
      createdAt: notification.created_at,
      updatedAt: notification.updated_at,
    })),
  };
}

export async function getAdminBookingDashboard() {
  await requireAdmin();
  const client = await createClient();
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();

  const [waiting, confirmed, thisMonth, recent] = await Promise.all([
    client
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "waiting_verification"),
    client
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed"),
    client
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .not("submitted_at", "is", null)
      .gte("submitted_at", monthStart),
    client
      .from("bookings")
      .select(
        "id,booking_code,customer_name,customer_whatsapp,package_name_snapshot,departure_date,total_amount_snapshot,currency_snapshot,status,submitted_at,created_at,notification_deliveries(status)",
      )
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(5),
  ]);

  const failed = [waiting.error, confirmed.error, thisMonth.error, recent.error].find(
    Boolean,
  );
  if (failed) {
    throw new Error(`Ringkasan booking tidak dapat dimuat (${failed.code}).`);
  }

  return {
    waitingVerification: waiting.count ?? 0,
    confirmed: confirmed.count ?? 0,
    thisMonth: thisMonth.count ?? 0,
    recent: parseRows(recent.data, bookingListRowSchema, "booking terbaru").map(
      mapBookingListRow,
    ),
  };
}

export function isBookingStatus(value: string): value is BookingStatus {
  return BOOKING_STATUSES.includes(value as BookingStatus);
}
