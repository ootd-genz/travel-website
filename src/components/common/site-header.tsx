import { Compass } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SiteNavigation } from "@/components/common/site-navigation";

export function SiteHeader({
  brandName,
  logoUrl,
}: {
  brandName: string;
  logoUrl: string | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-w-0 items-center gap-2.5 font-bold tracking-tight"
          aria-label={`${brandName} — kembali ke Home`}
        >
          <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground shadow-sm">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <Compass className="size-5" aria-hidden="true" />
            )}
          </span>
          <span className="truncate">{brandName}</span>
        </Link>

        <SiteNavigation brandName={brandName} />
      </div>
    </header>
  );
}
