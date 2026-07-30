import Link from "next/link";

import { BrandLogo } from "@/components/common/brand-logo";
import { SiteNavigation } from "@/components/common/site-navigation";

export function SiteHeader({ brandName }: { brandName: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-w-0 items-center gap-2.5 font-bold tracking-tight"
          aria-label={`${brandName} — kembali ke Home`}
        >
          <BrandLogo className="size-12" priority />
          <span className="truncate">{brandName}</span>
        </Link>

        <SiteNavigation brandName={brandName} />
      </div>
    </header>
  );
}
