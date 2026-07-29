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

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Pemesanan", icon: ClipboardList },
  { href: "/admin/trips", label: "Paket Travel", icon: Boxes },
  { href: "/admin/destinations", label: "Destinasi", icon: MapPinned },
  { href: "/admin/activities", label: "Aktivitas", icon: Sparkles },
  { href: "/admin/trip-types", label: "Trip Types", icon: BookOpenText },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/promotions", label: "Promo", icon: BadgePercent },
  { href: "/admin/home", label: "Halaman Home", icon: House },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
] as const;

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi admin" className="grid gap-1">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        const link = (
          <Link
            href={href}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );

        return mobile ? <SheetClose asChild key={href}>{link}</SheetClose> : <div key={href}>{link}</div>;
      })}
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
        <Button variant="outline" size="icon" aria-label="Buka menu admin" className="lg:hidden">
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>Dashboard Admin</SheetTitle>
        <div className="mt-6"><NavigationLinks mobile /></div>
      </SheetContent>
    </Sheet>
  );
}
