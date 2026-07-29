import "server-only";

import { z } from "zod";

import { getWhatsAppEnv } from "@/configs/env";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  getBookingWaitingVerificationTemplateParameters,
  WHATSAPP_WAITING_VERIFICATION_EVENT,
} from "./formatter";
import { createMetaCloudApiProvider } from "./meta-cloud-api";

const DEFAULT_ADMIN_WHATSAPP_NUMBER = "6282261060675";
const MAX_DELIVERY_ATTEMPTS = 3;
const DELIVERY_LEASE_SECONDS = 30;

const destinationNumberSchema = z.string().regex(/^[1-9][0-9]{7,14}$/);
const bookingNotificationSchema = z.object({
  id: z.string().uuid(),
  booking_code: z.string(),
  status: z.literal("waiting_verification"),
  customer_name: z.string().trim().min(2).max(100),
  package_name_snapshot: z.string().trim().min(1),
  departure_date: z.string().nullable(),
  traveler_count: z.number().int().min(1),
  total_amount_snapshot: z.coerce.number().nonnegative(),
  currency_snapshot: z.string().length(3),
});

const claimResultSchema = z
  .array(
    z.object({
      outcome: z.enum([
        "claimed",
        "already_sent",
        "in_progress",
        "backoff",
        "not_retryable",
        "max_attempts",
        "not_found",
        "invalid_booking_state",
        "invalid_input",
      ]),
      delivery_id: z.string().uuid().nullable(),
      attempt_count: z.number().int().min(0),
      destination_number: destinationNumberSchema.nullable(),
      next_attempt_at: z.string().nullable(),
    }),
  )
  .min(1);

const finalizeResultSchema = z
  .array(
    z.object({
      outcome: z.enum([
        "finalized",
        "stale_claim",
        "not_found",
        "invalid_input",
      ]),
      status: z.enum(["pending", "sent", "failed"]).nullable(),
      next_attempt_at: z.string().nullable(),
    }),
  )
  .min(1);

export type WhatsAppNotificationOutcome =
  | {
      outcome: "sent" | "failed" | "already_sent" | "not_retryable";
      nextAttemptAt: string | null;
    }
  | {
      outcome:
        | "in_progress"
        | "backoff"
        | "max_attempts"
        | "booking_unavailable"
        | "delivery_unavailable";
      nextAttemptAt: string | null;
    };

function configuredDestinationFallback() {
  return (
    destinationNumberSchema.safeParse(process.env.WHATSAPP_ADMIN_NUMBER).data ??
    DEFAULT_ADMIN_WHATSAPP_NUMBER
  );
}

async function getDestinationNumber() {
  const fallback = configuredDestinationFallback();

  try {
    const { data, error } = await createAdminClient()
      .from("site_settings")
      .select("admin_whatsapp_number")
      .eq("id", true)
      .maybeSingle();

    if (error) return fallback;

    return (
      destinationNumberSchema.safeParse(data?.admin_whatsapp_number).data ??
      fallback
    );
  } catch {
    return fallback;
  }
}

async function finalizeDelivery(input: {
  deliveryId: string;
  attemptCount: number;
  result: "sent" | "failed";
  providerMessageId: string | null;
  errorCode: string | null;
  retryable: boolean;
}) {
  const { data, error } = await createAdminClient().rpc(
    "finalize_whatsapp_notification",
    {
      p_delivery_id: input.deliveryId,
      p_attempt_count: input.attemptCount,
      p_result: input.result,
      p_provider_message_id: input.providerMessageId,
      p_error_code: input.errorCode,
      p_retryable: input.retryable,
      p_max_attempts: MAX_DELIVERY_ATTEMPTS,
    },
  );

  if (error) {
    console.error("Finalisasi delivery WhatsApp gagal.", {
      code: error.code,
      deliveryId: input.deliveryId,
    });
    return null;
  }

  const parsed = finalizeResultSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Respons finalisasi delivery WhatsApp tidak valid.", {
      deliveryId: input.deliveryId,
    });
    return null;
  }

  return parsed.data[0];
}

async function failClaimedDelivery(
  deliveryId: string,
  attemptCount: number,
  errorCode: string,
  retryable: boolean,
): Promise<WhatsAppNotificationOutcome> {
  const finalization = await finalizeDelivery({
    deliveryId,
    attemptCount,
    result: "failed",
    providerMessageId: null,
    errorCode,
    retryable,
  });

  return {
    outcome: retryable ? "failed" : "not_retryable",
    nextAttemptAt: finalization?.next_attempt_at ?? null,
  };
}

