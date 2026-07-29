import { ArrowRight, BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const foundations = [
  { title: "Arsitektur siap berkembang", description: "Route publik, autentikasi, dan admin sudah dipisahkan dengan jelas.", icon: Sparkles },
  { title: "Data tetap aman", description: "Koneksi Supabase disiapkan terpisah untuk browser dan server.", icon: ShieldCheck },
  { title: "Kualitas terukur", description: "Lint, typecheck, dan production build menjadi gerbang baseline.", icon: BadgeCheck },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_48%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Fondasi perjalanan digital</p>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Liburan Impian, Lebih Mudah Dimulai di Sini.</h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">Baseline aplikasi telah disiapkan untuk menghadirkan paket perjalanan, destinasi, aktivitas, booking, dan dashboard admin secara bertahap.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href="/destination">Temukan Perjalananmu<ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/admin/login">Masuk Admin</Link></Button>
            </div>
          </div>
          <Card className="bg-card/80 shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle>Phase 1 — Baseline</CardTitle>
              <CardDescription>Infrastruktur awal siap menerima fitur pada fase berikutnya.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {["Next.js App Router dan TypeScript strict", "Tailwind CSS 4 dan komponen shadcn", "Supabase SSR browser/server helpers", "Theme, loading, error, dan empty patterns"].map((item) => (
                  <li key={item} className="flex gap-3"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>{item}</span></li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {foundations.map(({ title, description, icon: Icon }) => (
            <Card key={title}><CardHeader><Icon className="mb-3 size-6 text-primary" aria-hidden="true" /><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader></Card>
          ))}
        </div>
      </section>
    </>
  );
}
