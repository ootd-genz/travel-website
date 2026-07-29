import "server-only";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import type { CmsRelationOptions, CmsResource } from "@/types/cms";

export type CmsListItem = {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  detail: string;
  updatedAt: string;
};

function ensureQuery<T>(data: T | null, error: { code?: string } | null, label: string): T {
  if (error || data === null) throw new Error(`Data ${label} tidak dapat dimuat${error?.code ? ` (${error.code})` : ""}.`);
  return data;
}

export async function getCmsList(resource: CmsResource, search = ""): Promise<CmsListItem[]> {
  await requireAdmin();
  const client = await createClient();
  const term = search.trim().slice(0, 100);

  if (resource === "promotions") {
    let query = client.from("promotions").select("id,name,discount_type,discount_value,is_active,updated_at").order("updated_at", { ascending: false }).limit(100);
    if (term) query = query.ilike("name", `%${term}%`);
    const { data, error } = await query;
    return ensureQuery(data, error, "promo").map((row) => ({
      id: row.id, title: row.name, slug: null, status: row.is_active ? "active" : "inactive",
      detail: `${row.discount_type === "percentage" ? `${row.discount_value}%` : `Rp ${Number(row.discount_value).toLocaleString("id-ID")}`}`,
      updatedAt: row.updated_at,
    }));
  }

  if (resource === "blog") {
    let query = client.from("blog_posts").select("id,title,slug,status,updated_at").order("updated_at", { ascending: false }).limit(100);
    if (term) query = query.ilike("title", `%${term}%`);
    const { data, error } = await query;
    return ensureQuery(data, error, resource).map((row) => ({ id: row.id, title: row.title, slug: row.slug, status: row.status, detail: row.slug, updatedAt: row.updated_at }));
  }

  if (resource === "destinations") {
    let query = client.from("destinations").select("id,name,slug,status,updated_at,trip_destinations(count)").order("updated_at", { ascending: false }).limit(100);
    if (term) query = query.ilike("name", `%${term}%`);
    const { data, error } = await query;
    return ensureQuery(data, error, resource).map((row) => ({ id: row.id, title: row.name, slug: row.slug, status: row.status, detail: `${row.trip_destinations[0]?.count ?? 0} paket terkait`, updatedAt: row.updated_at }));
  }
  if (resource === "activities") {
    let query = client.from("activities").select("id,name,slug,status,updated_at,trip_activities(count)").order("updated_at", { ascending: false }).limit(100);
    if (term) query = query.ilike("name", `%${term}%`);
    const { data, error } = await query;
    return ensureQuery(data, error, resource).map((row) => ({ id: row.id, title: row.name, slug: row.slug, status: row.status, detail: `${row.trip_activities[0]?.count ?? 0} paket terkait`, updatedAt: row.updated_at }));
  }
  if (resource === "trip-types") {
    let query = client.from("trip_types").select("id,name,slug,status,updated_at,trip_trip_types(count)").order("updated_at", { ascending: false }).limit(100);
    if (term) query = query.ilike("name", `%${term}%`);
    const { data, error } = await query;
    return ensureQuery(data, error, resource).map((row) => ({ id: row.id, title: row.name, slug: row.slug, status: row.status, detail: `${row.trip_trip_types[0]?.count ?? 0} paket terkait`, updatedAt: row.updated_at }));
  }
  let query = client.from("trips").select("id,name,slug,status,updated_at").order("updated_at", { ascending: false }).limit(100);
  if (term) query = query.ilike("name", `%${term}%`);
  const { data, error } = await query;
  return ensureQuery(data, error, resource).map((row) => ({ id: row.id, title: row.name, slug: row.slug, status: row.status, detail: row.slug, updatedAt: row.updated_at }));
}

