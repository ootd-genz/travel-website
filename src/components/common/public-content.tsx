import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Compass,
  ImageIcon,
  MapPin,
  Mountain,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { publicMediaUrl } from "@/lib/public/content";
import type { PublicActivity, PublicBlogPost, PublicDestination, PublicTrip, PublicTripType } from "@/types/public-content";

export function PublicImage({ path, alt, className, priority = false, sizes = "(max-width: 768px) calc(100vw - 2rem), 33vw" }: { path: string | null; alt: string; className?: string; priority?: boolean; sizes?: string }) {
  const src = publicMediaUrl(path);
  return (
    <div className={cn("relative overflow-hidden bg-[linear-gradient(145deg,color-mix(in_oklab,var(--primary)_18%,var(--secondary)),var(--muted))]", className)}>
      {src ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="absolute inset-0 grid place-items-center" aria-hidden="true"><div className="rounded-full border border-primary/15 bg-background/75 p-4 text-primary shadow-sm backdrop-blur"><ImageIcon className="size-7" /></div></div>}
    </div>
  );
}

export function PageHero({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b bg-secondary/35">
      <div className="absolute -right-20 -top-32 size-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">{description}</p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p> : null}
        <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        {description ? <p className="mt-3 text-pretty leading-7 text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description, href = "/destination", action = "Jelajahi Destinasi" }: { title: string; description: string; href?: string; action?: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-muted/30 px-6 py-12 text-center">
      <Compass className="mx-auto size-8 text-primary" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {href ? <Button asChild variant="outline" className="mt-5"><Link href={href}>{action}<ArrowRight className="size-4" aria-hidden="true" /></Link></Button> : null}
    </div>
  );
}

function CardHeading({ level, children, className }: { level: 2 | 3; children: ReactNode; className?: string }) {
  const classes = cn("text-xl font-semibold leading-snug tracking-tight", className);
  return level === 2 ? <h2 className={classes}>{children}</h2> : <h3 className={classes}>{children}</h3>;
}

export function formatPrice(value: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function TripCard({ trip, headingLevel = 3 }: { trip: PublicTrip; headingLevel?: 2 | 3 }) {
  const price = trip.salePrice ?? trip.basePrice;
  const destination = trip.destinations[0]?.name ?? "Destinasi pilihan";
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <PublicImage path={trip.imagePath} alt={`Pemandangan paket ${trip.name}`} className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {trip.salePrice !== null ? <Badge>Harga spesial</Badge> : null}
          {trip.isPopular ? <Badge variant="secondary">Favorit traveler</Badge> : null}
        </div>
        <CardHeading level={headingLevel}>{trip.name}</CardHeading>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden="true" />{destination}</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" aria-hidden="true" />{trip.durationDays} hari</span>
        </div>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{trip.shortDescription}</p>
        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div><p className="text-xs text-muted-foreground">Mulai dari</p><p className="font-bold text-primary">{formatPrice(price, trip.currency)}</p><p className="text-xs text-muted-foreground">{trip.priceUnit === "per_person" ? "per orang" : "per paket"}</p></div>
          <Button asChild size="sm"><Link href={`/trips/${trip.slug}`} aria-label={`Lihat detail paket ${trip.name}`}>Lihat Detail<ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
        </div>
      </div>
    </article>
  );
}

export function DestinationCard({ destination, headingLevel = 3 }: { destination: PublicDestination; headingLevel?: 2 | 3 }) {
  const location = [destination.city, destination.region, destination.country].filter(Boolean).join(", ");
  return (
    <article className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-lg">
      <PublicImage path={destination.imagePath} alt={`Pemandangan ${destination.name}`} className="aspect-[4/3]" />
      <div className="p-5"><p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-primary"><MapPin className="size-3.5" aria-hidden="true" />{location}</p><CardHeading level={headingLevel}>{destination.name}</CardHeading><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{destination.shortDescription}</p><Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline" href={`/destination/${destination.slug}`}>Jelajahi {destination.name}<ArrowRight className="size-4" aria-hidden="true" /></Link></div>
    </article>
  );
}

