"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Card><CardHeader><CardTitle>Data admin belum dapat dimuat</CardTitle><CardDescription>Periksa koneksi Supabase atau coba ulang. Detail internal tidak ditampilkan demi keamanan.</CardDescription></CardHeader><CardContent><Button onClick={reset}>Coba lagi</Button></CardContent></Card>;
}
