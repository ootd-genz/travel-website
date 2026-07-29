"use client";

import { useActionState } from "react";

import { deleteUspItem, saveHomepageContent, saveUspItem } from "@/actions/admin-cms";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_CMS_ACTION_STATE } from "@/types/cms";

type RecordData = Record<string, unknown>;
const text = (record: RecordData | null, key: string, fallback = "") => typeof record?.[key] === "string" ? String(record[key]) : fallback;
const bool = (record: RecordData | null, key: string, fallback = false) => typeof record?.[key] === "boolean" ? Boolean(record[key]) : fallback;

export function HomeEditor({ homepage, uspItems }: { homepage: RecordData | null; uspItems: RecordData[] }) {
  const [state, action, pending] = useActionState(saveHomepageContent, INITIAL_CMS_ACTION_STATE);
  const visibility = homepage?.section_visibility && typeof homepage.section_visibility === "object" ? homepage.section_visibility as Record<string, unknown> : {};
  const sections = [
    ["booking", "Booking/Search"], ["popular", "Popular Package"], ["usp", "USP"], ["featured", "Featured Trips"],
    ["deals", "Deals & Discounts"], ["destinations", "Popular Destinations"], ["activities", "Browse Activities"], ["blog", "Blog"],
  ];
  return <div className="grid gap-6">
    <form action={action} encType="multipart/form-data" className="grid gap-6">
      {state.message ? <Alert className="border-destructive/40"><AlertTitle>Belum tersimpan</AlertTitle><AlertDescription>{state.message}</AlertDescription></Alert> : null}
      <Card><CardHeader><CardTitle>Hero Home</CardTitle><CardDescription>Konten unik Home; paket dan entitas curated tetap berasal dari tabel utama.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor="heroTitle">Headline</Label><Input id="heroTitle" name="heroTitle" required defaultValue={text(homepage, "hero_title", "Liburan Impian, Lebih Mudah Dimulai di Sini.")} /></div>
        <div className="grid gap-2 sm:col-span-2"><Label htmlFor="heroSubtitle">Subheadline</Label><Textarea id="heroSubtitle" name="heroSubtitle" required defaultValue={text(homepage, "hero_subtitle", "Temukan paket perjalanan pilihan, destinasi memukau, dan aktivitas seru yang sudah kami kurasi.")} /></div>
        <div className="grid gap-2"><Label htmlFor="primaryCtaLabel">CTA utama</Label><Input id="primaryCtaLabel" name="primaryCtaLabel" required defaultValue={text(homepage, "primary_cta_label", "Temukan Perjalananmu")} /></div>
        <div className="grid gap-2"><Label htmlFor="primaryCtaHref">Tujuan CTA utama</Label><Input id="primaryCtaHref" name="primaryCtaHref" required defaultValue={text(homepage, "primary_cta_href", "/trips")} /></div>
        <div className="grid gap-2"><Label htmlFor="secondaryCtaLabel">CTA sekunder</Label><Input id="secondaryCtaLabel" name="secondaryCtaLabel" defaultValue={text(homepage, "secondary_cta_label", "Lihat Paket Favorit")} /></div>
        <div className="grid gap-2"><Label htmlFor="secondaryCtaHref">Tujuan CTA sekunder</Label><Input id="secondaryCtaHref" name="secondaryCtaHref" defaultValue={text(homepage, "secondary_cta_href", "/trips")} /></div>
        <div className="grid gap-2 sm:col-span-2"><Label htmlFor="image">Hero image</Label><Input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" /><input type="hidden" name="imagePath" value={text(homepage, "hero_image_path")} />{text(homepage, "hero_image_path") ? <p className="break-all text-xs text-muted-foreground">Media aktif: {text(homepage, "hero_image_path")}</p> : null}</div>
        <label className="flex items-center gap-3 rounded-lg border p-3 sm:col-span-2"><input type="checkbox" name="isPublished" defaultChecked={bool(homepage, "is_published")} className="size-4 accent-primary" /><span className="text-sm font-medium">Publikasikan konfigurasi Home</span></label>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Visibilitas Section</CardTitle><CardDescription>Sembunyikan section bila kontennya belum siap.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{sections.map(([key, label]) => <label className="flex items-center gap-3 rounded-lg border p-3 text-sm" key={key}><input type="checkbox" name="visibleSections" value={key} defaultChecked={visibility[key] !== false} className="size-4 accent-primary" />{label}</label>)}</CardContent></Card>
      <div className="flex justify-end"><Button disabled={pending}>{pending ? "Menyimpan..." : "Simpan Konten Home"}</Button></div>
    </form>
    <Card><CardHeader><CardTitle>USP / Why Choose Us</CardTitle><CardDescription>Atur judul, ikon, urutan, dan visibility. Item nonaktif tidak tampil publik.</CardDescription></CardHeader><CardContent className="grid gap-5">{uspItems.map((item) => <UspForm item={item} key={String(item.id)} />)}<UspForm item={null} /></CardContent></Card>
  </div>;
}

function UspForm({ item }: { item: RecordData | null }) {
  const [state, action, pending] = useActionState(saveUspItem, INITIAL_CMS_ACTION_STATE);
  const id = text(item, "id");
  return <div className="rounded-lg border p-4"><form action={action} className="grid gap-4 sm:grid-cols-2"><input type="hidden" name="id" value={id} /><div className="grid gap-2"><Label>Judul</Label><Input name="title" required defaultValue={text(item, "title")} /></div><div className="grid gap-2"><Label>Icon key</Label><Input name="iconKey" defaultValue={text(item, "icon_key")} /></div><div className="grid gap-2 sm:col-span-2"><Label>Deskripsi</Label><Textarea name="description" required defaultValue={text(item, "description")} /></div><div className="grid gap-2"><Label>Urutan</Label><Input name="sortOrder" type="number" min="0" required defaultValue={text(item, "sort_order", "0")} /></div><label className="flex items-center gap-3 self-end rounded-lg border p-3 text-sm"><input type="checkbox" name="isActive" defaultChecked={bool(item, "is_active", true)} className="size-4 accent-primary" />Aktif</label>{state.message ? <p className="text-sm text-destructive sm:col-span-2">{state.message}</p> : null}<div className="sm:col-span-2"><Button size="sm" disabled={pending}>{pending ? "Menyimpan..." : id ? "Simpan USP" : "Tambah USP"}</Button></div></form>{id ? <form action={deleteUspItem} className="mt-3"><input type="hidden" name="id" value={id} /><Button type="submit" size="sm" variant="ghost" className="text-destructive">Hapus USP</Button></form> : null}</div>;
}
