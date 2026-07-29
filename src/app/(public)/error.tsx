"use client";

import { CircleAlert, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6"><span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive"><CircleAlert className="size-6" aria-hidden="true" /></span><h1 className="mt-6 text-3xl font-bold tracking-tight">Konten belum berhasil dimuat</h1><p className="mt-3 text-muted-foreground">Ada kendala saat mengambil informasi terbaru. Coba muat ulang bagian ini beberapa saat lagi.</p><Button type="button" onClick={reset} className="mt-7"><RotateCcw className="size-4" aria-hidden="true" />Coba Lagi</Button></section>;
}
