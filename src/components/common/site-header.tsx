"use client";

import { Compass, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/activities", label: "Activities" },
  { href: "/destination", label: "Destination" },
  { href: "/trip-types", label: "Trip Types" },
] as const;

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ brandName, logoUrl }: { brandName: string; logoUrl: string | null }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex min-w-0 items-center gap-2.5 font-bold tracking-tight" aria-label={`${brandName} — kembali ke Home`}>
          <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground shadow-sm">
            {logoUrl ? <Image src={logoUrl} alt="" fill sizes="40px" className="object-cover" /> : <Compass className="size-5" aria-hidden="true" />}
          </span>
          <span className="truncate">{brandName}</span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => <li key={item.href}><Link href={item.href} aria-current={isActivePath(pathname, item.href) ? "page" : undefined} className={cn("inline-flex h-10 items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isActivePath(pathname, item.href) && "bg-secondary text-secondary-foreground")}>{item.label}</Link></li>)}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex"><Link href="/trips">Lihat Paket</Link></Button>
          <Sheet>
            <SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden" aria-label="Buka menu navigasi"><Menu className="size-5" aria-hidden="true" /></Button></SheetTrigger>
            <SheetContent className="flex flex-col">
              <SheetTitle>{brandName}</SheetTitle>
              <p className="mt-1 text-sm text-muted-foreground">Temukan perjalanan yang paling sesuai dengan ceritamu.</p>
              <nav aria-label="Navigasi utama mobile" className="mt-8">
                <ul className="grid gap-2">
                  {navigation.map((item) => <li key={item.href}><SheetClose asChild><Link href={item.href} aria-current={isActivePath(pathname, item.href) ? "page" : undefined} className={cn("flex min-h-11 items-center rounded-lg px-4 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isActivePath(pathname, item.href) && "bg-secondary text-secondary-foreground")}>{item.label}</Link></SheetClose></li>)}
                </ul>
              </nav>
              <SheetClose asChild><Button asChild className="mt-auto"><Link href="/trips">Jelajahi Semua Paket</Link></Button></SheetClose>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
