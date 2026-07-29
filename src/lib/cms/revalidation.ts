import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

import { PUBLIC_CACHE_TAGS } from "@/lib/public/content";
import type { CmsResource } from "@/types/cms";

const resourceTags: Record<CmsResource, string[]> = {
  trips: [PUBLIC_CACHE_TAGS.trips],
  destinations: [PUBLIC_CACHE_TAGS.destinations],
  activities: [PUBLIC_CACHE_TAGS.activities],
  "trip-types": [PUBLIC_CACHE_TAGS.tripTypes],
  blog: [PUBLIC_CACHE_TAGS.blog],
  promotions: [PUBLIC_CACHE_TAGS.promotions],
};

export function revalidateCmsResource(resource: CmsResource, slug?: string | null) {
  resourceTags[resource].forEach((tag) => revalidateTag(tag, "max"));
  revalidatePath(`/admin/${resource}`);
  revalidatePath("/");

  const publicBase = resource === "trips" ? "/trips" : resource === "promotions" ? "/" : `/${resource}`;
  revalidatePath(publicBase);
  if (slug && resource !== "promotions") revalidatePath(`${publicBase}/${slug}`);
}

export function revalidateHomepage() {
  revalidateTag(PUBLIC_CACHE_TAGS.home, "max");
  revalidatePath("/");
  revalidatePath("/admin/home");
}

export function revalidateSiteSettings() {
  revalidateTag(PUBLIC_CACHE_TAGS.layout, "max");
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}
