import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center px-4 text-center"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">404</p><h1 className="mt-3 text-4xl font-bold">Halaman tidak ditemukan</h1><p className="mt-3 text-muted-foreground">Halaman yang kamu cari mungkin sudah berpindah atau belum tersedia.</p><Button asChild className="mt-6"><Link href="/">Kembali ke Home</Link></Button></div></main>;
}
