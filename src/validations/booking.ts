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

const optionalTrimmedText = (maximum: number, message: string) =>
  z
    .string()
    .trim()
    .max(maximum, message)
    .transform((value) => value || null);

export function normalizeCustomerWhatsapp(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, "");
  if (!/^\+?\d+$/.test(compact)) return null;

  let digits = compact.replace(/^\+/, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;

  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

function normalizeMoney(value: string) {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;

  const [whole, fraction = ""] = normalized.split(".");
  const canonicalWhole = whole.replace(/^0+(?=\d)/, "");
  return `${canonicalWhole}.${fraction.padEnd(2, "0")}`;
}

function normalizeTransferredAt(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) return null;

  const parsed = new Date(`${normalized}:00+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export const submitBookingSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Masukkan nama lengkap sesuai identitas pemesan.")
    .max(100, "Nama lengkap maksimal 100 karakter."),
  customerWhatsapp: z
    .string()
    .transform(normalizeCustomerWhatsapp)
    .pipe(
      z
        .string({
          required_error:
            "Masukkan nomor WhatsApp aktif agar kami mudah menghubungimu.",
          invalid_type_error:
            "Masukkan nomor WhatsApp aktif agar kami mudah menghubungimu.",
        })
        .regex(
          /^[1-9]\d{7,14}$/,
          "Masukkan nomor WhatsApp aktif agar kami mudah menghubungimu.",
        ),
    ),
  customerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Masukkan alamat email yang valid.")
    .max(254, "Alamat email maksimal 254 karakter."),
  customerCity: optionalTrimmedText(
    100,
    "Kota domisili maksimal 100 karakter.",
  ),
  participantNames: z
    .array(
      z
        .string()
        .trim()
        .min(2, "Nama peserta minimal 2 karakter.")
        .max(100, "Nama peserta maksimal 100 karakter."),
    )
    .min(1, "Masukkan nama setiap peserta.")
    .max(1_000, "Jumlah peserta melebihi batas yang diperbolehkan."),
  senderBankName: optionalTrimmedText(
    100,
    "Nama bank pengirim maksimal 100 karakter.",
  ),
  senderAccountName: z
    .string()
    .trim()
    .min(2, "Masukkan nama pemilik rekening pengirim.")
    .max(100, "Nama pemilik rekening maksimal 100 karakter."),
  declaredTransferAmount: z
    .string()
    .transform(normalizeMoney)
    .pipe(
      z.string({
        required_error: "Masukkan nominal yang sudah ditransfer.",
        invalid_type_error: "Masukkan nominal transfer dalam format angka.",
      }),
    ),
  transferredAt: z
    .string()
    .transform((value, context) => {
      const normalized = normalizeTransferredAt(value);
      if (value.trim() && !normalized) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Masukkan waktu transfer yang valid.",
        });
        return z.NEVER;
      }
      return normalized;
    }),
  customerNotes: optionalTrimmedText(
    2_000,
    "Catatan khusus maksimal 2.000 karakter.",
  ),
  consentDataIsCorrect: z.literal("on", {
    errorMap: () => ({
      message: "Konfirmasi bahwa data yang kamu isi sudah benar.",
    }),
  }),
  consentPaymentRequiresVerification: z.literal("on", {
    errorMap: () => ({
      message:
        "Konfirmasi bahwa pemesanan menunggu verifikasi pembayaran admin.",
    }),
  }),
});
