import type { Metadata } from "next";
import { ArrowRight, Compass, Headphones, Map, ShieldCheck, Sparkles, WalletCards, Waves } from "lucide-react";
import Link from "next/link";

import { ActivityCard, BlogCard, CatalogStats, DestinationCard, EmptyState, PublicImage, SectionHeading, TripCard, formatPrice } from "@/components/common/public-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicCatalog, getPublicHomepage } from "@/lib/public/content";

export const metadata: Metadata = {
  title: "Liburan Impian Dimulai di Sini",
  description: "Temukan paket perjalanan, destinasi, aktivitas, promo, dan inspirasi liburan pilihan dalam satu tempat.",
};

const uspIcons = [ShieldCheck, WalletCards, Sparkles, Headphones] as const;

export default async function HomePage() {
  const [{ homepage, uspItems }, catalog] = await Promise.all([getPublicHomepage(), getPublicCatalog()]);
  const visible = (section: string) => homepage.sectionVisibility[section] !== false;
  const popularTrips = catalog.trips.filter((trip) => trip.isPopular).sort((a, b) => (a.popularRank ?? 999) - (b.popularRank ?? 999)).slice(0, 3);
  const featuredTrips = catalog.trips.filter((trip) => trip.isFeatured).sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999)).slice(0, 3);
  const popularDestinations = catalog.destinations.filter((item) => item.isPopular).sort((a, b) => (a.popularRank ?? 999) - (b.popularRank ?? 999)).slice(0, 4);
  const homeActivities = catalog.activities.filter((item) => item.showOnHome).sort((a, b) => (a.homeRank ?? 999) - (b.homeRank ?? 999)).slice(0, 3);
  const homePosts = catalog.blogPosts.filter((item) => item.showOnHome).sort((a, b) => (a.homeRank ?? 999) - (b.homeRank ?? 999)).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_50%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-5">Paket pilihan • Harga transparan • Dukungan responsif</Badge>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{homepage.heroTitle}</h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">{homepage.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link href={homepage.primaryCtaHref}>{homepage.primaryCtaLabel}<ArrowRight className="size-4" aria-hidden="true" /></Link></Button>{homepage.secondaryCtaLabel && homepage.secondaryCtaHref ? <Button asChild size="lg" variant="outline"><Link href={homepage.secondaryCtaHref}>{homepage.secondaryCtaLabel}</Link></Button> : null}</div>
            <div className="mt-8 max-w-xl"><CatalogStats trips={catalog.trips.length} destinations={catalog.destinations.length} activities={catalog.activities.length} /></div>
          </div>
          <div className="relative"><PublicImage path={homepage.heroImagePath ?? popularTrips[0]?.imagePath ?? null} alt="Traveler menikmati destinasi pilihan" priority sizes="(max-width: 1024px) 100vw, 45vw" className="aspect-[4/5] rounded-[2rem] border shadow-2xl sm:aspect-[5/4] lg:aspect-[4/5]" /><div className="absolute -bottom-4 -left-3 max-w-56 rounded-2xl border bg-background/95 p-4 shadow-xl backdrop-blur sm:-left-6"><p className="text-sm font-semibold">Dikurasi untukmu</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Itinerary, pengalaman, dan harga bisa kamu pelajari sebelum memesan.</p></div></div>
        </div>
      </section>

      {visible("booking") ? <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><SectionHeading eyebrow="Mulai dari sini" title="Mau pergi ke mana selanjutnya?" description="Mulai dari tujuan, aktivitas, atau gaya perjalanan favoritmu." /><div className="grid gap-4 md:grid-cols-3">{[
        { href: "/destination", icon: Map, title: "Pilih destinasi", text: "Temukan tempat yang ingin kamu kenang." },
        { href: "/activities", icon: Waves, title: "Cari aktivitas", text: "Mulai dari pengalaman yang paling kamu tunggu." },
        { href: "/trip-types", icon: Compass, title: "Tentukan gaya", text: "Sesuaikan perjalanan dengan ritmemu." },
      ].map(({ href, icon: Icon, title, text }) => <Link key={href} href={href} className="group rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon className="size-6 text-primary" aria-hidden="true" /><h2 className="mt-5 text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Cari Perjalanan<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></Link>)}</div></section> : null}

      {visible("popular") ? <section id="paket-favorit" className="border-y bg-muted/25"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><SectionHeading eyebrow="Pilihan terlaris" title="Paket Favorit Traveler" description="Pilihan yang banyak dilirik karena itinerary menarik, pengalaman lengkap, dan harga yang jelas sejak awal." action={<Button asChild variant="outline"><Link href="/trips">Lihat Semua Paket<ArrowRight className="size-4" aria-hidden="true" /></Link></Button>} />{popularTrips.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{popularTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)}</div> : <EmptyState title="Paket favorit sedang disiapkan" description="Admin belum menandai paket favorit. Kamu tetap dapat melihat seluruh paket published yang tersedia." href="/trips" action="Lihat Semua Paket" />}</div></section> : null}

      {visible("usp") ? <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><SectionHeading eyebrow="Kenapa bersama kami" title="Perjalanan Lebih Tenang, Cerita Lebih Banyak." description="Setiap tahap dibuat jelas agar kamu bisa fokus menikmati perjalanan." /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{(uspItems.length ? uspItems : [
        { id: "curated", title: "Pilihan Terkurasi", description: "Paket dipilih agar pengalaman, waktu, dan budget terasa seimbang.", iconKey: null, sortOrder: 0 },
        { id: "clear", title: "Harga Transparan", description: "Lihat harga dan detail yang didapat sebelum memesan.", iconKey: null, sortOrder: 1 },
        { id: "easy", title: "Proses Mudah", description: "Pilih paket, transfer, kirim data, lalu tunggu konfirmasi admin.", iconKey: null, sortOrder: 2 },
        { id: "support", title: "Dukungan Responsif", description: "Pemesanan masuk langsung ke admin untuk segera diverifikasi.", iconKey: null, sortOrder: 3 },
      ]).map((item, index) => { const Icon = uspIcons[index % uspIcons.length]; return <article key={item.id} className="rounded-2xl border bg-card p-6"><span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary"><Icon className="size-5" aria-hidden="true" /></span><h3 className="mt-5 font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p></article>; })}</div></section> : null}

      {visible("featured") ? <section className="border-y bg-secondary/25"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><SectionHeading eyebrow="Pilihan minggu ini" title="Perjalanan Pilihan yang Layak Masuk Kalender Liburanmu." description="Dari laut biru sampai pegunungan sejuk, ini perjalanan yang layak masuk daftar berangkatmu." />{featuredTrips.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{featuredTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)}</div> : <EmptyState title="Perjalanan pilihan belum tersedia" description="Kurasi perjalanan minggu ini sedang disiapkan. Jelajahi katalog untuk menemukan paket lain." href="/trips" action="Jelajahi Paket" />}</div></section> : null}

      {visible("deals") ? <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><SectionHeading eyebrow="Promo aktif" title="Pergi Lebih Jauh, Tetap Lebih Hemat." description="Promo terbatas untuk mengubah rencana “nanti” menjadi tanggal keberangkatan." />{catalog.promotions.length ? <div className="grid gap-5 md:grid-cols-2">{catalog.promotions.slice(0, 4).map((promo) => { const trip = catalog.trips.find((item) => promo.tripIds.includes(item.id)); return <article key={promo.id} className="relative overflow-hidden rounded-2xl border bg-primary p-6 text-primary-foreground"><div className="absolute -right-10 -top-12 size-40 rounded-full bg-white/10" aria-hidden="true" /><Badge className="bg-background text-foreground">Promo terbatas</Badge><h3 className="mt-5 text-2xl font-bold">{promo.name}</h3><p className="mt-2 text-sm text-primary-foreground/80">Hemat {promo.discountType === "percentage" ? `${promo.discountValue}%` : formatPrice(promo.discountValue)}</p>{promo.terms ? <p className="mt-4 text-sm leading-6 text-primary-foreground/75">{promo.terms}</p> : null}{trip ? <Button asChild variant="outline" className="mt-6 border-white/40 bg-transparent text-white hover:bg-white hover:text-primary"><Link href={`/trips/${trip.slug}`}>Lihat paket {trip.name}<ArrowRight className="size-4" aria-hidden="true" /></Link></Button> : null}</article>; })}</div> : <EmptyState title="Belum ada promo aktif" description="Promo baru akan tampil otomatis selama masih berada dalam periode aktif." href="/trips" action="Lihat Paket yang Tersedia" />}</section> : null}

      {visible("destinations") ? <section className="border-y bg-muted/25"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><SectionHeading eyebrow="Destinasi populer" title="Destinasi yang Bikin Ingin Berangkat Sekarang." description="Cari suasana yang kamu butuhkan—pantai, budaya, alam, atau kota yang penuh cerita." action={<Button asChild variant="outline"><Link href="/destination">Jelajahi Destinasi</Link></Button>} />{popularDestinations.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{popularDestinations.map((destination) => <DestinationCard key={destination.id} destination={destination} />)}</div> : <EmptyState title="Destinasi populer belum dikurasi" description="Lihat seluruh destinasi published sambil menunggu pilihan populer terbaru." />}</div></section> : null}

      {visible("activities") ? <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><SectionHeading eyebrow="Pengalaman" title="Pilih Aktivitas, Ciptakan Ceritamu." description="Snorkeling, hiking, city tour, kuliner, atau sekadar menikmati sunset—pilih pengalaman yang paling kamu tunggu." />{homeActivities.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{homeActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}</div> : <EmptyState title="Aktivitas pilihan sedang disiapkan" description="Jelajahi seluruh aktivitas aktif untuk menemukan pengalaman yang sesuai." href="/activities" action="Temukan Aktivitas" />}</section> : null}

      {visible("blog") ? <section className="border-y bg-secondary/20"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><SectionHeading eyebrow="Inspirasi" title="Inspirasi Sebelum Koper Ditutup." description="Baca tips, panduan, dan cerita yang membantu perjalananmu terasa lebih siap dan lebih seru." action={<Button asChild variant="outline"><Link href="/blog">Baca Semua Artikel</Link></Button>} />{homePosts.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{homePosts.map((post) => <BlogCard key={post.id} post={post} />)}</div> : <EmptyState title="Artikel pilihan belum tersedia" description="Konten inspirasi sedang disiapkan. Kamu dapat mulai dari destinasi dan paket yang sudah aktif." />}</div></section> : null}
    </>
  );
}
