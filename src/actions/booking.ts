"use server";

import { redirect } from "next/navigation";

import {
  BookingDraftError,
  createBookingDraft,
} from "@/lib/booking/drafts";
import {
  removeTransferProof,
  TransferProofError,
  uploadTransferProof,
} from "@/lib/booking/proofs";
import {
  getBookingSubmissionContext,
  submitBooking,
} from "@/lib/booking/submissions";
import { sendBookingWaitingVerificationNotification } from "@/lib/notifications/whatsapp/service";
import {
  createBookingDraftSchema,
  publicBookingTokenSchema,
  submitBookingSchema,
} from "@/validations/booking";

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

export type SubmitBookingActionState = {
  message: string | null;
  code:
    | "validation"
    | "expired"
    | "unavailable"
    | "upload_failed"
    | "unexpected"
    | null;
  fieldErrors: Partial<Record<string, string[]>>;
};

function proofErrorMessage(error: TransferProofError) {
  if (error.code === "too_large") {
    return "Ukuran bukti transfer melebihi batas maksimum 5 MiB.";
  }
  if (error.code === "upload_failed") {
    return "Bukti transfer belum berhasil diunggah. Coba lagi beberapa saat.";
  }
  if (error.code === "missing" || error.code === "empty") {
    return "Unggah satu bukti transfer sebelum mengirim pemesanan.";
  }
  return "Unggah bukti transfer JPEG, PNG, atau PDF dengan isi file yang valid.";
}

async function cleanupUploadedProof(path: string) {
  try {
    await removeTransferProof(path);
  } catch (error) {
    console.error("Gagal membersihkan bukti transfer setelah submit.", {
      code: error instanceof Error ? error.name : "unknown",
    });
  }
}

export async function submitBookingAction(
  rawToken: string,
  _previousState: SubmitBookingActionState,
  formData: FormData,
): Promise<SubmitBookingActionState> {
  const parsedToken = publicBookingTokenSchema.safeParse(rawToken);
  if (!parsedToken.success) {
    return {
      message: "Sesi pemesanan tidak valid.",
      code: "unavailable",
      fieldErrors: {},
    };
  }

  let context: Awaited<ReturnType<typeof getBookingSubmissionContext>>;
  try {
    context = await getBookingSubmissionContext(parsedToken.data);
  } catch (error) {
    console.error("Gagal memeriksa draft sebelum submit.", {
      code: error instanceof Error ? error.name : "unknown",
    });
    return {
      message:
        "Ada kendala saat memeriksa sesi pemesanan. Coba lagi beberapa saat.",
      code: "unexpected",
      fieldErrors: {},
    };
  }

  if (!context || context.state === "unavailable") {
    return {
      message: "Draft ini tidak lagi dapat dilanjutkan.",
      code: "unavailable",
      fieldErrors: {},
    };
  }
  if (context.state === "expired") {
    return {
      message:
        "Sesi pemesanan sudah berakhir. Silakan mulai kembali dari halaman paket.",
      code: "expired",
      fieldErrors: {},
    };
  }
  if (context.state === "submitted") {
    redirect(`/booking/${parsedToken.data}/success`);
  }
  if (context.state !== "draft") {
    return {
      message: "Draft ini tidak lagi dapat dilanjutkan.",
      code: "unavailable",
      fieldErrors: {},
    };
  }
  const draftContext = context;

  const parsed = submitBookingSchema.safeParse({
    customerName: formData.get("customerName"),
    customerWhatsapp: formData.get("customerWhatsapp"),
    customerEmail: formData.get("customerEmail"),
    customerCity: formData.get("customerCity"),
    participantNames: formData.getAll("participantNames"),
    senderBankName: formData.get("senderBankName"),
    senderAccountName: formData.get("senderAccountName"),
    declaredTransferAmount: formData.get("declaredTransferAmount"),
    transferredAt: formData.get("transferredAt"),
    customerNotes: formData.get("customerNotes"),
    consentDataIsCorrect: formData.get("consentDataIsCorrect"),
    consentPaymentRequiresVerification: formData.get(
      "consentPaymentRequiresVerification",
    ),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data pemesanan yang kamu isi.",
      code: "validation",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const fieldErrors: Partial<Record<string, string[]>> = {};
  if (parsed.data.participantNames.length !== draftContext.travelerCount) {
    fieldErrors.participantNames = [
      `Masukkan tepat ${draftContext.travelerCount} nama peserta.`,
    ];
  }
  if (
    parsed.data.declaredTransferAmount !== draftContext.totalAmount.toFixed(2)
  ) {
    fieldErrors.declaredTransferAmount = [
      "Nominal transfer harus sama persis dengan total pada ringkasan.",
    ];
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      message: "Periksa kembali detail perjalanan dan nominal transfer.",
      code: "validation",
      fieldErrors,
    };
  }

  const proof = formData.get("transferProof");
  if (!(proof instanceof File)) {
    return {
      message: "Bukti transfer wajib diunggah.",
      code: "validation",
      fieldErrors: {
        transferProof: [
          "Unggah satu bukti transfer sebelum mengirim pemesanan.",
        ],
      },
    };
  }

  let uploadedPath: string;
  try {
    uploadedPath = await uploadTransferProof(draftContext.bookingId, proof);
  } catch (error) {
    const message =
      error instanceof TransferProofError
        ? proofErrorMessage(error)
        : "Bukti transfer belum berhasil diunggah. Coba lagi beberapa saat.";
    return {
      message,
      code:
        error instanceof TransferProofError && error.code === "upload_failed"
          ? "upload_failed"
          : "validation",
      fieldErrors: { transferProof: [message] },
    };
  }

  let outcome: Awaited<ReturnType<typeof submitBooking>>;
  try {
    outcome = await submitBooking({
      rawToken: parsedToken.data,
      ...parsed.data,
      transferProofPath: uploadedPath,
    });
  } catch (error) {
    await cleanupUploadedProof(uploadedPath);
    console.error("Gagal menyimpan booking setelah upload.", {
      code: error instanceof Error ? error.name : "unknown",
    });
    return {
      message:
        "Data pemesanan belum berhasil disimpan. Bukti yang sempat diunggah sudah dibersihkan; silakan coba lagi.",
      code: "unexpected",
      fieldErrors: {},
    };
  }

  if (
    outcome.outcome === "submitted" ||
    outcome.outcome === "already_submitted"
  ) {
    if (outcome.outcome === "already_submitted") {
      await cleanupUploadedProof(uploadedPath);
    } else if (outcome.booking_id) {
      await sendBookingWaitingVerificationNotification(outcome.booking_id);
    }
    redirect(`/booking/${parsedToken.data}/success`);
  }

  await cleanupUploadedProof(uploadedPath);
  if (outcome.outcome === "expired") {
    return {
      message:
        "Sesi pemesanan berakhir saat data dikirim. Mulai kembali agar harga dan ketersediaan diperbarui.",
      code: "expired",
      fieldErrors: {},
    };
  }
  if (outcome.outcome === "amount_mismatch") {
    return {
      message: "Nominal transfer tidak sesuai total snapshot.",
      code: "validation",
      fieldErrors: {
        declaredTransferAmount: [
          "Nominal transfer harus sama persis dengan total pada ringkasan.",
        ],
      },
    };
  }

  return {
    message:
      outcome.outcome === "invalid_payload"
        ? "Data pemesanan tidak dapat diterima. Periksa seluruh field lalu coba lagi."
        : "Draft ini tidak lagi dapat dilanjutkan.",
    code:
      outcome.outcome === "invalid_payload" ? "validation" : "unavailable",
    fieldErrors: {},
  };
}