const tripFields = "id,name,slug,short_description,description,base_price,sale_price,price_unit,duration_days,duration_nights,min_participants,max_participants,departure_options,cover_image_path,highlights,itinerary,included,excluded,meeting_point,accommodation_info,transportation_info,notes,terms,cancellation_note,faq,is_popular,popular_rank,is_featured,featured_rank,status,seo_title,seo_description,trip_destinations(destination_id),trip_activities(activity_id),trip_trip_types(trip_type_id)";
const destinationFields = "id,name,slug,short_description,description,country,region,city,hero_image_path,highlights,best_time_to_visit,latitude,longitude,is_popular,popular_rank,status,seo_title,seo_description";
const activityFields = "id,name,slug,short_description,description,icon_key,image_path,gallery,difficulty,duration_text,show_on_home,home_rank,status,seo_title,seo_description";
const tripTypeFields = "id,name,slug,short_description,description,icon_key,image_path,sort_order,is_featured,status,seo_title,seo_description";
const blogFields = "id,title,slug,excerpt,content,cover_image_path,author_label,category,tags,status,show_on_home,home_rank,seo_title,seo_description,blog_post_destinations(destination_id),blog_post_activities(activity_id),blog_post_trips(trip_id)";
const promotionFields = "id,name,discount_type,discount_value,starts_at,ends_at,is_active,terms,promotion_trips(trip_id)";

export async function getCmsRecord(resource: CmsResource, id: string) {
  await requireAdmin();
  const client = await createClient();
  const result = resource === "trips" ? await client.from("trips").select(tripFields).eq("id", id).maybeSingle()
    : resource === "destinations" ? await client.from("destinations").select(destinationFields).eq("id", id).maybeSingle()
    : resource === "activities" ? await client.from("activities").select(activityFields).eq("id", id).maybeSingle()
    : resource === "trip-types" ? await client.from("trip_types").select(tripTypeFields).eq("id", id).maybeSingle()
    : resource === "blog" ? await client.from("blog_posts").select(blogFields).eq("id", id).maybeSingle()
    : await client.from("promotions").select(promotionFields).eq("id", id).maybeSingle();
  const { data, error } = result;
  if (error) throw new Error(`Konten tidak dapat dimuat (${error.code}).`);
  return data;
}

export async function getCmsRelationOptions(): Promise<CmsRelationOptions> {
  await requireAdmin();
  const client = await createClient();
  const [destinations, activities, tripTypes, trips] = await Promise.all([
    client.from("destinations").select("id,name").neq("status", "archived").order("name"),
    client.from("activities").select("id,name").neq("status", "archived").order("name"),
    client.from("trip_types").select("id,name").neq("status", "archived").order("name"),
    client.from("trips").select("id,name").neq("status", "archived").order("name"),
  ]);
  const failed = [destinations, activities, tripTypes, trips].find((result) => result.error);
  if (failed?.error) throw new Error(`Pilihan relasi tidak dapat dimuat (${failed.error.code}).`);
  const map = (rows: { id: string; name: string }[] | null) => (rows ?? []).map((row) => ({ id: row.id, label: row.name }));
  return { destinations: map(destinations.data), activities: map(activities.data), tripTypes: map(tripTypes.data), trips: map(trips.data) };
}

export async function getHomepageContent() {
  await requireAdmin();
  const client = await createClient();
  const [homepage, uspItems] = await Promise.all([
    client.from("homepage_content").select("id,hero_title,hero_subtitle,hero_image_path,primary_cta_label,primary_cta_href,secondary_cta_label,secondary_cta_href,section_visibility,is_published").eq("id", true).maybeSingle(),
    client.from("usp_items").select("id,title,description,icon_key,sort_order,is_active").order("sort_order"),
  ]);
  if (homepage.error || uspItems.error) throw new Error("Konten Home tidak dapat dimuat.");
  return { homepage: homepage.data, uspItems: uspItems.data ?? [] };
}

export async function getSiteSettings() {
  await requireAdmin();
  const client = await createClient();
  const { data, error } = await client.from("site_settings").select("id,brand_name,logo_path,public_whatsapp,email,address,bank_name,bank_account_number,bank_account_holder,admin_whatsapp_number,footer_text,social_links").eq("id", true).maybeSingle();
  if (error) throw new Error(`Pengaturan tidak dapat dimuat (${error.code}).`);
  return data;
}

export async function getCmsDashboardSummary() {
  await requireAdmin();
  const client = await createClient();
  const results = await Promise.all([
    client.from("trips").select("id", { count: "exact", head: true }),
    client.from("destinations").select("id", { count: "exact", head: true }),
    client.from("blog_posts").select("id", { count: "exact", head: true }),
    client.from("trips").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);
  return { trips: results[0].count ?? 0, destinations: results[1].count ?? 0, posts: results[2].count ?? 0, publishedTrips: results[3].count ?? 0 };
}
