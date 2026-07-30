import { ShieldX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { logoutAdmin } from "@/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Akses Ditolak",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldX className="size-5" aria-hidden="true" />
          </div>
          <h1 className="font-semibold leading-none tracking-tight">
            Akses admin ditolak
          </h1>
          <CardDescription>
            Sesi ini valid, tetapi akun tidak terdaftar sebagai admin aktif.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form action={logoutAdmin}>
            <Button className="w-full" type="submit">
              Keluar dari sesi ini
            </Button>
          </form>
          <Button asChild className="w-full" variant="outline">
            <Link href="/">Kembali ke Home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
