import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

import { getServerEnv } from "@/configs/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicBookingTokenSchema } from "@/validations/booking";

import {
  calculatePriceSnapshot,
  type PriceUnit,
  type PromotionForPricing,
} from "./pricing";

const tripRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  base_price: z.union([z.string(), z.number()]),
  sale_price: z.union([z.string(), z.number()]).nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  price_unit: z.enum(["per_person", "per_package"]),
  min_participants: z.number().int().min(1),
  max_participants: z.number().int().min(1),
  departure_options: z.unknown(),
  status: z.enum(["draft", "published", "archived"]),
  updated_at: z.string().datetime({ offset: true }),
});

const promotionRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.union([z.string(), z.number()]),
  starts_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }).nullable(),
  is_active: z.boolean(),
  updated_at: z.string().datetime({ offset: true }),
});

const bookingRowSchema = z.object({
  id: z.string().uuid(),
  booking_code: z.string(),
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
  package_id: z.string().uuid(),
  package_name_snapshot: z.string(),
  promotion_name_snapshot: z.string().nullable(),
  unit_price_snapshot: z.coerce.number(),
  price_unit_snapshot: z.enum(["per_person", "per_package"]),
  subtotal_amount_snapshot: z.coerce.number(),
  discount_snapshot: z.coerce.number(),
  traveler_count: z.number().int(),
  total_amount_snapshot: z.coerce.number(),
  currency_snapshot: z.string(),
  departure_option_snapshot: z.string().nullable(),
});

export type BookingDraftSummary = {
  id: string;
  bookingCode: string;
  status: "draft" | "expired" | "unavailable";
  expiresAt: string;
  packageId: string;
  packageSlug: string | null;
  packageName: string;
  destinationName: string | null;
  promotionName: string | null;
  unitPrice: number;
  priceUnit: PriceUnit;
  subtotalAmount: number;
  discountAmount: number;
  travelerCount: number;
  totalAmount: number;
  currency: string;
  departureOption: string | null;
};

export class BookingDraftError extends Error {
  constructor(
    public readonly code:
      | "package_unavailable"
      | "invalid_traveler_count"
      | "invalid_departure_option"
      | "unexpected",
  ) {
    super(code);
    this.name = "BookingDraftError";
  }
}

