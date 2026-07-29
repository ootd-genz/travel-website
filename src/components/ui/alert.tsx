import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="alert" className={cn("rounded-lg border bg-card p-4 text-sm", className)} {...props} />;
}

function AlertTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("mb-1 font-medium", className)} {...props} />;
}

function AlertDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-muted-foreground", className)} {...props} />;
}

export { Alert, AlertDescription, AlertTitle };
