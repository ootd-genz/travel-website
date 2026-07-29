import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSiteSettings } from "@/lib/cms/queries";

import { SettingsEditor } from "./_components/settings-editor";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [settings, params] = await Promise.all([getSiteSettings(), searchParams]);
  return <div className="grid gap-6"><div><h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1><p className="mt-1 text-sm text-muted-foreground">Kelola branding, footer, rekening pembayaran, dan kontak operasional non-secret.</p></div>{params.saved ? <Alert className="border-primary/30 bg-primary/5"><AlertTitle>Pengaturan tersimpan</AlertTitle><AlertDescription>Perubahan telah dicatat dalam audit CMS.</AlertDescription></Alert> : null}<SettingsEditor settings={settings} /></div>;
}
