"use server";

import { redirect } from "next/navigation";

import {
  BookingDraftError,
  createBookingDraft,
} from "@/lib/booking/drafts";
import { createBookingDraftSchema } from "@/validations/booking";

export type BookingDraftActionState = {
  message: string | null;
  fieldErrors: Partial<
    Record<"travelerCount" | "departureOption", string[]>
  >;
};

export async function createBookingDraftAction(
  _previousState: BookingDraftActionState,
  formData: FormData,
): Promise<BookingDraftActionState> {
  const parsed = createBookingDraftSchema.safeParse({
    tripId: formData.get("tripId"),
    travelerCount: formData.get("travelerCount"),
    departureOption: formData.get("departureOption"),
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      message: "Periksa kembali pilihan pemesananmu.",
      fieldErrors: {
        travelerCount: errors.travelerCount,
        departureOption: errors.departureOption,
      },
    };
  }

  let token: string;

  try {
    const result = await createBookingDraft(parsed.data);
    token = result.token;
  } catch (error) {
    if (error instanceof BookingDraftError) {
      if (error.code === "invalid_traveler_count") {
        return {
          message: "Jumlah traveler tidak sesuai kapasitas paket.",
          fieldErrors: {
            travelerCount: [
              "Pilih jumlah traveler dalam rentang yang tersedia.",
            ],
          },
        };
      }
      if (error.code === "invalid_departure_option") {
        return {
          message: "Opsi keberangkatan tidak lagi tersedia.",
          fieldErrors: {
            departureOption: [
              "Pilih kembali opsi keberangkatan yang tersedia.",
            ],
          },
        };
      }
      if (error.code === "package_unavailable") {
        return {
          message:
            "Paket ini tidak lagi tersedia. Silakan pilih paket aktif lainnya.",
          fieldErrors: {},
        };
      }
    }

    return {
      message:
        "Ada kendala saat membuat sesi pemesanan. Coba lagi beberapa saat.",
      fieldErrors: {},
    };
  }

  redirect(`/booking/${token}`);
}
