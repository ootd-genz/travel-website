import { ExternalLink, LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAdmin } from "@/actions/admin-auth";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/require-admin";

import {
  DesktopAdminNavigation,
  MobileAdminNavigation,
} from "./_components/admin-navigation";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage("/admin");

  return (
    <div className="min-h-screen bg-muted/45 lg:grid lg:grid-cols-[18rem_1fr]">
      <a className="skip-link" href="#admin-main-content">
        Lewati ke konten admin
      </a>

      <aside className="hidden min-h-screen border-r bg-card lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b px-5 py-5">
          <div className="flex items-center gap-3">
            <BrandLogo className="size-12" priority />
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">Travel Bali</p>
              <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Admin console
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <DesktopAdminNavigation />
        </div>

        <div className="border-t p-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between rounded-lg border bg-background px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
          >
            Lihat website
            <ExternalLink className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-lg">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <MobileAdminNavigation />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  Dashboard Admin
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Masuk sebagai {admin.displayName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
                <Link href="/" target="_blank">
                  Lihat situs
                  <ExternalLink className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <form action={logoutAdmin}>
                <Button type="submit" variant="outline" size="sm">
                  <LogOut className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Keluar</span>
                  <span className="sr-only sm:hidden">Keluar</span>
                </Button>
              </form>
            </div>
          </div>
        </header>

        <main
          id="admin-main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[100rem] px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-8 xl:px-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
