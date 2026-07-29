import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { z } from "zod";

import { getPublicEnv, hasSupabasePublicEnv } from "@/configs/env";
import type {
  PublicActivity,
  PublicBlogPost,
  PublicCatalog,
  PublicDestination,
  PublicFaqItem,
  PublicHomepage,
  PublicItineraryItem,
  PublicPromotion,
  PublicSiteSettings,
  PublicTrip,
  PublicTripRelation,
  PublicTripType,
  PublicUspItem,
} from "@/types/public-content";

export const PUBLIC_CACHE_TAGS = {
  home: "public:home",
  layout: "public:layout",
  trips: "public:trips",
  destinations: "public:destinations",
  activities: "public:activities",
  tripTypes: "public:trip-types",
  blog: "public:blog",
  promotions: "public:promotions",
} as const;

const CACHE_SECONDS = 300;
const DEFAULT_HOMEPAGE: PublicHomepage = {
  heroTitle: "Liburan Impian, Lebih Mudah Dimulai di Sini.",
  heroSubtitle: "Temukan paket perjalanan pilihan, destinasi memukau, dan aktivitas seru yang sudah kami kurasi agar kamu tinggal fokus menikmati perjalanan.",
  heroImagePath: null,
  primaryCtaLabel: "Temukan Perjalananmu",
  primaryCtaHref: "/destination",
  secondaryCtaLabel: "Lihat Paket Favorit",
  secondaryCtaHref: "#paket-favorit",
  sectionVisibility: {},
};
const DEFAULT_SETTINGS: PublicSiteSettings = {
  brandName: "Travel Bali",
  logoPath: null,
  publicWhatsapp: null,
  email: null,
  address: null,
  footerText: null,
  socialLinks: {},
};

const nullableText = z.string().nullable().optional().transform((value) => value ?? null);
const relationSchema = z.object({ id: z.string(), name: z.string(), slug: z.string() });
const wrappedRelationSchema = (key: string) => z.record(z.string(), z.unknown()).transform((row) => {
  const parsed = relationSchema.safeParse(row[key]);
  return parsed.success ? parsed.data : null;
});

const destinationRowSchema = z.object({
  id: z.string(), name: z.string(), slug: z.string(), short_description: z.string(), description: z.string(),
  country: z.string(), region: nullableText, city: nullableText, hero_image_path: nullableText,
  highlights: z.unknown(), best_time_to_visit: nullableText, is_popular: z.boolean(), popular_rank: z.number().nullable(),
  seo_title: nullableText, seo_description: nullableText,
});
const activityRowSchema = z.object({
  id: z.string(), name: z.string(), slug: z.string(), short_description: z.string(), description: z.string(),
  icon_key: nullableText, image_path: nullableText, difficulty: nullableText, duration_text: nullableText,
  show_on_home: z.boolean(), home_rank: z.number().nullable(), seo_title: nullableText, seo_description: nullableText,
});
const tripTypeRowSchema = z.object({
  id: z.string(), name: z.string(), slug: z.string(), short_description: nullableText, description: z.string(),
  icon_key: nullableText, image_path: nullableText, sort_order: z.number(), is_featured: z.boolean(),
  seo_title: nullableText, seo_description: nullableText,
});
const tripRowSchema = z.object({
  id: z.string(), name: z.string(), slug: z.string(), short_description: z.string(), description: z.string(),
  base_price: z.coerce.number(), sale_price: z.coerce.number().nullable(), currency: z.string(),
  price_unit: z.enum(["per_person", "per_package"]), duration_days: z.number(), duration_nights: z.number(),
  min_participants: z.number(), max_participants: z.number(), departure_options: z.unknown(), cover_image_path: nullableText,
  highlights: z.unknown(), itinerary: z.unknown(), included: z.unknown(), excluded: z.unknown(), faq: z.unknown(),
  meeting_point: nullableText, accommodation_info: nullableText, transportation_info: nullableText,
  notes: nullableText, terms: nullableText, cancellation_note: nullableText,
  is_popular: z.boolean(), popular_rank: z.number().nullable(), is_featured: z.boolean(), featured_rank: z.number().nullable(),
  seo_title: nullableText, seo_description: nullableText,
  trip_destinations: z.array(wrappedRelationSchema("destination")).default([]),
  trip_activities: z.array(wrappedRelationSchema("activity")).default([]),
  trip_trip_types: z.array(wrappedRelationSchema("trip_type")).default([]),
});
const blogRowSchema = z.object({
  id: z.string(), title: z.string(), slug: z.string(), excerpt: z.string(), content: z.unknown(), cover_image_path: nullableText,
  author_label: z.string(), category: nullableText, tags: z.array(z.string()), published_at: z.string(),
  show_on_home: z.boolean(), home_rank: z.number().nullable(), seo_title: nullableText, seo_description: nullableText,
  blog_post_destinations: z.array(wrappedRelationSchema("destination")).default([]),
  blog_post_activities: z.array(wrappedRelationSchema("activity")).default([]),
  blog_post_trips: z.array(wrappedRelationSchema("trip")).default([]),
});
const promotionRowSchema = z.object({
  id: z.string(), name: z.string(), discount_type: z.enum(["percentage", "fixed"]), discount_value: z.coerce.number(),
  starts_at: z.string(), ends_at: z.string().nullable(), terms: nullableText,
  promotion_trips: z.array(z.object({ trip_id: z.string() })).default([]),
});

