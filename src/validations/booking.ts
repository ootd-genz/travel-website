import { z } from "zod";

export const createBookingDraftSchema = z.object({
  tripId: z.string().uuid("Paket perjalanan tidak valid."),
  travelerCount: z.coerce
    .number()
    .int("Jumlah traveler harus berupa bilangan bulat.")
    .min(1, "Jumlah traveler minimal 1 orang.")
    .max(1_000, "Jumlah traveler melebihi batas yang diperbolehkan."),
  departureOption: z
    .string()
    .trim()
    .max(200, "Opsi keberangkatan terlalu panjang.")
    .optional()
    .transform((value) => value || null),
});

export const publicBookingTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, "Token booking tidak valid.");
