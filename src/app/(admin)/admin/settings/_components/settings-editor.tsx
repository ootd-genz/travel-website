"use client";

import { useActionState } from "react";

import { saveSiteSettings } from "@/actions/admin-cms";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_CMS_ACTION_STATE } from "@/types/cms";

type Settings = Record<string, unknown>;
const text = (settings: Settings | null, key: string, fallback = "") => typeof settings?.[key] === "string" ? String(settings[key]) : fallback;

export function SettingsEditor({ settings }: { settings: Settings | null }) {
  const [state, action, pending] = useActionState(saveSiteSettings, INITIAL_CMS_ACTION_STATE);
  const socials = settings?.social_links && typeof settings.social_links === "object" ? settings.social_links as Settings : {};
  const field = (name: string, label: string, dbKey: string, options?: { type?: string; required?: boolean; fallback?: string }) => <div className="grid gap-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={options?.type} required={options?.required} defaultValue={text(settings, dbKey, options?.fallback)} />{state.fieldErrors[name]?.map((error) => <p className="text-xs text-destructive" key={error}>{error}</p>)}</div>;
  return <form action={action} encType="multipart/form-data" className="grid gap-6">
    {state.message ? <Alert className="border-destructive/40"><AlertTitle>Belum tersimpan</AlertTitle><AlertDescription>{state.message}</AlertDescription></Alert> : null}
    <Card><CardHeader><CardTitle>Branding & Kontak</CardTitle><CardDescription>Data non-secret yang dapat tampil di website publik.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">{field("brandName", "Nama brand", "brand_name", { required: true, fallback: "Travel Bali" })}{field("publicWhatsapp", "WhatsApp publik", "public_whatsapp")}{field("email", "Email publik", "email", { type: "email" })}<div className="grid gap-2 sm:col-span-2"><Label htmlFor="address">Alamat</Label><Textarea id="address" name="address" defaultValue={text(settings, "address")} /></div><div className="grid gap-2 sm:col-span-2"><Label htmlFor="logo">Logo</Label><Input id="logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp" /><input type="hidden" name="logoPath" value={text(settings, "logo_path")} />{text(settings, "logo_path") ? <p className="break-all text-xs text-muted-foreground">Media aktif: {text(settings, "logo_path")}</p> : null}</div></CardContent></Card>
    <Card><CardHeader><CardTitle>Footer & Social Media</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><div className="grid gap-2 sm:col-span-2"><Label htmlFor="footerText">Teks footer</Label><Textarea id="footerText" name="footerText" defaultValue={text(settings, "footer_text")} /></div><div className="grid gap-2"><Label htmlFor="instagram">Instagram URL</Label><Input id="instagram" name="instagram" type="url" defaultValue={text(socials, "instagram")} /></div><div className="grid gap-2"><Label htmlFor="facebook">Facebook URL</Label><Input id="facebook" name="facebook" type="url" defaultValue={text(socials, "facebook")} /></div><div className="grid gap-2"><Label htmlFor="tiktok">TikTok URL</Label><Input id="tiktok" name="tiktok" type="url" defaultValue={text(socials, "tiktok")} /></div></CardContent></Card>
    <Card><CardHeader><CardTitle>Pembayaran</CardTitle><CardDescription>Periksa dengan pemilik bisnis sebelum production. Nilai ini tampil pada flow transfer.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">{field("bankName", "Bank", "bank_name", { required: true, fallback: "BCA" })}{field("bankAccountNumber", "Nomor rekening", "bank_account_number", { required: true, fallback: "87654321" })}{field("bankAccountHolder", "Nama pemilik rekening", "bank_account_holder", { required: true, fallback: "Muhammad Fulan" })}{field("adminWhatsappNumber", "WhatsApp admin", "admin_whatsapp_number", { required: true, fallback: "6282261060675" })}</CardContent></Card>
    <Alert><AlertTitle>Credential provider tidak dikelola di sini</AlertTitle><AlertDescription>Token WhatsApp, service role key, dan secret lain tetap berada di environment server.</AlertDescription></Alert>
    <div className="flex justify-end"><Button disabled={pending}>{pending ? "Menyimpan..." : "Simpan Pengaturan"}</Button></div>
  </form>;
}