const destinationFields = "id,name,slug,short_description,description,country,region,city,hero_image_path,highlights,best_time_to_visit,is_popular,popular_rank,seo_title,seo_description";
const activityFields = "id,name,slug,short_description,description,icon_key,image_path,difficulty,duration_text,show_on_home,home_rank,seo_title,seo_description";
const tripTypeFields = "id,name,slug,short_description,description,icon_key,image_path,sort_order,is_featured,seo_title,seo_description";
const tripFields = "id,name,slug,short_description,description,base_price,sale_price,currency,price_unit,duration_days,duration_nights,min_participants,max_participants,departure_options,cover_image_path,highlights,itinerary,included,excluded,meeting_point,accommodation_info,transportation_info,notes,terms,cancellation_note,faq,is_popular,popular_rank,is_featured,featured_rank,seo_title,seo_description,trip_destinations(destination:destinations(id,name,slug)),trip_activities(activity:activities(id,name,slug)),trip_trip_types(trip_type:trip_types(id,name,slug))";
const blogFields = "id,title,slug,excerpt,content,cover_image_path,author_label,category,tags,published_at,show_on_home,home_rank,seo_title,seo_description,blog_post_destinations(destination:destinations(id,name,slug)),blog_post_activities(activity:activities(id,name,slug)),blog_post_trips(trip:trips(id,name,slug))";

function publicClient() {
  const env = getPublicEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => typeof item === "string" && item.trim() ? [item.trim()] : []);
}

function relations(values: Array<PublicTripRelation | null>): PublicTripRelation[] {
  return values.filter((value): value is PublicTripRelation => value !== null);
}

function itinerary(value: unknown): PublicItineraryItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (typeof item === "string" && item.trim()) return [{ day: index + 1, title: item.trim(), description: null }];
    const parsed = z.object({ day: z.coerce.number().optional(), title: z.string(), description: nullableText }).safeParse(item);
    return parsed.success ? [{ day: parsed.data.day ?? index + 1, title: parsed.data.title, description: parsed.data.description }] : [];
  });
}

function faq(value: unknown): PublicFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = z.object({ question: z.string(), answer: z.string().default("") }).safeParse(item);
    return parsed.success && parsed.data.question.trim() ? [parsed.data] : [];
  });
}

function contentText(value: unknown) {
  if (typeof value === "string") return value;
  const parsed = z.object({ text: z.string() }).safeParse(value);
  return parsed.success ? parsed.data.text : "";
}

