import { CalendarDays, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/common/json-ld";
import {
  PublicImage,
  SectionHeading,
  TripCard,
} from "@/components/common/public-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getPublicBlogPost,
  getPublicTrips,
  publicMediaUrl,
} from "@/lib/public/content";
import {
  absoluteUrl,
  createBreadcrumbJsonLd,
  createPublicMetadata,
  DEFAULT_OG_IMAGE_PATH,
} from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const post = await getPublicBlogPost((await params).slug);
  if (!post) notFound();

  return createPublicMetadata({
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    path: `/blog/${post.slug}`,
    image: publicMediaUrl(post.imagePath),
    type: "article",
    publishedTime: post.publishedAt,
  });
}

export default async function BlogDetailPage({ params }: Props) {
  const slug = (await params).slug;
  const [post, trips] = await Promise.all([
    getPublicBlogPost(slug),
    getPublicTrips(),
  ]);
  if (!post) notFound();

  const relatedTrips = trips
    .filter((trip) => post.trips.some((item) => item.id === trip.id))
    .slice(0, 3);
  const published = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(post.publishedAt));
  const paragraphs = post.content
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const articlePath = `/blog/${post.slug}`;

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          image:
            publicMediaUrl(post.imagePath) ??
            absoluteUrl(DEFAULT_OG_IMAGE_PATH),
          datePublished: post.publishedAt,
          author: {
            "@type": "Person",
            name: post.authorLabel,
          },
          mainEntityOfPage: absoluteUrl(articlePath),
        }}
      />
      <JsonLd
        data={createBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: articlePath },
        ])}
      />
      <header className="mx-auto max-w-4xl px-4 pb-10 pt-14 text-center sm:px-6 lg:pt-20">
        <div className="flex flex-wrap justify-center gap-2">
          {post.category ? (
            <Badge variant="secondary">{post.category}</Badge>
          ) : null}
          {post.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          {post.title}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <UserRound className="size-4" aria-hidden="true" />
            {post.authorLabel}
          </span>
          <time
            dateTime={post.publishedAt}
            className="inline-flex items-center gap-2"
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            {published}
          </time>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <PublicImage
          path={post.imagePath}
          alt={`Sampul artikel ${post.title}`}
          priority
          sizes="(max-width: 1200px) 100vw, 1152px"
          className="aspect-[16/8] rounded-[2rem] border shadow-lg"
        />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-6 text-[1.05rem] leading-8 text-foreground/85">
          {paragraphs.length ? (
            paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))
          ) : (
            <p>Isi artikel sedang disiapkan.</p>
          )}
        </div>

        {post.destinations.length || post.activities.length ? (
          <aside
            className="mt-12 rounded-2xl border bg-muted/30 p-6"
            aria-label="Topik terkait"
          >
            <h2 className="font-semibold">Jelajahi topik terkait</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {post.destinations.map((item) => (
                <Button key={item.id} asChild size="sm" variant="outline">
                  <Link href={`/destination/${item.slug}`}>
                    Destinasi {item.name}
                  </Link>
                </Button>
              ))}
              {post.activities.map((item) => (
                <Button key={item.id} asChild size="sm" variant="outline">
                  <Link href={`/activities/${item.slug}`}>
                    Aktivitas {item.name}
                  </Link>
                </Button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>

      {relatedTrips.length ? (
        <section className="border-y bg-muted/25">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Lanjutkan perjalanan"
              title="Paket yang relevan dengan artikel ini"
              description="Ubah inspirasi menjadi rencana perjalanan yang lebih konkret."
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
