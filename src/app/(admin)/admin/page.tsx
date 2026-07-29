import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminPage() {
  const admin = await requireAdmin();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selamat datang, {admin.displayName}</CardTitle>
        <CardDescription>
          Sesi telah diverifikasi terhadap akun Auth dan allowlist admin aktif. Dashboard operasional dilanjutkan pada Phase 4.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
