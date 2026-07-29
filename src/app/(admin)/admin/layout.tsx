import type { Metadata } from "next";
import type { ReactNode } from "react";

import { logoutAdmin } from "@/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/require-admin";

import { DesktopAdminNavigation, MobileAdminNavigation } from "./_components/admin-navigation";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage("/admin");

  return (
    <div className="min-h-screen bg-muted/40 lg:grid lg:grid-cols-[16rem_1fr]">
      <a className="skip-link" href="#admin-main-content">
        Lewati ke konten admin
      </a>
      <aside className="hidden min-h-screen border-r bg-background p-4 lg:sticky lg:top-0 lg:block lg:h-screen">
        <div className="mb-6 px-3 py-2">
          <p className="font-semibold">Travel Bali</p>
          <p className="text-xs text-muted-foreground">Content Management</p>
        </div>
        <DesktopAdminNavigation />
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <MobileAdminNavigation />
              <div>
                <p className="font-semibold">Dashboard Admin</p>
                <p className="text-xs text-muted-foreground">{admin.displayName}</p>
              </div>
            </div>
            <form action={logoutAdmin}>
              <Button type="submit" variant="outline" size="sm">Keluar</Button>
            </form>
          </div>
        </header>
        <main
          id="admin-main-content"
          tabIndex={-1}
          className="px-4 py-8 outline-none sm:px-6 lg:px-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
