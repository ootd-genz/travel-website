import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getHomepageContent } from "@/lib/cms/queries";

import { HomeEditor } from "./_components/home-editor";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ homepage, uspItems }, params] = await Promise.all([getHomepageContent(), searchParams]);
  return <div className="grid gap-6"><div><h1 className="text-2xl font-bold tracking-tight">Halaman Home</h1><p className="mt-1 text-sm text-muted-foreground">Kelola hero, visibilitas section, dan USP tanpa menduplikasi paket atau entitas katalog.</p></div>{params.saved || params.uspSaved || params.uspDeleted ? <Alert className="border-primary/30 bg-primary/5"><AlertTitle>Perubahan tersimpan</AlertTitle><AlertDescription>Konten Home sudah diperbarui dan cache halaman publik direvalidasi.</AlertDescription></Alert> : null}<HomeEditor homepage={homepage} uspItems={uspItems} /></div>;
}
