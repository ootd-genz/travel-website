import type { MetadataRoute } from "next";

import { getPublicCatalog } from "@/lib/public/content";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getPublicCatalog();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/blog"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/activities"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/destination"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/trip-types"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/trips"),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  return [
    ...staticRoutes,
    ...catalog.blogPosts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...catalog.activities.map((activity) => ({
      url: absoluteUrl(`/activities/${activity.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...catalog.destinations.map((destination) => ({
      url: absoluteUrl(`/destination/${destination.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...catalog.tripTypes.map((tripType) => ({
      url: absoluteUrl(`/trip-types/${tripType.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...catalog.trips.map((trip) => ({
      url: absoluteUrl(`/trips/${trip.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