function mapDestination(row: z.infer<typeof destinationRowSchema>): PublicDestination {
  return { id: row.id, name: row.name, slug: row.slug, shortDescription: row.short_description, description: row.description, country: row.country, region: row.region, city: row.city, imagePath: row.hero_image_path, highlights: strings(row.highlights), bestTimeToVisit: row.best_time_to_visit, isPopular: row.is_popular, popularRank: row.popular_rank, seoTitle: row.seo_title, seoDescription: row.seo_description };
}
function mapActivity(row: z.infer<typeof activityRowSchema>): PublicActivity {
  return { id: row.id, name: row.name, slug: row.slug, shortDescription: row.short_description, description: row.description, iconKey: row.icon_key, imagePath: row.image_path, difficulty: row.difficulty, durationText: row.duration_text, showOnHome: row.show_on_home, homeRank: row.home_rank, seoTitle: row.seo_title, seoDescription: row.seo_description };
}
function mapTripType(row: z.infer<typeof tripTypeRowSchema>): PublicTripType {
  return { id: row.id, name: row.name, slug: row.slug, shortDescription: row.short_description, description: row.description, iconKey: row.icon_key, imagePath: row.image_path, sortOrder: row.sort_order, isFeatured: row.is_featured, seoTitle: row.seo_title, seoDescription: row.seo_description };
}
function mapTrip(row: z.infer<typeof tripRowSchema>): PublicTrip {
  return { id: row.id, name: row.name, slug: row.slug, shortDescription: row.short_description, description: row.description, basePrice: row.base_price, salePrice: row.sale_price, currency: row.currency, priceUnit: row.price_unit, durationDays: row.duration_days, durationNights: row.duration_nights, minParticipants: row.min_participants, maxParticipants: row.max_participants, departureOptions: strings(row.departure_options), imagePath: row.cover_image_path, highlights: strings(row.highlights), itinerary: itinerary(row.itinerary), included: strings(row.included), excluded: strings(row.excluded), meetingPoint: row.meeting_point, accommodationInfo: row.accommodation_info, transportationInfo: row.transportation_info, notes: row.notes, terms: row.terms, cancellationNote: row.cancellation_note, faq: faq(row.faq), isPopular: row.is_popular, popularRank: row.popular_rank, isFeatured: row.is_featured, featuredRank: row.featured_rank, seoTitle: row.seo_title, seoDescription: row.seo_description, destinations: relations(row.trip_destinations), activities: relations(row.trip_activities), tripTypes: relations(row.trip_trip_types) };
}
function mapPost(row: z.infer<typeof blogRowSchema>): PublicBlogPost {
  return { id: row.id, title: row.title, slug: row.slug, excerpt: row.excerpt, content: contentText(row.content), imagePath: row.cover_image_path, authorLabel: row.author_label, category: row.category, tags: row.tags, publishedAt: row.published_at, showOnHome: row.show_on_home, homeRank: row.home_rank, seoTitle: row.seo_title, seoDescription: row.seo_description, destinations: relations(row.blog_post_destinations), activities: relations(row.blog_post_activities), trips: relations(row.blog_post_trips) };
}

function assertQuery(label: string, error: { code?: string; message?: string } | null) {
  if (error) throw new Error(`${label} tidak dapat dimuat${error.code ? ` (${error.code})` : ""}.`);
}

async function loadDestinations() {
  if (!hasSupabasePublicEnv()) return [];
  const { data, error } = await publicClient()
    .from("destinations")
    .select(destinationFields)
    .order("name")
    .limit(100);
  assertQuery("Destinasi", error);
  return destinationRowSchema.array().parse(data ?? []).map(mapDestination);
}

async function loadActivities() {
  if (!hasSupabasePublicEnv()) return [];
  const { data, error } = await publicClient()
    .from("activities")
    .select(activityFields)
    .order("name")
    .limit(100);
  assertQuery("Aktivitas", error);
  return activityRowSchema.array().parse(data ?? []).map(mapActivity);
}

