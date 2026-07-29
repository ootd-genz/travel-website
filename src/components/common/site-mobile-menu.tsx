"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavigationItem = {
  href: string;
  label: string;
};

function isActivePath(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteMobileMenu({
  brandName,
  navigation,
  pathname,
  open,
  onOpenChange,
}: {
  brandName: string;
  navigation: readonly NavigationItem[];
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id="site-mobile-menu"
        className="flex flex-col"
        aria-describedby="site-mobile-menu-description"
      >
        <SheetTitle>{brandName}</SheetTitle>
        <p
          id="site-mobile-menu-description"
          className="mt-1 text-sm text-muted-foreground"
        >
          Temukan perjalanan yang paling sesuai dengan ceritamu.
        </p>
        <nav aria-label="Navigasi utama mobile" className="mt-8">
          <ul className="grid gap-2">
            {navigation.map((item) => (
              <li key={item.href}>
                <SheetClose asChild>
                  <Link
                    href={item.href}
                    aria-current={
                      isActivePath(pathname, item.href) ? "page" : undefined
                    }
                    className={cn(
                      "flex min-h-11 items-center rounded-lg px-4 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActivePath(pathname, item.href) &&
                        "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </SheetClose>
              </li>
            ))}
          </ul>
        </nav>
        <SheetClose asChild>
          <Button asChild className="mt-auto">
            <Link href="/trips">Jelajahi Semua Paket</Link>
          </Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
