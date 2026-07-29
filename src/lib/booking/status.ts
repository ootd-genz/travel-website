import {
  type BookingStatus,
  type BookingTransitionAction,
} from "@/types/booking";

export const BOOKING_TRANSITION_TARGETS: Record<
  BookingTransitionAction,
  BookingStatus
> = {
  confirm: "confirmed",
  reject: "payment_rejected",
  cancel: "cancelled",
  complete: "completed",
};

const ALLOWED_ACTIONS: Record<BookingStatus, BookingTransitionAction[]> = {
  draft: [],
  waiting_verification: ["confirm", "reject", "cancel"],
  confirmed: ["complete"],
  payment_rejected: [],
  cancelled: [],
  completed: [],
  expired: [],
};

export function getAllowedBookingTransitions(
  status: BookingStatus,
): BookingTransitionAction[] {
  return ALLOWED_ACTIONS[status];
}

export function canTransitionBooking(
  status: BookingStatus,
  action: BookingTransitionAction,
) {
  return ALLOWED_ACTIONS[status].includes(action);
}