async function loadTripTypes() {
  if (!hasSupabasePublicEnv()) return [];
  const { data, error } = await publicClient()
    .from("trip_types")
    .select(tripTypeFields)
    .order("sort_order")
    .order("name")
    .limit(100);
  assertQuery("Trip type", error);
  return tripTypeRowSchema.array().parse(data ?? []).map(mapTripType);
}

async function loadTrips() {
  if (!hasSupabasePublicEnv()) return [];
  const { data, error } = await publicClient()
    .from("trips")
    .select(tripFields)
    .order("published_at", { ascending: false })
    .limit(100);
  assertQuery("Paket", error);
  return tripRowSchema.array().parse(data ?? []).map(mapTrip);
}

async function loadBlogPosts() {
  if (!hasSupabasePublicEnv()) return [];
  const { data, error } = await publicClient()
    .from("blog_posts")
    .select(blogFields)
    .order("published_at", { ascending: false })
    .limit(100);
  assertQuery("Blog", error);
  return blogRowSchema.array().parse(data ?? []).map(mapPost);
}

async function loadPromotions() {
  if (!hasSupabasePublicEnv()) return [];
  const { data, error } = await publicClient()
    .from("promotions")
    .select(
      "id,name,discount_type,discount_value,starts_at,ends_at,terms,promotion_trips(trip_id)",
    )
    .order("starts_at", { ascending: false })
    .limit(50);
  assertQuery("Promo", error);
  return promotionRowSchema.array().parse(data ?? []).map(
    (row): PublicPromotion => ({
      id: row.id,
      name: row.name,
      discountType: row.discount_type,
      discountValue: row.discount_value,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      terms: row.terms,
      tripIds: row.promotion_trips.map((item) => item.trip_id),
    }),
  );
}

async function loadHomepage() {
  if (!hasSupabasePublicEnv()) return { homepage: DEFAULT_HOMEPAGE, uspItems: [] as PublicUspItem[] };
  const client = publicClient();
  const [homepageResult, uspResult] = await Promise.all([
    client.from("homepage_content").select("hero_title,hero_subtitle,hero_image_path,primary_cta_label,primary_cta_href,secondary_cta_label,secondary_cta_href,section_visibility").eq("id", true).maybeSingle(),
    client.from("usp_items").select("id,title,description,icon_key,sort_order").order("sort_order"),
  ]);
  assertQuery("Home", homepageResult.error); assertQuery("USP", uspResult.error);
  const homeSchema = z.object({ hero_title: z.string(), hero_subtitle: z.string(), hero_image_path: nullableText, primary_cta_label: z.string(), primary_cta_href: z.string(), secondary_cta_label: nullableText, secondary_cta_href: nullableText, section_visibility: z.record(z.boolean()) });
  const parsedHome = homeSchema.safeParse(homepageResult.data);
  const homepage = parsedHome.success ? { heroTitle: parsedHome.data.hero_title, heroSubtitle: parsedHome.data.hero_subtitle, heroImagePath: parsedHome.data.hero_image_path, primaryCtaLabel: parsedHome.data.primary_cta_label, primaryCtaHref: parsedHome.data.primary_cta_href, secondaryCtaLabel: parsedHome.data.secondary_cta_label, secondaryCtaHref: parsedHome.data.secondary_cta_href, sectionVisibility: parsedHome.data.section_visibility } : DEFAULT_HOMEPAGE;
  const uspSchema = z.object({ id: z.string(), title: z.string(), description: z.string(), icon_key: nullableText, sort_order: z.number() });
  const uspItems = uspSchema.array().parse(uspResult.data ?? []).map((row) => ({ id: row.id, title: row.title, description: row.description, iconKey: row.icon_key, sortOrder: row.sort_order }));
  return { homepage, uspItems };
}

