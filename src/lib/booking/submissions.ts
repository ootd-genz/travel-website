import "server-only";

import { createHash } from "node:crypto";

import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { publicBookingTokenSchema } from "@/validations/booking";

const paymentSettingsSchema = z.object({
  bank_name: z.string().trim().min(2).max(50),
  bank_account_number: z.string().regex(/^\d{6,30}$/),
  bank_account_holder: z.string().trim().min(2).max(100),
});

const submissionContextSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "draft",
    "waiting_verification",
    "confirmed",
    "payment_rejected",
    "cancelled",
    "completed",
    "expired",
  ]),
  draft_expires_at: z.string().datetime({ offset: true }),
  traveler_count: z.number().int().min(1),
  total_amount_snapshot: z.coerce.number(),
});

const rpcResultSchema = z.object({
  outcome: z.enum([
    "submitted",
    "already_submitted",
    "expired",
    "unavailable",
    "not_found",
    "amount_mismatch",
    "invalid_payload",
  ]),
  booking_id: z.string().uuid().nullable(),
  booking_code: z.string().nullable(),
});

const successSummarySchema = z.object({
  booking_code: z.string(),
  status: z.enum([
    "waiting_verification",
    "confirmed",
    "payment_rejected",
    "cancelled",
    "completed",
  ]),
  package_name_snapshot: z.string(),
  total_amount_snapshot: z.coerce.number(),
  currency_snapshot: z.string(),
});

export type BookingSubmissionContext =
  | {
      state: "draft";
      bookingId: string;
      travelerCount: number;
      totalAmount: number;
    }
  | { state: "expired" | "submitted" | "unavailable" };

export type BookingSuccessSummary = {
  bookingCode: string;
  status:
    | "waiting_verification"
    | "confirmed"
    | "payment_rejected"
    | "cancelled"
    | "completed";
  packageName: string;
  totalAmount: number;
  currency: string;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getBookingPaymentInstructions() {
  const { data, error } = await createAdminClient()
    .from("site_settings")
    .select("bank_name,bank_account_number,bank_account_holder")
    .eq("id", true)
    .maybeSingle();

  if (error) throw new Error(`Payment settings unavailable (${error.code}).`);
  return paymentSettingsSchema.parse(data);
}

export async function getBookingSubmissionContext(
  rawToken: string,
): Promise<BookingSubmissionContext | null> {
  const token = publicBookingTokenSchema.safeParse(rawToken);
  if (!token.success) return null;

  const { data, error } = await createAdminClient()
    .from("bookings")
    .select(
      "id,status,draft_expires_at,traveler_count,total_amount_snapshot",
    )
    .eq("public_token_hash", hashToken(token.data))
    .maybeSingle();

  if (error) throw new Error(`Booking submission lookup failed (${error.code}).`);
  const parsed = submissionContextSchema.safeParse(data);
  if (!parsed.success) return null;

  if (parsed.data.status === "expired") return { state: "expired" };
  if (
    parsed.data.status === "waiting_verification" ||
    parsed.data.status === "confirmed" ||
    parsed.data.status === "payment_rejected" ||
    parsed.data.status === "cancelled" ||
    parsed.data.status === "completed"
  ) {
    return { state: "submitted" };
  }
  if (parsed.data.status !== "draft") return { state: "unavailable" };
  if (new Date(parsed.data.draft_expires_at).getTime() <= Date.now()) {
    return { state: "expired" };
  }

  return {
    state: "draft",
    bookingId: parsed.data.id,
    travelerCount: parsed.data.traveler_count,
    totalAmount: parsed.data.total_amount_snapshot,
  };
}

export async function submitBooking(input: {
  rawToken: string;
  customerName: string;
  customerWhatsapp: string;
  customerEmail: string;
  customerCity: string | null;
  participantNames: string[];
  senderBankName: string | null;
  senderAccountName: string;
  declaredTransferAmount: string;
  transferredAt: string | null;
  customerNotes: string | null;
  transferProofPath: string;
}) {
  const token = publicBookingTokenSchema.parse(input.rawToken);
  const { data, error } = await createAdminClient().rpc(
    "submit_booking_draft",
    {
      p_public_token_hash: hashToken(token),
      p_customer_name: input.customerName,
      p_customer_whatsapp: input.customerWhatsapp,
      p_customer_email: input.customerEmail,
      p_customer_city: input.customerCity,
      p_participant_names: input.participantNames,
      p_sender_bank_name: input.senderBankName,
      p_sender_account_name: input.senderAccountName,
      p_declared_transfer_amount: input.declaredTransferAmount,
      p_transferred_at: input.transferredAt,
      p_transfer_proof_path: input.transferProofPath,
      p_customer_notes: input.customerNotes,
      p_consent_data_is_correct: true,
      p_consent_payment_requires_verification: true,
    },
  );

  if (error) throw new Error(`Booking submission failed (${error.code}).`);
  const row = Array.isArray(data) ? data[0] : data;
  return rpcResultSchema.parse(row);
}

export async function getBookingSuccessByToken(
  rawToken: string,
): Promise<BookingSuccessSummary | null> {
  const token = publicBookingTokenSchema.safeParse(rawToken);
  if (!token.success) return null;

  const { data, error } = await createAdminClient()
    .from("bookings")
    .select(
      "booking_code,status,package_name_snapshot,total_amount_snapshot,currency_snapshot",
    )
    .eq("public_token_hash", hashToken(token.data))
    .maybeSingle();

  if (error) throw new Error(`Booking success lookup failed (${error.code}).`);
  const parsed = successSummarySchema.safeParse(data);
  if (!parsed.success) return null;

  return {
    bookingCode: parsed.data.booking_code,
    status: parsed.data.status,
    packageName: parsed.data.package_name_snapshot,
    totalAmount: parsed.data.total_amount_snapshot,
    currency: parsed.data.currency_snapshot,
  };
}
