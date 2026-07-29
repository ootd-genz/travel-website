import { Compass } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/activities", label: "Activities" },
  { href: "/destination", label: "Destination" },
  { href: "/trip-types", label: "Trip Types" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-semibold tracking-tight"
          aria-label="Travel Website — kembali ke Home"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Compass className="size-5" aria-hidden="true" />
          </span>
          <span>Travel Website</span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => (
              <li key={item.href}>
                <Button asChild variant="ghost" size="sm">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        <Button asChild size="sm">
          <Link href="/destination">Mulai Jelajah</Link>
        </Button>
      </div>
      <nav
        aria-label="Navigasi utama mobile"
        className="overflow-x-auto border-t md:hidden"
      >
        <ul className="mx-auto flex w-max min-w-full items-center justify-center gap-1 px-4 py-2">
          {navigation.map((item) => (
            <li key={item.href}>
              <Button asChild variant="ghost" size="sm">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
