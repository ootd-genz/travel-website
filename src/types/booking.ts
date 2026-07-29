export const BOOKING_STATUSES = [
  "draft",
  "waiting_verification",
  "confirmed",
  "payment_rejected",
  "cancelled",
  "completed",
  "expired",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  draft: "Draft",
  waiting_verification: "Menunggu Verifikasi",
  confirmed: "Dikonfirmasi",
  payment_rejected: "Bukti Ditolak",
  cancelled: "Dibatalkan",
  completed: "Selesai",
  expired: "Kedaluwarsa",
};

export const BOOKING_TRANSITION_ACTIONS = [
  "confirm",
  "reject",
  "cancel",
  "complete",
] as const;

export type BookingTransitionAction =
  (typeof BOOKING_TRANSITION_ACTIONS)[number];

export const NOTIFICATION_DELIVERY_STATUSES = [
  "pending",
  "sent",
  "failed",
] as const;

export type NotificationDeliveryStatus =
  (typeof NOTIFICATION_DELIVERY_STATUSES)[number];

export type AdminBookingListItem = {
  id: string;
  bookingCode: string;
  customerName: string | null;
  customerWhatsapp: string | null;
  packageName: string;
  departureDate: string | null;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  whatsappNotificationStatus: NotificationDeliveryStatus | null;
  submittedAt: string | null;
  createdAt: string;
};