export function ActivityCard({ activity, headingLevel = 3 }: { activity: PublicActivity; headingLevel?: 2 | 3 }) {
  return (
    <article className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-lg">
      <PublicImage path={activity.imagePath} alt={`Aktivitas ${activity.name}`} className="aspect-[16/10]" />
      <div className="p-5"><div className="mb-3 flex flex-wrap gap-2">{activity.difficulty ? <Badge variant="secondary">{activity.difficulty}</Badge> : null}{activity.durationText ? <Badge variant="outline">{activity.durationText}</Badge> : null}</div><CardHeading level={headingLevel}>{activity.name}</CardHeading><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{activity.shortDescription}</p><Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline" href={`/activities/${activity.slug}`}>Temukan paket {activity.name}<ArrowRight className="size-4" aria-hidden="true" /></Link></div>
    </article>
  );
}

export function TripTypeCard({ tripType, headingLevel = 3 }: { tripType: PublicTripType; headingLevel?: 2 | 3 }) {
  return (
    <article className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-lg">
      <PublicImage path={tripType.imagePath} alt={`Gaya perjalanan ${tripType.name}`} className="aspect-[16/10]" />
      <div className="p-5"><Mountain className="mb-4 size-6 text-primary" aria-hidden="true" /><CardHeading level={headingLevel}>{tripType.name}</CardHeading><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{tripType.shortDescription ?? tripType.description}</p><Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline" href={`/trip-types/${tripType.slug}`}>Lihat paket {tripType.name}<ArrowRight className="size-4" aria-hidden="true" /></Link></div>
    </article>
  );
}

export function BlogCard({ post, headingLevel = 3 }: { post: PublicBlogPost; headingLevel?: 2 | 3 }) {
  const date = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(post.publishedAt));
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-lg">
      <PublicImage path={post.imagePath} alt={`Sampul artikel ${post.title}`} className="aspect-[16/10]" />
      <div className="flex flex-1 flex-col p-5"><div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">{post.category ? <Badge variant="secondary">{post.category}</Badge> : null}<span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden="true" />{date}</span></div><CardHeading level={headingLevel}>{post.title}</CardHeading><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p><Link className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-primary underline-offset-4 hover:underline" href={`/blog/${post.slug}`}>Baca {post.title}<ArrowRight className="size-4" aria-hidden="true" /></Link></div>
    </article>
  );
}

export function CatalogStats({ trips, destinations, activities }: { trips: number; destinations: number; activities: number }) {
  return <div className="grid grid-cols-3 gap-3 text-center"><div className="rounded-xl border bg-background/80 p-3"><strong className="block text-xl">{trips}</strong><span className="text-xs text-muted-foreground">Paket</span></div><div className="rounded-xl border bg-background/80 p-3"><strong className="block text-xl">{destinations}</strong><span className="text-xs text-muted-foreground">Destinasi</span></div><div className="rounded-xl border bg-background/80 p-3"><strong className="block text-xl">{activities}</strong><span className="text-xs text-muted-foreground">Aktivitas</span></div></div>;
}

export function TripFacts({ trip }: { trip: PublicTrip }) {
  return <dl className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border bg-card p-4"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4" aria-hidden="true" />Durasi</dt><dd className="mt-1 font-semibold">{trip.durationDays} hari / {trip.durationNights} malam</dd></div><div className="rounded-xl border bg-card p-4"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="size-4" aria-hidden="true" />Traveler</dt><dd className="mt-1 font-semibold">{trip.minParticipants}–{trip.maxParticipants} orang</dd></div><div className="rounded-xl border bg-card p-4"><dt className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4" aria-hidden="true" />Destinasi</dt><dd className="mt-1 font-semibold">{trip.destinations.map((item) => item.name).join(", ") || "Sesuai itinerary"}</dd></div></dl>;
}