function departureOptions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((option) =>
    typeof option === "string" && option.trim()
      ? [option.trim().slice(0, 200)]
      : [],
  );
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function bookingDateCode(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}${value.month}${value.day}`;
}

const BOOKING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function bookingCode(now: Date) {
  const bytes = randomBytes(6);
  const suffix = Array.from(
    bytes,
    (byte) => BOOKING_CODE_ALPHABET[byte % BOOKING_CODE_ALPHABET.length],
  ).join("");
  return `TRV-${bookingDateCode(now)}-${suffix}`;
}

function priceVersionAt(tripUpdatedAt: string, promotion: PromotionForPricing | null) {
  const versions = [
    new Date(tripUpdatedAt).getTime(),
    promotion?.updatedAt ? new Date(promotion.updatedAt).getTime() : 0,
  ];
  return new Date(Math.max(...versions)).toISOString();
}

function mapPromotion(row: z.infer<typeof promotionRowSchema>): PromotionForPricing {
  return {
    id: row.id,
    name: row.name,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    updatedAt: row.updated_at,
  };
}

export async function createBookingDraft(input: {
  tripId: string;
  travelerCount: number;
  departureOption: string | null;
}) {
  const client = createAdminClient();
  const now = new Date();
  const { data: tripData, error: tripError } = await client
    .from("trips")
    .select(
      "id,name,slug,base_price,sale_price,currency,price_unit,min_participants,max_participants,departure_options,status,updated_at",
    )
    .eq("id", input.tripId)
    .maybeSingle();

  if (tripError) throw new BookingDraftError("unexpected");

  const parsedTrip = tripRowSchema.safeParse(tripData);
  if (!parsedTrip.success || parsedTrip.data.status !== "published") {
    throw new BookingDraftError("package_unavailable");
  }

  const trip = parsedTrip.data;
  if (
    input.travelerCount < trip.min_participants ||
    input.travelerCount > trip.max_participants
  ) {
    throw new BookingDraftError("invalid_traveler_count");
  }

  const validDepartureOptions = departureOptions(trip.departure_options);
  const selectedDeparture = input.departureOption?.trim() || null;
  if (
    (validDepartureOptions.length > 0 &&
      (!selectedDeparture ||
        !validDepartureOptions.includes(selectedDeparture))) ||
    (validDepartureOptions.length === 0 && selectedDeparture)
  ) {
    throw new BookingDraftError("invalid_departure_option");
  }

  const { data: promotionLinks, error: promotionLinksError } = await client
    .from("promotion_trips")
    .select("promotion_id")
    .eq("trip_id", trip.id);

  if (promotionLinksError) throw new BookingDraftError("unexpected");

  const promotionIds = (promotionLinks ?? []).flatMap((row) =>
    typeof row.promotion_id === "string" ? [row.promotion_id] : [],
  );
  let promotions: PromotionForPricing[] = [];

  if (promotionIds.length > 0) {
    const { data: promotionData, error: promotionError } = await client
      .from("promotions")
      .select(
        "id,name,discount_type,discount_value,starts_at,ends_at,is_active,updated_at",
      )
      .in("id", promotionIds);

    if (promotionError) throw new BookingDraftError("unexpected");
    const parsedPromotions = promotionRowSchema.array().safeParse(promotionData ?? []);
    if (!parsedPromotions.success) throw new BookingDraftError("unexpected");
    promotions = parsedPromotions.data.map(mapPromotion);
  }

  const snapshot = calculatePriceSnapshot({
    basePrice: trip.base_price,
    salePrice: trip.sale_price,
    priceUnit: trip.price_unit,
    travelerCount: input.travelerCount,
    promotions,
    now,
  });
  const env = getServerEnv();
  const expiresAt = new Date(
    now.getTime() + env.BOOKING_DRAFT_TTL_MINUTES * 60_000,
  );

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const token = randomBytes(32).toString("base64url");
    const code = bookingCode(now);
    const { data: inserted, error: insertError } = await client
      .from("bookings")
      .insert({
        booking_code: code,
        public_token_hash: hashToken(token),
        status: "draft",
        draft_expires_at: expiresAt.toISOString(),
        package_id: trip.id,
        promotion_id: snapshot.promotion?.id ?? null,
        package_name_snapshot: trip.name,
        promotion_name_snapshot: snapshot.promotion?.name ?? null,
        unit_price_snapshot: snapshot.unitPrice,
        price_unit_snapshot: trip.price_unit,
        subtotal_amount_snapshot: snapshot.subtotalAmount,
        discount_snapshot: snapshot.discountAmount,
        traveler_count: input.travelerCount,
        total_amount_snapshot: snapshot.totalAmount,
        currency_snapshot: trip.currency,
        price_version_at: priceVersionAt(
          trip.updated_at,
          snapshot.promotion,
        ),
        departure_option_snapshot: selectedDeparture,
      })
      .select("id")
      .single();

    if (insertError?.code === "23505") continue;
    if (insertError || !inserted) throw new BookingDraftError("unexpected");

    const { error: eventError } = await client.from("booking_events").insert({
      booking_id: inserted.id,
      event_type: "draft_created",
      from_status: null,
      to_status: "draft",
      actor_type: "system",
      actor_id: null,
      metadata: { expires_at: expiresAt.toISOString() },
    });

    if (eventError) {
      await client.from("bookings").delete().eq("id", inserted.id);
      throw new BookingDraftError("unexpected");
    }

    return { token };
  }

  throw new BookingDraftError("unexpected");
}

async function expireDraft(id: string) {
  const client = createAdminClient();
  const { data, error } = await client
    .from("bookings")
    .update({ status: "expired" })
    .eq("id", id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error) throw new BookingDraftError("unexpected");
  if (!data) return;

  const { error: eventError } = await client.from("booking_events").insert({
    booking_id: id,
    event_type: "draft_expired",
    from_status: "draft",
    to_status: "expired",
    actor_type: "system",
    actor_id: null,
    metadata: {},
  });
  if (eventError) {
    await client
      .from("bookings")
      .update({ status: "draft" })
      .eq("id", id)
      .eq("status", "expired");
    throw new BookingDraftError("unexpected");
  }
}

export async function getBookingDraftByToken(
  rawToken: string,
): Promise<BookingDraftSummary | null> {
  const parsedToken = publicBookingTokenSchema.safeParse(rawToken);
  if (!parsedToken.success) return null;

  const client = createAdminClient();
  const { data, error } = await client
    .from("bookings")
    .select(
      "id,booking_code,status,draft_expires_at,package_id,package_name_snapshot,promotion_name_snapshot,unit_price_snapshot,price_unit_snapshot,subtotal_amount_snapshot,discount_snapshot,traveler_count,total_amount_snapshot,currency_snapshot,departure_option_snapshot",
    )
    .eq("public_token_hash", hashToken(parsedToken.data))
    .maybeSingle();

  if (error) throw new BookingDraftError("unexpected");
  const parsedBooking = bookingRowSchema.safeParse(data);
  if (!parsedBooking.success) return null;

  const booking = parsedBooking.data;
  let status: BookingDraftSummary["status"] =
    booking.status === "draft" ? "draft" : "unavailable";

  if (
    booking.status === "expired" ||
    (booking.status === "draft" &&
      new Date(booking.draft_expires_at).getTime() <= Date.now())
  ) {
    if (booking.status === "draft") await expireDraft(booking.id);
    status = "expired";
  }

  const [tripResult, destinationResult] = await Promise.all([
    client.from("trips").select("slug").eq("id", booking.package_id).maybeSingle(),
    client
      .from("trip_destinations")
      .select("destination:destinations(name)")
      .eq("trip_id", booking.package_id)
      .limit(1)
      .maybeSingle(),
  ]);

  const destinationData = destinationResult.data?.destination;
  const destination =
    Array.isArray(destinationData) ? destinationData[0] : destinationData;

  return {
    id: booking.id,
    bookingCode: booking.booking_code,
    status,
    expiresAt: booking.draft_expires_at,
    packageId: booking.package_id,
    packageSlug:
      typeof tripResult.data?.slug === "string" ? tripResult.data.slug : null,
    packageName: booking.package_name_snapshot,
    destinationName:
      destination &&
      typeof destination === "object" &&
      "name" in destination &&
      typeof destination.name === "string"
        ? destination.name
        : null,
    promotionName: booking.promotion_name_snapshot,
    unitPrice: booking.unit_price_snapshot,
    priceUnit: booking.price_unit_snapshot,
    subtotalAmount: booking.subtotal_amount_snapshot,
    discountAmount: booking.discount_snapshot,
    travelerCount: booking.traveler_count,
    totalAmount: booking.total_amount_snapshot,
    currency: booking.currency_snapshot,
    departureOption: booking.departure_option_snapshot,
  };
}
