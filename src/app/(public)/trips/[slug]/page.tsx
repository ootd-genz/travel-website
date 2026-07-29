import type { Metadata } from "next";
import { Check, MapPin, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  EmptyState,
  PublicImage,
  SectionHeading,
  TripCard,
  TripFacts,
  formatPrice,
} from "@/components/common/public-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicTrip, getPublicTrips, publicMediaUrl } from "@/lib/public/content";
import { createPublicMetadata } from "@/lib/seo";

import { BookingDraftForm } from "./_components/booking-draft-form";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trip = await getPublicTrip((await params).slug);
  if (!trip) notFound();
  return createPublicMetadata({
    title: trip.seoTitle ?? trip.name,
    description: trip.seoDescription ?? trip.shortDescription,
    path: `/trips/${trip.slug}`,
    image: publicMediaUrl(trip.imagePath),
  });
}

function TextSection({
  title,
  text,
}: {
  title: string;
  text: string | null;
}) {
  return text ? (
    <section>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {text
        .split(/\n+/)
        .filter(Boolean)
        .map((paragraph) => (
          <p
            key={paragraph}
            className="mt-4 leading-8 text-muted-foreground"
          >
            {paragraph}
          </p>
        ))}
    </section>
  ) : null;
}

export default async function TripDetailPage({ params }: Props) {
  const slug = (await params).slug;
  const [trip, trips] = await Promise.all([
    getPublicTrip(slug),
    getPublicTrips(),
  ]);
  if (!trip) notFound();

  const related = trips
    .filter(
      (item) =>
        item.id !== trip.id &&
        (item.destinations.some((destination) =>
          trip.destinations.some((target) => target.id === destination.id),
        ) ||
          item.tripTypes.some((type) =>
            trip.tripTypes.some((target) => target.id === type.id),
          )),
    )
    .slice(0, 3);
  const effectivePrice = trip.salePrice ?? trip.basePrice;

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-7 flex flex-wrap gap-2">
          {trip.destinations.map((item) => (
            <Badge key={item.id} variant="secondary" className="gap-1">
              <MapPin className="size-3" aria-hidden="true" />
              {item.name}
            </Badge>
          ))}
          {trip.tripTypes.map((item) => (
            <Badge key={item.id} variant="outline">
              {item.name}
            </Badge>
          ))}
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.65fr] lg:items-start">
          <div>
            <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              {trip.name} — Saatnya Membuat{" "}
              {trip.destinations[0]?.name ?? "Perjalanan"} Jadi Cerita Nyata.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
              {trip.shortDescription}
            </p>
            <PublicImage
              path={trip.imagePath}
              alt={`Pemandangan dalam paket ${trip.name}`}
              priority
              sizes="(max-width: 1024px) 100vw, 65vw"
              className="mt-8 aspect-[16/9] rounded-[2rem] border shadow-lg"
            />
            <div className="mt-6">
              <TripFacts trip={trip} />
            </div>
          </div>

          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <p className="text-sm text-muted-foreground">Harga mulai</p>
              <CardTitle className="text-3xl text-primary">
                {formatPrice(effectivePrice, trip.currency)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {trip.priceUnit === "per_person" ? "per orang" : "per paket"}
              </p>
              {trip.salePrice !== null ? (
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(trip.basePrice, trip.currency)}
                </p>
              ) : null}
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Pilih jumlah traveler dan keberangkatan. Server akan memeriksa
                paket, promo, dan total terbaru sebelum membuat ringkasan.
              </p>
              <BookingDraftForm
                tripId={trip.id}
                minParticipants={trip.minParticipants}
                maxParticipants={trip.maxParticipants}
                departureOptions={trip.departureOptions}
              />
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Belum ada pembayaran pada tahap ini. Ringkasan harga berlaku
                selama 60 menit setelah dibuat.
              </p>
              <div className="mt-5 flex gap-2 rounded-xl bg-secondary/60 p-3 text-xs leading-5">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <p>
                  Harga dan promo dihitung ulang di server. Pemesanan baru
                  dikonfirmasi setelah pembayaran diverifikasi admin.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-y bg-muted/25">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.65fr] lg:px-8">
          <div className="space-y-12">
            <TextSection title="Tentang Perjalanan" text={trip.description} />
            {trip.highlights.length ? (
              <section>
                <h2 className="text-2xl font-bold tracking-tight">
                  Yang Akan Kamu Nikmati
                </h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {trip.highlights.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 rounded-xl border bg-background p-4 text-sm leading-6"
                    >
                      <Check
                        className="mt-0.5 size-5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {trip.itinerary.length ? (
              <section>
                <h2 className="text-2xl font-bold tracking-tight">
                  Rencana Perjalanan
                </h2>
                <ol className="mt-6 grid gap-5">
                  {trip.itinerary.map((item) => (
                    <li
                      key={`${item.day}-${item.title}`}
                      className="relative border-l-2 border-primary/25 pl-6"
                    >
                      <span className="absolute -left-4 top-0 grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {item.day}
                      </span>
                      <h3 className="font-semibold">
                        Hari {item.day} — {item.title}
                      </h3>
                      {item.description ? (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
            <TextSection title="Yang Perlu Kamu Tahu" text={trip.notes} />
            <TextSection title="Syarat & Ketentuan" text={trip.terms} />
            <TextSection
              title="Ketentuan Pembatalan"
              text={trip.cancellationNote}
            />
          </div>

          <aside
            className="space-y-5"
            aria-label="Detail yang termasuk dalam paket"
          >
            <Card>
              <CardHeader>
                <CardTitle>Sudah Termasuk</CardTitle>
              </CardHeader>
              <CardContent>
                {trip.included.length ? (
                  <ul className="grid gap-3 text-sm">
                    {trip.included.map((item) => (
                      <li key={item} className="flex gap-2">
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Detail benefit akan segera dilengkapi.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Belum Termasuk</CardTitle>
              </CardHeader>
              <CardContent>
                {trip.excluded.length ? (
                  <ul className="grid gap-3 text-sm">
                    {trip.excluded.map((item) => (
                      <li key={item} className="flex gap-2">
                        <X
                          className="mt-0.5 size-4 shrink-0 text-destructive"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Belum ada pengecualian yang dicantumkan.
                  </p>
                )}
              </CardContent>
            </Card>
            {trip.meetingPoint ||
            trip.accommodationInfo ||
            trip.transportationInfo ? (
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Praktis</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm">
                  {trip.meetingPoint ? (
                    <div>
                      <p className="font-medium">Meeting point</p>
                      <p className="mt-1 text-muted-foreground">
                        {trip.meetingPoint}
                      </p>
                    </div>
                  ) : null}
                  {trip.accommodationInfo ? (
                    <div>
                      <p className="font-medium">Akomodasi</p>
                      <p className="mt-1 text-muted-foreground">
                        {trip.accommodationInfo}
                      </p>
                    </div>
                  ) : null}
                  {trip.transportationInfo ? (
                    <div>
                      <p className="font-medium">Transportasi</p>
                      <p className="mt-1 text-muted-foreground">
                        {trip.transportationInfo}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </aside>
        </div>
      </section>

      {trip.activities.length ? (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight">
            Aktivitas dalam perjalanan
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {trip.activities.map((item) => (
              <Button key={item.id} asChild variant="outline">
                <Link href={`/activities/${item.slug}`}>{item.name}</Link>
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      {trip.faq.length ? (
        <section className="border-y bg-secondary/20">
          <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight">
              Pertanyaan yang Sering Ditanyakan
            </h2>
            <div className="mt-6 grid gap-3">
              {trip.faq.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-xl border bg-background p-5"
                >
                  <summary className="cursor-pointer list-none font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.answer ||
                      "Hubungi admin untuk informasi lebih lanjut mengenai hal ini."}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Paket lainnya"
          title="Paket Serupa yang Mungkin Kamu Suka"
          description="Bandingkan pilihan lain sebelum menentukan perjalananmu."
        />
        {related.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <TripCard key={item.id} trip={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Belum ada paket serupa"
            description="Jelajahi seluruh katalog untuk melihat pilihan perjalanan aktif lainnya."
            href="/trips"
            action="Lihat Semua Paket"
          />
        )}
      </section>
    </>
  );
}
