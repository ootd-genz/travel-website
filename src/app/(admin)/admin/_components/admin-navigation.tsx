"use client";

import {
  BadgePercent,
  BookOpenText,
  Boxes,
  ClipboardList,
  FileText,
  House,
  LayoutDashboard,
  MapPinned,
  Menu,
  Settings,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigationSections = [
  {
    label: "Ringkasan",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Operasional",
    items: [
      { href: "/admin/bookings", label: "Pemesanan", icon: ClipboardList },
    ],
  },
  {
    label: "Konten",
    items: [
      { href: "/admin/trips", label: "Paket Travel", icon: Boxes },
      { href: "/admin/destinations", label: "Destinasi", icon: MapPinned },
      { href: "/admin/activities", label: "Aktivitas", icon: Sparkles },
      { href: "/admin/trip-types", label: "Trip Types", icon: BookOpenText },
      { href: "/admin/blog", label: "Blog", icon: FileText },
      { href: "/admin/promotions", label: "Promo", icon: BadgePercent },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/admin/home", label: "Halaman Home", icon: House },
      { href: "/admin/settings", label: "Pengaturan", icon: Settings },
    ],
  },
] as const;

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi admin" className="grid gap-5">
      {navigationSections.map((section) => (
        <div key={section.label} className="grid gap-1.5">
          <p className="px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
            {section.label}
          </p>
          <div className="grid gap-1">
            {section.items.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/admin" ? pathname === href : pathname.startsWith(href);
              const link = (
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-11 items-center gap-3 rounded-lg border px-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary/15 bg-primary/10 text-primary"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-md transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  {label}
                </Link>
              );

              return mobile ? (
                <SheetClose asChild key={href}>
                  {link}
                </SheetClose>
              ) : (
                <div key={href}>{link}</div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function DesktopAdminNavigation() {
  return <NavigationLinks />;
}

export function MobileAdminNavigation() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Buka menu admin"
          className="lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <div className="flex items-center gap-3 border-b pb-5">
          <BrandLogo className="size-11" priority />
          <div>
            <SheetTitle>Travel Bali</SheetTitle>
            <p className="text-xs text-muted-foreground">Admin console</p>
          </div>
        </div>
        <div className="mt-6">
          <NavigationLinks mobile />
        </div>
      </SheetContent>
    </Sheet>
  );
}
