"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { lazy, Suspense, useState } from "react";

import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SiteMobileMenu = lazy(() =>
  import("@/components/common/site-mobile-menu").then((module) => ({
    default: module.SiteMobileMenu,
  })),
);

const navigation = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/activities", label: "Activities" },
  { href: "/destination", label: "Destination" },
  { href: "/trip-types", label: "Trip Types" },
] as const;

function isActivePath(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNavigation({ brandName }: { brandName: string }) {
  const pathname = usePathname();
  const [hasLoadedMobileMenu, setHasLoadedMobileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function openMobileMenu() {
    setHasLoadedMobileMenu(true);
    setIsMobileMenuOpen(true);
  }

  function handleMobileMenuOpenChange(open: boolean) {
    setIsMobileMenuOpen(open);
    if (!open) {
      window.requestAnimationFrame(() => {
        document.getElementById("site-mobile-menu-trigger")?.focus();
      });
    }
  }

  return (
    <>
      <nav aria-label="Navigasi utama" className="hidden lg:block">
        <ul className="flex items-center gap-1">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={
                  isActivePath(pathname, item.href) ? "page" : undefined
                }
                className={cn(
                  "inline-flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActivePath(pathname, item.href) &&
                    "bg-secondary text-secondary-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/trips">Lihat Paket</Link>
        </Button>
        <Button
          id="site-mobile-menu-trigger"
          type="button"
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label="Buka menu navigasi"
          aria-haspopup="dialog"
          aria-expanded={isMobileMenuOpen}
          aria-controls="site-mobile-menu"
          onClick={openMobileMenu}
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
        {hasLoadedMobileMenu ? (
          <Suspense fallback={null}>
            <SiteMobileMenu
              brandName={brandName}
              navigation={navigation}
              pathname={pathname}
              open={isMobileMenuOpen}
              onOpenChange={handleMobileMenuOpenChange}
            />
          </Suspense>
        ) : null}
      </div>
    </>
  );
}
