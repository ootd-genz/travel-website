import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function Page() {
  await requireAdmin();
  return <div className="grid gap-6"><div><h1 className="text-2xl font-bold tracking-tight">Pemesanan</h1><p className="mt-1 text-sm text-muted-foreground">Area operasional booking.</p></div><Card><CardHeader><CardTitle>Management booking tersedia pada Phase 8</CardTitle><CardDescription>Table booking, filter, signed URL bukti transfer, status transition, dan audit booking sengaja tidak dicampur ke scope CMS Phase 4.</CardDescription></CardHeader></Card></div>;
}
