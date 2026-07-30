import { FilePlus2, Search } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCmsList, getCmsRecord, getCmsRelationOptions } from "@/lib/cms/queries";
import type { CmsResource } from "@/types/cms";

import { CmsForm } from "./cms-form";
import { DeleteResourceButton } from "./delete-resource-button";
import { PromoCodeCreateCard } from "./promo-code-create-card";

const labels: Record<CmsResource, { title: string; singular: string; description: string }> = {
  trips: { title: "Paket Travel", singular: "Paket", description: "Kelola harga, itinerary, relasi, kurasi Home, dan publikasi paket." },
  destinations: { title: "Destinasi", singular: "Destinasi", description: "Kelola informasi destinasi, lokasi, media, dan status publikasi." },
  activities: { title: "Aktivitas", singular: "Aktivitas", description: "Kelola pengalaman, durasi, tingkat kesulitan, dan kurasi Home." },
  "trip-types": { title: "Trip Types", singular: "Trip Type", description: "Kelola kategori gaya perjalanan dan urutan tampil." },
  blog: { title: "Blog", singular: "Artikel", description: "Tulis artikel aman, hubungkan konten terkait, lalu publish ketika siap." },
  promotions: { title: "Promo", singular: "Promo", description: "Atur diskon, periode aktif, dan paket target tanpa menumpuk promo." },
};

function statusLabel(status: string) {
  return { draft: "Draft", published: "Published", archived: "Archived", active: "Aktif", inactive: "Nonaktif" }[status] ?? status;
}

function jakartaDateTimeInput(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

export async function CmsListPage({ resource, searchParams }: { resource: CmsResource; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const [items, relationOptions] = await Promise.all([
    getCmsList(resource, query),
    resource === "promotions" ? getCmsRelationOptions() : Promise.resolve(null),
  ]);
  const label = labels[resource];
  const now = new Date();
  const defaultPromoEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000);

  return <div className="grid gap-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold tracking-tight">{label.title}</h1><p className="mt-1 text-sm text-muted-foreground">{label.description}</p></div><Button asChild><Link href={`/admin/${resource}/new`}><FilePlus2 className="size-4" aria-hidden="true" />Tambah {label.singular}</Link></Button></div>
    {params.saved ? <Alert className="border-primary/30 bg-primary/5"><AlertTitle>Perubahan tersimpan</AlertTitle><AlertDescription>Konten dan relasinya sudah diperbarui serta halaman terkait telah dijadwalkan untuk revalidation.</AlertDescription></Alert> : null}
    {params.deleted ? <Alert><AlertTitle>Konten dihapus</AlertTitle><AlertDescription>Record yang tidak memiliki relasi penting berhasil dihapus.</AlertDescription></Alert> : null}
    {resource === "promotions" && relationOptions ? <PromoCodeCreateCard trips={relationOptions.trips} defaultStartsAt={jakartaDateTimeInput(now)} defaultEndsAt={jakartaDateTimeInput(defaultPromoEnd)} /> : null}
    <Card><CardContent className="p-4"><form className="flex gap-2" action={`/admin/${resource}`}><div className="relative flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input name="q" defaultValue={query} className="pl-9" placeholder={`Cari ${label.title.toLowerCase()}...`} /></div><Button type="submit" variant="outline">Cari</Button></form></CardContent></Card>
    <Card>{items.length === 0 ? <CardContent className="flex min-h-56 flex-col items-center justify-center text-center"><p className="font-medium">Belum ada {label.title.toLowerCase()} yang cocok.</p><p className="mt-1 text-sm text-muted-foreground">Buat konten baru atau ubah kata kunci pencarian.</p><Button asChild className="mt-4" variant="outline"><Link href={`/admin/${resource}/new`}>Tambah {label.singular}</Link></Button></CardContent> : <Table><TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Status</TableHead><TableHead>Detail</TableHead><TableHead>Diperbarui</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell className="font-medium">{item.title}</TableCell><TableCell><Badge variant={item.status === "published" || item.status === "active" ? "default" : item.status === "archived" ? "outline" : "secondary"}>{statusLabel(item.status)}</Badge></TableCell><TableCell className="max-w-56 truncate text-muted-foreground">{item.detail}</TableCell><TableCell className="whitespace-nowrap text-muted-foreground">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.updatedAt))}</TableCell><TableCell><div className="flex items-center justify-end gap-2"><Button asChild variant="outline" size="sm"><Link href={`/admin/${resource}/${item.id}`}>Edit</Link></Button><DeleteResourceButton id={item.id} name={item.title} resource={resource} /></div></TableCell></TableRow>)}</TableBody></Table>}</Card>
  </div>;
}

export async function CmsEditorPage({ resource, id }: { resource: CmsResource; id?: string }) {
  const [record, options] = await Promise.all([id ? getCmsRecord(resource, id) : Promise.resolve(null), getCmsRelationOptions()]);
  if (id && !record) notFound();
  const label = labels[resource];
  return <div className="grid gap-6"><div><Button asChild variant="ghost" size="sm" className="mb-3 -ml-3"><Link href={`/admin/${resource}`}>← Kembali ke {label.title}</Link></Button><h1 className="text-2xl font-bold tracking-tight">{id ? `Edit ${label.singular}` : `Tambah ${label.singular}`}</h1><p className="mt-1 text-sm text-muted-foreground">Simpan sebagai Draft sampai konten, relasi, media, dan SEO siap dipublikasikan.</p></div><CmsForm resource={resource} record={record} options={options} /></div>;
}