async function loadSiteSettings(): Promise<PublicSiteSettings> {
  if (!hasSupabasePublicEnv()) return DEFAULT_SETTINGS;
  const client = publicClient();
  const { data, error } = await client.rpc("get_public_site_settings");
  if (error || !Array.isArray(data) || data.length === 0) return DEFAULT_SETTINGS;
  const parsed = z.object({ brand_name: z.string(), logo_path: nullableText, public_whatsapp: nullableText, email: nullableText, address: nullableText, footer_text: nullableText, social_links: z.record(z.string().nullable()).default({}) }).safeParse(data[0]);
  if (!parsed.success) return DEFAULT_SETTINGS;
  return { brandName: parsed.data.brand_name, logoPath: parsed.data.logo_path, publicWhatsapp: parsed.data.public_whatsapp, email: parsed.data.email, address: parsed.data.address, footerText: parsed.data.footer_text, socialLinks: Object.fromEntries(Object.entries(parsed.data.social_links).filter((entry): entry is [string, string] => Boolean(entry[1]))) };
}

export const getPublicDestinations = unstable_cache(
  loadDestinations,
  ["public-destinations-v2"],
  { revalidate: CACHE_SECONDS, tags: [PUBLIC_CACHE_TAGS.destinations] },
);
export const getPublicActivities = unstable_cache(
  loadActivities,
  ["public-activities-v2"],
  { revalidate: CACHE_SECONDS, tags: [PUBLIC_CACHE_TAGS.activities] },
);
export const getPublicTripTypes = unstable_cache(
  loadTripTypes,
  ["public-trip-types-v2"],
  { revalidate: CACHE_SECONDS, tags: [PUBLIC_CACHE_TAGS.tripTypes] },
);
export const getPublicTrips = unstable_cache(
  loadTrips,
  ["public-trips-v2"],
  { revalidate: CACHE_SECONDS, tags: [PUBLIC_CACHE_TAGS.trips] },
);
export const getPublicBlogPosts = unstable_cache(
  loadBlogPosts,
  ["public-blog-v2"],
  { revalidate: CACHE_SECONDS, tags: [PUBLIC_CACHE_TAGS.blog] },
);
export const getPublicPromotions = unstable_cache(
  loadPromotions,
  ["public-promotions-v2"],
  { revalidate: CACHE_SECONDS, tags: [PUBLIC_CACHE_TAGS.promotions] },
);

export async function getPublicCatalog(): Promise<PublicCatalog> {
  const [destinations, activities, tripTypes, trips, blogPosts, promotions] =
    await Promise.all([
      getPublicDestinations(),
      getPublicActivities(),
      getPublicTripTypes(),
      getPublicTrips(),
      getPublicBlogPosts(),
      getPublicPromotions(),
    ]);

  return {
    destinations,
    activities,
    tripTypes,
    trips,
    blogPosts,
    promotions,
  };
}

export const getPublicHomepage = unstable_cache(loadHomepage, ["public-home-v1"], { revalidate: CACHE_SECONDS, tags: [PUBLIC_CACHE_TAGS.home] });
export const getPublicSiteSettings = unstable_cache(loadSiteSettings, ["public-layout-v1"], { revalidate: CACHE_SECONDS, tags: [PUBLIC_CACHE_TAGS.layout] });

export async function getPublicTrip(slug: string) { return (await getPublicTrips()).find((item) => item.slug === slug) ?? null; }
export async function getPublicDestination(slug: string) { return (await getPublicDestinations()).find((item) => item.slug === slug) ?? null; }
export async function getPublicActivity(slug: string) { return (await getPublicActivities()).find((item) => item.slug === slug) ?? null; }
export async function getPublicTripType(slug: string) { return (await getPublicTripTypes()).find((item) => item.slug === slug) ?? null; }
export async function getPublicBlogPost(slug: string) { return (await getPublicBlogPosts()).find((item) => item.slug === slug) ?? null; }

export function publicMediaUrl(path: string | null | undefined) {
  if (!path || !hasSupabasePublicEnv()) return null;
  try {
    const externalUrl = new URL(path);
    if (externalUrl.protocol === "https:" && externalUrl.hostname === "images.unsplash.com") return externalUrl.toString();
    return null;
  } catch {
    // Storage object paths are not URLs and are handled below.
  }
  const normalized = path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
  return `${getPublicEnv().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/content-media/${normalized}`;
}
