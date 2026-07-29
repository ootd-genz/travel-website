import type { Metadata } from "next";
import type { ReactNode } from "react";

import { logoutAdmin } from "@/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage("/admin");

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <p className="font-semibold">Dashboard Admin</p>
            <p className="text-xs text-muted-foreground">{admin.displayName}</p>
          </div>
          <form action={logoutAdmin}>
            <Button type="submit" variant="outline" size="sm">
              Keluar
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
