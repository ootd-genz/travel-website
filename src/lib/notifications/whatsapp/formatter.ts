export const WHATSAPP_WAITING_VERIFICATION_EVENT =
  "booking_waiting_verification";

export type BookingWaitingVerificationMessage = {
  bookingId: string;
  bookingCode: string;
  customerName: string;
  packageName: string;
  departureDate: string | null;
  travelerCount: number;
  totalAmount: number;
  currency: string;
  appUrl: string;
};

function formatDepartureDate(value: string | null) {
  if (!value) return "Belum dipilih";

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "Belum dipilih";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

function formatTotal(value: number, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function getAdminLink(input: BookingWaitingVerificationMessage) {
  return `${input.appUrl.replace(/\/$/, "")}/admin/bookings/${input.bookingId}`;
}

export function getBookingWaitingVerificationTemplateParameters(
  input: BookingWaitingVerificationMessage,
) {
  return [
    input.customerName,
    input.packageName,
    input.bookingCode,
    formatDepartureDate(input.departureDate),
    String(input.travelerCount),
    formatTotal(input.totalAmount, input.currency),
    getAdminLink(input),
  ];
}

export function formatBookingWaitingVerificationMessage(
  input: BookingWaitingVerificationMessage,
) {
  const [
    customerName,
    packageName,
    bookingCode,
    departureDate,
    travelerCount,
    formattedTotal,
    adminLink,
  ] = getBookingWaitingVerificationTemplateParameters(input);

  return [
    "Pemesanan baru masuk ✈️",
    "",
    `Atas nama: ${customerName}`,
    `sudah memesan: ${packageName}`,
    `Kode booking: ${bookingCode}`,
    `Tanggal keberangkatan: ${departureDate}`,
    `Jumlah traveler: ${travelerCount}`,
    `Total transfer: ${formattedTotal}`,
    "Status: Menunggu verifikasi pembayaran",
    "",
    "Bukti transfer sudah diunggah.",
    "Mohon konfirmasinya melalui dashboard admin.",
    "",
    "Kelola pemesanan:",
    adminLink,
  ].join("\n");
}
