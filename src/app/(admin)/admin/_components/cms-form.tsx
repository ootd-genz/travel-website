"use client";

import { useActionState } from "react";

import { deleteCmsResource, saveCmsResource } from "@/actions/admin-cms";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_CMS_ACTION_STATE, type CmsRelationOptions, type CmsResource } from "@/types/cms";

type CmsRecord = Record<string, unknown>;
type FieldProps = { name: string; label: string; help?: string; errors: Record<string, string[]>; children: React.ReactNode };

function Field({ name, label, help, errors, children }: FieldProps) {
  const messages = errors[name] ?? [];
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
      {messages.map((message) => <p className="text-xs font-medium text-destructive" key={message}>{message}</p>)}
    </div>
  );
}

function stringValue(record: CmsRecord | null, key: string, fallback = "") {
  const candidate = record?.[key];
  return typeof candidate === "string" || typeof candidate === "number" ? String(candidate) : fallback;
}
function booleanValue(record: CmsRecord | null, key: string, fallback = false) {
  return typeof record?.[key] === "boolean" ? record[key] : fallback;
}
function arrayLines(record: CmsRecord | null, key: string) {
  const candidate = record?.[key];
  if (!Array.isArray(candidate)) return "";
  return candidate.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      const object = item as Record<string, unknown>;
      return String(object.title ?? object.question ?? "");
    }
    return "";
  }).filter(Boolean).join("\n");
}
function relationValues(record: CmsRecord | null, key: string, relationKey: string) {
  const candidate = record?.[key];
  if (!Array.isArray(candidate)) return [];
  return candidate.flatMap((item) => item && typeof item === "object" && typeof (item as Record<string, unknown>)[relationKey] === "string" ? [String((item as Record<string, unknown>)[relationKey])] : []);
}
function contentValue(record: CmsRecord | null) {
  const content = record?.content;
  if (content && typeof content === "object" && typeof (content as Record<string, unknown>).text === "string") return String((content as Record<string, unknown>).text);
  return "";
}

function TextField({ name, label, record, dbKey, errors, type = "text", required = false, help, defaultValue, step }: { name: string; label: string; record: CmsRecord | null; dbKey: string; errors: Record<string, string[]>; type?: string; required?: boolean; help?: string; defaultValue?: string; step?: string }) {
  const resolvedValue = stringValue(record, dbKey, defaultValue);
  return <Field name={name} label={label} help={help} errors={errors}><Input id={name} name={name} type={type} step={step} required={required} defaultValue={type === "datetime-local" && resolvedValue ? resolvedValue.slice(0, 16) : resolvedValue} /></Field>;
}
function AreaField({ name, label, record, dbKey, errors, required = false, help, rows = 4, valueOverride }: { name: string; label: string; record: CmsRecord | null; dbKey: string; errors: Record<string, string[]>; required?: boolean; help?: string; rows?: number; valueOverride?: string }) {
  return <Field name={name} label={label} help={help} errors={errors}><Textarea id={name} name={name} required={required} rows={rows} defaultValue={valueOverride ?? stringValue(record, dbKey)} /></Field>;
}
function CheckField({ name, label, record, dbKey, help, fallback = false }: { name: string; label: string; record: CmsRecord | null; dbKey: string; help?: string; fallback?: boolean }) {
  return <label className="flex items-start gap-3 rounded-lg border p-3 text-sm"><input className="mt-0.5 size-4 accent-primary" type="checkbox" name={name} defaultChecked={booleanValue(record, dbKey, fallback)} /><span><span className="font-medium">{label}</span>{help ? <span className="mt-1 block text-xs text-muted-foreground">{help}</span> : null}</span></label>;
}
function StatusField({ record, errors }: { record: CmsRecord | null; errors: Record<string, string[]> }) {
  return <Field name="status" label="Status publikasi" errors={errors}><Select id="status" name="status" defaultValue={stringValue(record, "status", "draft")}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></Field>;
}
function ImageField({ currentPath, errors }: { currentPath: string; errors: Record<string, string[]> }) {
  return <Field name="image" label="Media utama" help="JPEG, PNG, atau WebP. Maksimum 5 MiB. Kosongkan untuk mempertahankan media saat ini." errors={errors}><Input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" />{currentPath ? <p className="break-all rounded bg-muted p-2 text-xs">Media aktif: {currentPath}</p> : null}</Field>;
}
function RelationField({ name, label, options, selected, errors, help }: { name: string; label: string; options: { id: string; label: string }[]; selected: string[]; errors: Record<string, string[]>; help?: string }) {
  return <Field name={name} label={label} help={help ?? "Gunakan Ctrl/Cmd untuk memilih lebih dari satu."} errors={errors}><Select id={name} name={name} multiple defaultValue={selected} className="h-36">{options.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</Select></Field>;
}
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle>{description ? <CardDescription>{description}</CardDescription> : null}</CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">{children}</CardContent></Card>;
}

