"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled client error", { digest: error.digest ?? "unknown" });
  }, [error.digest]);
  return <main className="grid min-h-screen place-items-center px-4 text-center"><div className="max-w-md"><h1 className="text-3xl font-bold">Ada kendala saat membuka halaman.</h1><p className="mt-3 text-muted-foreground">Coba lagi beberapa saat. Jika masalah berlanjut, kembali ke halaman utama.</p><Button className="mt-6" onClick={reset}>Coba Lagi</Button></div></main>;
}
