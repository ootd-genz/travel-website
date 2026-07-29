import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BOOKING_STATUS_LABELS,
  type BookingStatus,
} from "@/types/booking";

const statusClasses: Record<BookingStatus, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  waiting_verification:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  confirmed:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
  payment_rejected:
    "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200",
  cancelled: "border-border bg-muted text-muted-foreground",
  completed:
    "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-200",
  expired: "border-border bg-muted text-muted-foreground",
};

export function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(statusClasses[status], className)}>
      {BOOKING_STATUS_LABELS[status]}
    </Badge>
  );
}