function CommonSeo({ record, errors }: { record: CmsRecord | null; errors: Record<string, string[]> }) {
  return <Section title="SEO" description="Judul maksimum 70 karakter dan deskripsi maksimum 170 karakter."><TextField name="seoTitle" label="SEO title" record={record} dbKey="seo_title" errors={errors} /><AreaField name="seoDescription" label="SEO description" record={record} dbKey="seo_description" errors={errors} rows={3} /></Section>;
}

export function CmsForm({ resource, record, options }: { resource: CmsResource; record: CmsRecord | null; options: CmsRelationOptions }) {
  const [state, action, pending] = useActionState(saveCmsResource, INITIAL_CMS_ACTION_STATE);
  const errors = state.fieldErrors;
  const id = stringValue(record, "id");
  const currentImage = resource === "trips" ? stringValue(record, "cover_image_path") : resource === "destinations" ? stringValue(record, "hero_image_path") : resource === "activities" || resource === "trip-types" ? stringValue(record, "image_path") : resource === "blog" ? stringValue(record, "cover_image_path") : "";

  return (
    <>
    <form action={action} className="grid gap-6" encType="multipart/form-data">
      <input type="hidden" name="resource" value={resource} /><input type="hidden" name="id" value={id} /><input type="hidden" name="imagePath" value={currentImage} />
      {state.message ? <Alert className="border-destructive/50"><AlertTitle>Belum tersimpan</AlertTitle><AlertDescription>{state.message}</AlertDescription></Alert> : null}

      {resource === "trips" ? <>
        <Section title="Informasi Utama"><TextField name="name" label="Nama paket" record={record} dbKey="name" errors={errors} required /><TextField name="slug" label="Slug" record={record} dbKey="slug" errors={errors} required help="Contoh: jelajah-nusa-penida" /><AreaField name="shortDescription" label="Deskripsi singkat" record={record} dbKey="short_description" errors={errors} required /><AreaField name="description" label="Deskripsi lengkap" record={record} dbKey="description" errors={errors} required rows={8} /><ImageField currentPath={currentImage} errors={errors} /><StatusField record={record} errors={errors} /></Section>
        <Section title="Harga & Kapasitas"><TextField name="basePrice" label="Harga dasar (IDR)" record={record} dbKey="base_price" errors={errors} type="number" required /><TextField name="salePrice" label="Harga sale (opsional)" record={record} dbKey="sale_price" errors={errors} type="number" /><Field name="priceUnit" label="Satuan harga" errors={errors}><Select id="priceUnit" name="priceUnit" defaultValue={stringValue(record, "price_unit", "per_person")}><option value="per_person">Per orang</option><option value="per_package">Per paket</option></Select></Field><TextField name="durationDays" label="Durasi hari" record={record} dbKey="duration_days" errors={errors} type="number" defaultValue="1" required /><TextField name="durationNights" label="Durasi malam" record={record} dbKey="duration_nights" errors={errors} type="number" defaultValue="0" required /><TextField name="minParticipants" label="Minimum traveler" record={record} dbKey="min_participants" errors={errors} type="number" defaultValue="1" required /><TextField name="maxParticipants" label="Maksimum traveler" record={record} dbKey="max_participants" errors={errors} type="number" defaultValue="1" required /><AreaField name="departureOptions" label="Opsi keberangkatan" record={record} dbKey="departure_options" valueOverride={arrayLines(record, "departure_options")} errors={errors} help="Satu tanggal/opsi per baris." /></Section>
        <Section title="Relasi"><RelationField name="destinationIds" label="Destinasi" options={options.destinations} selected={relationValues(record, "trip_destinations", "destination_id")} errors={errors} /><RelationField name="activityIds" label="Aktivitas" options={options.activities} selected={relationValues(record, "trip_activities", "activity_id")} errors={errors} /><RelationField name="tripTypeIds" label="Trip Types" options={options.tripTypes} selected={relationValues(record, "trip_trip_types", "trip_type_id")} errors={errors} /></Section>
        <Section title="Detail Perjalanan"><AreaField name="highlights" label="Highlights" record={record} dbKey="highlights" valueOverride={arrayLines(record, "highlights")} errors={errors} help="Satu item per baris." /><AreaField name="itinerary" label="Itinerary" record={record} dbKey="itinerary" valueOverride={arrayLines(record, "itinerary")} errors={errors} rows={8} help="Satu hari per baris; urutan baris menjadi nomor hari." /><AreaField name="included" label="Sudah termasuk" record={record} dbKey="included" valueOverride={arrayLines(record, "included")} errors={errors} /><AreaField name="excluded" label="Belum termasuk" record={record} dbKey="excluded" valueOverride={arrayLines(record, "excluded")} errors={errors} /><AreaField name="meetingPoint" label="Meeting point" record={record} dbKey="meeting_point" errors={errors} /><AreaField name="accommodationInfo" label="Akomodasi" record={record} dbKey="accommodation_info" errors={errors} /><AreaField name="transportationInfo" label="Transportasi" record={record} dbKey="transportation_info" errors={errors} /><AreaField name="notes" label="Catatan" record={record} dbKey="notes" errors={errors} /><AreaField name="terms" label="Syarat & ketentuan" record={record} dbKey="terms" errors={errors} /><AreaField name="cancellationNote" label="Ketentuan pembatalan" record={record} dbKey="cancellation_note" errors={errors} /><AreaField name="faq" label="FAQ (pertanyaan)" record={record} dbKey="faq" valueOverride={arrayLines(record, "faq")} errors={errors} /></Section>
        <Section title="Kurasi Home"><CheckField name="isPopular" label="Popular Package" record={record} dbKey="is_popular" /><TextField name="popularRank" label="Popular rank" record={record} dbKey="popular_rank" errors={errors} type="number" /><CheckField name="isFeatured" label="Featured Trip" record={record} dbKey="is_featured" /><TextField name="featuredRank" label="Featured rank" record={record} dbKey="featured_rank" errors={errors} type="number" /></Section><CommonSeo record={record} errors={errors} />
      </> : null}

      {resource === "destinations" ? <><Section title="Informasi Destinasi"><TextField name="name" label="Nama" record={record} dbKey="name" errors={errors} required /><TextField name="slug" label="Slug" record={record} dbKey="slug" errors={errors} required /><TextField name="country" label="Negara" record={record} dbKey="country" errors={errors} required /><TextField name="region" label="Region/provinsi" record={record} dbKey="region" errors={errors} /><TextField name="city" label="Kota" record={record} dbKey="city" errors={errors} /><AreaField name="shortDescription" label="Deskripsi singkat" record={record} dbKey="short_description" errors={errors} required /><AreaField name="description" label="Deskripsi lengkap" record={record} dbKey="description" errors={errors} required rows={8} /><ImageField currentPath={currentImage} errors={errors} /><AreaField name="highlights" label="Highlights" record={record} dbKey="highlights" valueOverride={arrayLines(record, "highlights")} errors={errors} /><AreaField name="bestTimeToVisit" label="Waktu terbaik berkunjung" record={record} dbKey="best_time_to_visit" errors={errors} /><TextField name="latitude" label="Latitude" record={record} dbKey="latitude" errors={errors} type="number" /><TextField name="longitude" label="Longitude" record={record} dbKey="longitude" errors={errors} type="number" /><StatusField record={record} errors={errors} /></Section><Section title="Kurasi Home"><CheckField name="isPopular" label="Destinasi populer" record={record} dbKey="is_popular" /><TextField name="popularRank" label="Popular rank" record={record} dbKey="popular_rank" errors={errors} type="number" /></Section><CommonSeo record={record} errors={errors} /></> : null}

      {resource === "activities" ? <><Section title="Informasi Aktivitas"><TextField name="name" label="Nama" record={record} dbKey="name" errors={errors} required /><TextField name="slug" label="Slug" record={record} dbKey="slug" errors={errors} required /><TextField name="iconKey" label="Icon key" record={record} dbKey="icon_key" errors={errors} /><TextField name="difficulty" label="Tingkat kesulitan" record={record} dbKey="difficulty" errors={errors} /><TextField name="durationText" label="Rekomendasi durasi" record={record} dbKey="duration_text" errors={errors} /><AreaField name="shortDescription" label="Deskripsi singkat" record={record} dbKey="short_description" errors={errors} required /><AreaField name="description" label="Deskripsi lengkap" record={record} dbKey="description" errors={errors} required rows={8} /><ImageField currentPath={currentImage} errors={errors} /><AreaField name="gallery" label="Gallery path" record={record} dbKey="gallery" valueOverride={arrayLines(record, "gallery")} errors={errors} help="Satu object path per baris." /><StatusField record={record} errors={errors} /></Section><Section title="Kurasi Home"><CheckField name="showOnHome" label="Tampilkan di Home" record={record} dbKey="show_on_home" /><TextField name="homeRank" label="Home rank" record={record} dbKey="home_rank" errors={errors} type="number" /></Section><CommonSeo record={record} errors={errors} /></> : null}

      {resource === "trip-types" ? <><Section title="Informasi Trip Type"><TextField name="name" label="Nama" record={record} dbKey="name" errors={errors} required /><TextField name="slug" label="Slug" record={record} dbKey="slug" errors={errors} required /><TextField name="iconKey" label="Icon key" record={record} dbKey="icon_key" errors={errors} /><TextField name="sortOrder" label="Urutan" record={record} dbKey="sort_order" errors={errors} type="number" defaultValue="0" required /><AreaField name="shortDescription" label="Deskripsi singkat" record={record} dbKey="short_description" errors={errors} /><AreaField name="description" label="Deskripsi lengkap" record={record} dbKey="description" errors={errors} required rows={8} /><ImageField currentPath={currentImage} errors={errors} /><CheckField name="isFeatured" label="Featured" record={record} dbKey="is_featured" /><StatusField record={record} errors={errors} /></Section><CommonSeo record={record} errors={errors} /></> : null}

      {resource === "blog" ? <><Section title="Artikel"><TextField name="title" label="Judul" record={record} dbKey="title" errors={errors} required /><TextField name="slug" label="Slug" record={record} dbKey="slug" errors={errors} required /><TextField name="authorLabel" label="Label penulis" record={record} dbKey="author_label" errors={errors} required /><TextField name="category" label="Kategori" record={record} dbKey="category" errors={errors} /><AreaField name="excerpt" label="Excerpt" record={record} dbKey="excerpt" errors={errors} required /><AreaField name="content" label="Konten" record={record} dbKey="content" valueOverride={contentValue(record)} errors={errors} required rows={16} help="Disimpan sebagai teks terstruktur aman; HTML mentah tidak diterima." /><AreaField name="tags" label="Tags" record={record} dbKey="tags" valueOverride={arrayLines(record, "tags")} errors={errors} help="Pisahkan dengan baris atau koma." /><ImageField currentPath={currentImage} errors={errors} /><StatusField record={record} errors={errors} /></Section><Section title="Relasi"><RelationField name="destinationIds" label="Destinasi terkait" options={options.destinations} selected={relationValues(record, "blog_post_destinations", "destination_id")} errors={errors} /><RelationField name="activityIds" label="Aktivitas terkait" options={options.activities} selected={relationValues(record, "blog_post_activities", "activity_id")} errors={errors} /><RelationField name="tripIds" label="Paket terkait" options={options.trips} selected={relationValues(record, "blog_post_trips", "trip_id")} errors={errors} /></Section><Section title="Kurasi Home"><CheckField name="showOnHome" label="Tampilkan di Home" record={record} dbKey="show_on_home" /><TextField name="homeRank" label="Home rank" record={record} dbKey="home_rank" errors={errors} type="number" /></Section><CommonSeo record={record} errors={errors} /></> : null}

      {resource === "promotions" ? <><Section title="Informasi Promo"><TextField name="name" label="Nama promo" record={record} dbKey="name" errors={errors} required /><Field name="discountType" label="Tipe diskon" errors={errors}><Select id="discountType" name="discountType" defaultValue={stringValue(record, "discount_type", "percentage")}><option value="percentage">Persentase</option><option value="fixed">Nominal tetap</option></Select></Field><TextField name="discountValue" label="Nilai diskon" record={record} dbKey="discount_value" errors={errors} type="number" required /><TextField name="startsAt" label="Mulai" record={record} dbKey="starts_at" errors={errors} type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} /><TextField name="endsAt" label="Berakhir (opsional)" record={record} dbKey="ends_at" errors={errors} type="datetime-local" /><AreaField name="terms" label="Syarat promo" record={record} dbKey="terms" errors={errors} /><CheckField name="isActive" label="Promo aktif" record={record} dbKey="is_active" /></Section><Section title="Paket Target"><RelationField name="tripIds" label="Paket" options={options.trips} selected={relationValues(record, "promotion_trips", "trip_id")} errors={errors} /></Section></> : null}

      <div className="sticky bottom-4 z-20 flex justify-end rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur"><Button type="submit" disabled={pending}>{pending ? "Menyimpan..." : id ? "Simpan Perubahan" : "Simpan Draft"}</Button></div>
    </form>
    {id ? <DeletePanel resource={resource} id={id} /> : null}
    </>
  );
}

function DeletePanel({ resource, id }: { resource: CmsResource; id: string }) {
  const [state, action, pending] = useActionState(deleteCmsResource, INITIAL_CMS_ACTION_STATE);
  return <Card className="border-destructive/30"><CardHeader><CardTitle>Zona berbahaya</CardTitle><CardDescription>Arsipkan konten bila sudah pernah digunakan. Delete permanen dapat ditolak database bila ada relasi atau riwayat.</CardDescription></CardHeader><CardContent><form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end"><input type="hidden" name="resource" value={resource} /><input type="hidden" name="id" value={id} /><div className="grid flex-1 gap-2"><Label htmlFor="confirmation">Ketik HAPUS untuk konfirmasi</Label><Input id="confirmation" name="confirmation" autoComplete="off" /></div><Button type="submit" variant="destructive" disabled={pending}>{pending ? "Menghapus..." : "Hapus permanen"}</Button></form>{state.message ? <p className="mt-3 text-sm text-destructive">{state.message}</p> : null}</CardContent></Card>;
}
