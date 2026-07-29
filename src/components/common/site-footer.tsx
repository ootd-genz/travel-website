import { ArrowRight, Compass, Mail, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { PublicSiteSettings } from "@/types/public-content";

const navigation = [
  ["Home", "/"], ["Blog", "/blog"], ["Activities", "/activities"], ["Destination", "/destination"], ["Trip Types", "/trip-types"],
] as const;

export function SiteFooter({ settings }: { settings: PublicSiteSettings }) {
  const whatsappHref = settings.publicWhatsapp ? `https://wa.me/${settings.publicWhatsapp.replace(/\D/g, "")}` : null;
  return (
    <footer className="mt-16 border-t bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_1fr]">
          <div><div className="inline-flex items-center gap-2.5 text-lg font-bold"><span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"><Compass className="size-5" aria-hidden="true" /></span>{settings.brandName}</div><h2 className="mt-6 max-w-md text-2xl font-bold tracking-tight">Sudah Kebayang Liburannya? Saatnya Tentukan Perjalanannya.</h2><Button asChild className="mt-5"><Link href="/trips">Jelajahi Paket Travel<ArrowRight className="size-4" aria-hidden="true" /></Link></Button></div>
          <div><h2 className="font-semibold">Jelajahi</h2><ul className="mt-4 grid gap-3 text-sm text-background/70">{navigation.map(([label, href]) => <li key={href}><Link className="underline-offset-4 hover:text-background hover:underline" href={href}>{label}</Link></li>)}</ul></div>
          <div><h2 className="font-semibold">Hubungi Kami</h2><ul className="mt-4 grid gap-3 text-sm text-background/70">{settings.address ? <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{settings.address}</span></li> : null}{settings.email ? <li><a className="flex gap-2 underline-offset-4 hover:text-background hover:underline" href={`mailto:${settings.email}`}><Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{settings.email}</a></li> : null}{whatsappHref ? <li><a className="flex gap-2 underline-offset-4 hover:text-background hover:underline" href={whatsappHref} target="_blank" rel="noreferrer"><MessageCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />WhatsApp</a></li> : null}</ul></div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-background/20 pt-6 text-xs text-background/80 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} {settings.brandName}. {settings.footerText ?? "Semua hak dilindungi."}</p><p>Perjalanan yang jelas, dari pilihan sampai keberangkatan.</p></div>
      </div>
    </footer>
  );
}
