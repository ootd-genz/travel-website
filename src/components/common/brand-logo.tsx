import Image from "next/image";

import { cn } from "@/lib/utils";

export const BRAND_LOGO_PATH = "/travel-logo-primary.png";

export function BrandLogo({
  alt = "",
  className,
  priority = false,
}: {
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={BRAND_LOGO_PATH}
      alt={alt}
      width={1254}
      height={1254}
      priority={priority}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