export async function sendBookingWaitingVerificationNotification(
  bookingId: string,
): Promise<WhatsAppNotificationOutcome> {
  const parsedBookingId = z.string().uuid().safeParse(bookingId);
  if (!parsedBookingId.success) {
    return { outcome: "booking_unavailable", nextAttemptAt: null };
  }

  try {
    const destinationNumber = await getDestinationNumber();
    const adminClient = createAdminClient();
    const { data: claimData, error: claimError } = await adminClient.rpc(
      "claim_whatsapp_notification",
      {
        p_booking_id: parsedBookingId.data,
        p_event_type: WHATSAPP_WAITING_VERIFICATION_EVENT,
        p_destination_number: destinationNumber,
        p_max_attempts: MAX_DELIVERY_ATTEMPTS,
        p_lease_seconds: DELIVERY_LEASE_SECONDS,
      },
    );

    if (claimError) {
      console.error("Klaim delivery WhatsApp gagal.", {
        code: claimError.code,
        bookingId: parsedBookingId.data,
      });
      return { outcome: "delivery_unavailable", nextAttemptAt: null };
    }

    const parsedClaim = claimResultSchema.safeParse(claimData);
    if (!parsedClaim.success) {
      console.error("Respons klaim delivery WhatsApp tidak valid.", {
        bookingId: parsedBookingId.data,
      });
      return { outcome: "delivery_unavailable", nextAttemptAt: null };
    }

    const claim = parsedClaim.data[0];
    if (claim.outcome !== "claimed") {
      const outcome =
        claim.outcome === "invalid_booking_state" ||
        claim.outcome === "not_found" ||
        claim.outcome === "invalid_input"
          ? "booking_unavailable"
          : claim.outcome;

      return {
        outcome,
        nextAttemptAt: claim.next_attempt_at,
      };
    }
    if (!claim.delivery_id || !claim.destination_number) {
      return { outcome: "delivery_unavailable", nextAttemptAt: null };
    }

    const { data: bookingData, error: bookingError } = await adminClient
      .from("bookings")
      .select(
        "id,booking_code,status,customer_name,package_name_snapshot,departure_date,traveler_count,total_amount_snapshot,currency_snapshot",
      )
      .eq("id", parsedBookingId.data)
      .maybeSingle();

    if (bookingError) {
      return failClaimedDelivery(
        claim.delivery_id,
        claim.attempt_count,
        "booking_data_unavailable",
        true,
      );
    }

    const booking = bookingNotificationSchema.safeParse(bookingData);
    if (!booking.success) {
      return failClaimedDelivery(
        claim.delivery_id,
        claim.attempt_count,
        "booking_data_invalid",
        false,
      );
    }

    let config: ReturnType<typeof getWhatsAppEnv>;
    try {
      config = getWhatsAppEnv();
    } catch {
      return failClaimedDelivery(
        claim.delivery_id,
        claim.attempt_count,
        "provider_configuration_invalid",
        true,
      );
    }

    const messageInput = {
      bookingId: booking.data.id,
      bookingCode: booking.data.booking_code,
      customerName: booking.data.customer_name,
      packageName: booking.data.package_name_snapshot,
      departureDate: booking.data.departure_date,
      travelerCount: booking.data.traveler_count,
      totalAmount: booking.data.total_amount_snapshot,
      currency: booking.data.currency_snapshot,
      appUrl: config.APP_URL,
    };
    const bodyParameters =
      getBookingWaitingVerificationTemplateParameters(messageInput);

    const provider = createMetaCloudApiProvider({
      apiBaseUrl: config.WHATSAPP_API_BASE_URL,
      apiVersion: config.WHATSAPP_GRAPH_API_VERSION,
      accessToken: config.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: config.WHATSAPP_PHONE_NUMBER_ID,
    });
    const providerResult = await provider.sendTemplate({
      destinationNumber: claim.destination_number,
      templateName: config.WHATSAPP_TEMPLATE_NAME,
      languageCode: config.WHATSAPP_TEMPLATE_LANGUAGE,
      bodyParameters,
    });

    if (!providerResult.ok) {
      return failClaimedDelivery(
        claim.delivery_id,
        claim.attempt_count,
        providerResult.errorCode,
        providerResult.retryable,
      );
    }

    const finalization = await finalizeDelivery({
      deliveryId: claim.delivery_id,
      attemptCount: claim.attempt_count,
      result: "sent",
      providerMessageId: providerResult.providerMessageId,
      errorCode: null,
      retryable: false,
    });

    if (!finalization || finalization.outcome !== "finalized") {
      return { outcome: "delivery_unavailable", nextAttemptAt: null };
    }

    return { outcome: "sent", nextAttemptAt: null };
  } catch (error) {
    console.error("Proses notifikasi WhatsApp gagal tanpa menggagalkan booking.", {
      code: error instanceof Error ? error.name : "unknown",
      bookingId: parsedBookingId.data,
    });
    return { outcome: "delivery_unavailable", nextAttemptAt: null };
  }
}
