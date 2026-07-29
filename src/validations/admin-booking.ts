import { z } from "zod";

import {
  BOOKING_STATUSES,
  BOOKING_TRANSITION_ACTIONS,
} from "@/types/booking";

const dateInputSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  });

export const adminBookingFiltersSchema = z
  .object({
    q: z.string().trim().max(100).default(""),
    status: z.enum(BOOKING_STATUSES).or(z.literal("")).default(""),
    packageId: z.string().uuid().or(z.literal("")).default(""),
    from: dateInputSchema.or(z.literal("")).default(""),
    to: dateInputSchema.or(z.literal("")).default(""),
    page: z.coerce.number().int().min(1).max(10_000).default(1),
  })
  .superRefine((value, context) => {
    if (value.from && value.to && value.from > value.to) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "Tanggal akhir tidak boleh sebelum tanggal awal.",
      });
    }
  });

export type AdminBookingFilters = z.infer<typeof adminBookingFiltersSchema>;

export const bookingTransitionSchema = z
  .object({
    bookingId: z.string().uuid("ID booking tidak valid."),
    action: z.enum(BOOKING_TRANSITION_ACTIONS),
    reason: z.string().trim().max(2_000).default(""),
  })
  .superRefine((value, context) => {
    if (
      (value.action === "reject" || value.action === "cancel") &&
      value.reason.length < 3
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "Tuliskan alasan minimal 3 karakter.",
      });
    }
  });

export const bookingAdminNotesSchema = z.object({
  bookingId: z.string().uuid("ID booking tidak valid."),
  adminNotes: z.string().trim().max(4_000),
});

export const retryWhatsAppNotificationSchema = z.object({
  bookingId: z.string().uuid("ID booking tidak valid."),
});
