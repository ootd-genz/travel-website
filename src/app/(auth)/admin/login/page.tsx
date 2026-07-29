import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSafeAdminRedirect } from "@/lib/auth/redirects";
import { getAdminIdentity } from "@/lib/auth/require-admin";

import { LoginForm } from "./_components/login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ loggedOut?: string; next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = getSafeAdminRedirect(params.next);
  const identity = await getAdminIdentity();

  if (identity.status === "admin") {
    redirect(nextPath);
  }

  if (identity.status === "forbidden") {
    redirect("/admin/forbidden");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <CardTitle>Login Admin</CardTitle>
          <CardDescription>
            Masuk menggunakan satu akun admin yang telah disetujui.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {params.loggedOut === "1" ? (
            <p
              className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-sm"
              role="status"
            >
              Kamu sudah keluar dari dashboard.
            </p>
          ) : null}
          <LoginForm nextPath={nextPath} />
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Kembali ke Home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
