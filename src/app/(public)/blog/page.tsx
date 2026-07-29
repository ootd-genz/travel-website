import type { Metadata } from "next";
import { Search } from "lucide-react";

import { BlogCard, EmptyState, PageHero } from "@/components/common/public-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPublicBlogPosts } from "@/lib/public/content";
import { createPublicMetadata } from "@/lib/seo";

type BlogPageProps = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({
  searchParams,
}: BlogPageProps): Promise<Metadata> {
  const hasSearch = Boolean((await searchParams).q?.trim());

  return createPublicMetadata({
    title: "Blog & Inspirasi Perjalanan",
    description:
      "Baca tips persiapan, panduan destinasi, dan inspirasi untuk perjalanan berikutnya.",
    path: "/blog",
    noIndex: hasSearch,
  });
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const query = (await searchParams).q?.trim().slice(0, 100) ?? "";
  const blogPosts = await getPublicBlogPosts();
  const normalized = query.toLocaleLowerCase("id-ID");
  const posts = normalized ? blogPosts.filter((post) => [post.title, post.excerpt, post.category ?? "", ...post.tags].some((value) => value.toLocaleLowerCase("id-ID").includes(normalized))) : blogPosts;
  return <><PageHero eyebrow="Blog perjalanan" title="Cerita, Panduan, dan Inspirasi untuk Perjalanan Berikutnya." description="Mulai dari tips persiapan sampai rekomendasi destinasi—baca yang kamu butuhkan sebelum benar-benar berangkat."><form role="search" className="flex max-w-xl flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Label htmlFor="blog-search" className="sr-only">Cari artikel</Label><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" /><Input id="blog-search" name="q" defaultValue={query} placeholder="Cari tips, destinasi, atau cerita perjalanan..." className="h-11 bg-background pl-9" /></div><Button type="submit" size="lg">Cari Artikel</Button></form></PageHero><section aria-labelledby="blog-list-heading" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"><div className="mb-8"><p className="text-sm font-medium text-primary">{query ? `Hasil pencarian “${query}”` : "Artikel terbaru"}</p><h2 id="blog-list-heading" className="mt-2 text-3xl font-bold tracking-tight">Bekal sebelum kamu berangkat</h2></div>{posts.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <BlogCard key={post.id} post={post} headingLevel={3} />)}</div> : <EmptyState title="Belum menemukan artikel yang cocok" description="Coba kata kunci lain atau jelajahi destinasi pilihan kami." />}</section></>;
}
