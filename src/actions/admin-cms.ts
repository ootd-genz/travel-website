"use server";

import { redirect } from "next/navigation";
import type { ZodError } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { removeContentImage, uploadContentImage } from "@/lib/cms/media";
import { revalidateCmsResource, revalidateHomepage, revalidateSiteSettings } from "@/lib/cms/revalidation";
import { createClient } from "@/lib/supabase/server";
import { INITIAL_CMS_ACTION_STATE, type CmsActionState, type CmsResource } from "@/types/cms";
import {
  activitySchema, blogSchema, commonCmsSchema, deleteCmsSchema, destinationSchema,
  homepageSchema, promotionSchema, siteSettingsSchema, tripSchema, tripTypeSchema, uspSchema,
} from "@/validations/cms";

const resourceTables = {
  trips: "trips", destinations: "destinations", activities: "activities",
  "trip-types": "trip_types", blog: "blog_posts", promotions: "promotions",
} as const;

const auditResourceTypes = {
  trips: "trip", destinations: "destination", activities: "activity",
  "trip-types": "trip_type", blog: "blog_post", promotions: "promotion",
} as const;

function value(formData: FormData, name: string) { return String(formData.get(name) ?? ""); }
function values(formData: FormData, name: string) { return formData.getAll(name).map(String); }
function lines(input: string) { return input.split(/\r?\n/).map((item) => item.trim()).filter(Boolean); }
function fileValue(formData: FormData, name = "image") {
  const candidate = formData.get(name);
  return candidate instanceof File && candidate.size > 0 ? candidate : null;
}
function fieldErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] = [...(errors[key] ?? []), issue.message];
  }
  return errors;
}
function errorState(message: string, errors: Record<string, string[]> = {}): CmsActionState {
  return { status: "error", message, fieldErrors: errors };
}
function safeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.startsWith("Media")) return error.message;
  if (error instanceof Error && error.message.startsWith("Isi file")) return error.message;
  if (error instanceof Error && error.message.startsWith("Format media")) return error.message;
  if (error instanceof Error && error.message.startsWith("Ukuran media")) return error.message;
  return "Perubahan belum dapat disimpan. Periksa data atau relasi lalu coba lagi.";
}

async function auditChange(
  client: Awaited<ReturnType<typeof createClient>>,
  actorId: string,
  resourceType: string,
  resourceId: string | null,
  action: "create" | "update" | "delete" | "publish" | "archive",
) {
  const { error } = await client.from("content_change_events").insert({
    resource_type: resourceType, resource_id: resourceId, action, actor_id: actorId,
  });
  if (error) throw new Error(`Audit CMS gagal (${error.code}).`);
}

async function persistRow(
  client: Awaited<ReturnType<typeof createClient>>,
  table: string,
  id: string | undefined,
  payload: Record<string, unknown>,
): Promise<string> {
  if (id) {
    const { data, error } = await client.from(table).update(payload).eq("id", id).select("id").single();
    if (error) throw new Error(`Database mutation gagal (${error.code}).`);
    return String(data.id);
  }
  const { data, error } = await client.from(table).insert(payload).select("id").single();
  if (error) throw new Error(`Database mutation gagal (${error.code}).`);
  return String(data.id);
}

async function replaceRelations(
  client: Awaited<ReturnType<typeof createClient>>,
  table: string,
  ownerColumn: string,
  ownerId: string,
  relationColumn: string,
  ids: string[],
) {
  const { error: deleteError } = await client.from(table).delete().eq(ownerColumn, ownerId);
  if (deleteError) throw new Error(`Relasi lama gagal diperbarui (${deleteError.code}).`);
  if (ids.length === 0) return;
  const { error: insertError } = await client.from(table).insert(ids.map((id) => ({ [ownerColumn]: ownerId, [relationColumn]: id })));
  if (insertError) throw new Error(`Relasi baru gagal disimpan (${insertError.code}).`);
}

async function currentImagePath(
  client: Awaited<ReturnType<typeof createClient>>,
  resource: CmsResource,
  id: string | undefined,
) {
  if (!id || resource === "promotions") return null;
  if (resource === "trips") {
    const { data, error } = await client.from("trips").select("cover_image_path").eq("id", id).maybeSingle();
    if (error) throw new Error(`Media lama tidak dapat diverifikasi (${error.code}).`);
    return data?.cover_image_path ?? null;
  }
  if (resource === "destinations") {
    const { data, error } = await client.from("destinations").select("hero_image_path").eq("id", id).maybeSingle();
    if (error) throw new Error(`Media lama tidak dapat diverifikasi (${error.code}).`);
    return data?.hero_image_path ?? null;
  }
  if (resource === "activities") {
    const { data, error } = await client.from("activities").select("image_path").eq("id", id).maybeSingle();
    if (error) throw new Error(`Media lama tidak dapat diverifikasi (${error.code}).`);
    return data?.image_path ?? null;
  }
  if (resource === "trip-types") {
    const { data, error } = await client.from("trip_types").select("image_path").eq("id", id).maybeSingle();
    if (error) throw new Error(`Media lama tidak dapat diverifikasi (${error.code}).`);
    return data?.image_path ?? null;
  }
  const { data, error } = await client.from("blog_posts").select("cover_image_path").eq("id", id).maybeSingle();
  if (error) throw new Error(`Media lama tidak dapat diverifikasi (${error.code}).`);
  return data?.cover_image_path ?? null;
}

export async function saveCmsResource(
  _previousState: CmsActionState = INITIAL_CMS_ACTION_STATE,
  formData: FormData,
): Promise<CmsActionState> {
  void _previousState;
  const common = commonCmsSchema.safeParse({ id: value(formData, "id"), resource: value(formData, "resource"), imagePath: value(formData, "imagePath") });
  if (!common.success) return errorState("Permintaan CMS tidak valid.", fieldErrors(common.error));

  const { resource, id } = common.data;
  const admin = await requireAdmin();
  const client = await createClient();
  const imageFile = fileValue(formData);
  let uploadedPath: string | null = null;
  let oldImagePath: string | null = null;
  let recordId = id ?? null;
  let slug: string | null = null;
  let nextStatus: string | null = null;
  let mainRowSaved = false;

  try {
    oldImagePath = await currentImagePath(client, resource, id);
    if (imageFile) uploadedPath = await uploadContentImage(imageFile, resource);
    const imagePath = uploadedPath ?? oldImagePath;
    const publishedAt = (resourceStatus: string) => resourceStatus === "published" ? new Date().toISOString() : null;

    if (resource === "trips") {
      const parsed = tripSchema.safeParse({
        name: value(formData, "name"), slug: value(formData, "slug"), shortDescription: value(formData, "shortDescription"), description: value(formData, "description"),
        basePrice: value(formData, "basePrice"), salePrice: value(formData, "salePrice"), priceUnit: value(formData, "priceUnit"), durationDays: value(formData, "durationDays"), durationNights: value(formData, "durationNights"),
        minParticipants: value(formData, "minParticipants"), maxParticipants: value(formData, "maxParticipants"), departureOptions: value(formData, "departureOptions"), highlights: value(formData, "highlights"), itinerary: value(formData, "itinerary"), included: value(formData, "included"), excluded: value(formData, "excluded"),
        meetingPoint: value(formData, "meetingPoint"), accommodationInfo: value(formData, "accommodationInfo"), transportationInfo: value(formData, "transportationInfo"), notes: value(formData, "notes"), terms: value(formData, "terms"), cancellationNote: value(formData, "cancellationNote"), faq: value(formData, "faq"),
        isPopular: formData.get("isPopular"), popularRank: value(formData, "popularRank"), isFeatured: formData.get("isFeatured"), featuredRank: value(formData, "featuredRank"), status: value(formData, "status"), seoTitle: value(formData, "seoTitle"), seoDescription: value(formData, "seoDescription"),
        destinationIds: values(formData, "destinationIds"), activityIds: values(formData, "activityIds"), tripTypeIds: values(formData, "tripTypeIds"),
      });
      if (!parsed.success) { if (uploadedPath) await removeContentImage(uploadedPath); return errorState("Periksa kembali data paket.", fieldErrors(parsed.error)); }
      const data = parsed.data; slug = data.slug; nextStatus = data.status;
      recordId = await persistRow(client, "trips", id, {
        name: data.name, slug: data.slug, short_description: data.shortDescription, description: data.description,
        base_price: data.basePrice, sale_price: data.salePrice, currency: "IDR", price_unit: data.priceUnit,
        duration_days: data.durationDays, duration_nights: data.durationNights, min_participants: data.minParticipants, max_participants: data.maxParticipants,
        departure_options: lines(data.departureOptions), cover_image_path: imagePath, highlights: lines(data.highlights),
        itinerary: lines(data.itinerary).map((title, index) => ({ day: index + 1, title })), included: lines(data.included), excluded: lines(data.excluded),
        meeting_point: data.meetingPoint, accommodation_info: data.accommodationInfo, transportation_info: data.transportationInfo, notes: data.notes, terms: data.terms, cancellation_note: data.cancellationNote,
        faq: lines(data.faq).map((question) => ({ question, answer: "" })), is_popular: data.isPopular, popular_rank: data.popularRank,
        is_featured: data.isFeatured, featured_rank: data.featuredRank, status: data.status, published_at: publishedAt(data.status), seo_title: data.seoTitle, seo_description: data.seoDescription,
      });
      mainRowSaved = true;
      if (!recordId) throw new Error("ID paket tidak tersedia.");
      await replaceRelations(client, "trip_destinations", "trip_id", recordId, "destination_id", data.destinationIds);
      await replaceRelations(client, "trip_activities", "trip_id", recordId, "activity_id", data.activityIds);
      await replaceRelations(client, "trip_trip_types", "trip_id", recordId, "trip_type_id", data.tripTypeIds);
    } else if (resource === "destinations") {
      const parsed = destinationSchema.safeParse({
        name: value(formData, "name"), slug: value(formData, "slug"), shortDescription: value(formData, "shortDescription"), description: value(formData, "description"), country: value(formData, "country"), region: value(formData, "region"), city: value(formData, "city"), highlights: value(formData, "highlights"), bestTimeToVisit: value(formData, "bestTimeToVisit"), latitude: value(formData, "latitude"), longitude: value(formData, "longitude"), isPopular: formData.get("isPopular"), popularRank: value(formData, "popularRank"), status: value(formData, "status"), seoTitle: value(formData, "seoTitle"), seoDescription: value(formData, "seoDescription"),
      });
      if (!parsed.success) { if (uploadedPath) await removeContentImage(uploadedPath); return errorState("Periksa kembali data destinasi.", fieldErrors(parsed.error)); }
      const data = parsed.data; slug = data.slug; nextStatus = data.status;
      recordId = await persistRow(client, "destinations", id, { name: data.name, slug: data.slug, short_description: data.shortDescription, description: data.description, country: data.country, region: data.region, city: data.city, hero_image_path: imagePath, highlights: lines(data.highlights), best_time_to_visit: data.bestTimeToVisit, latitude: data.latitude, longitude: data.longitude, is_popular: data.isPopular, popular_rank: data.popularRank, status: data.status, published_at: publishedAt(data.status), seo_title: data.seoTitle, seo_description: data.seoDescription });
      mainRowSaved = true;
    } else if (resource === "activities") {
      const parsed = activitySchema.safeParse({ name: value(formData, "name"), slug: value(formData, "slug"), shortDescription: value(formData, "shortDescription"), description: value(formData, "description"), iconKey: value(formData, "iconKey"), difficulty: value(formData, "difficulty"), durationText: value(formData, "durationText"), gallery: value(formData, "gallery"), showOnHome: formData.get("showOnHome"), homeRank: value(formData, "homeRank"), status: value(formData, "status"), seoTitle: value(formData, "seoTitle"), seoDescription: value(formData, "seoDescription") });
      if (!parsed.success) { if (uploadedPath) await removeContentImage(uploadedPath); return errorState("Periksa kembali data aktivitas.", fieldErrors(parsed.error)); }
      const data = parsed.data; slug = data.slug; nextStatus = data.status;
      recordId = await persistRow(client, "activities", id, { name: data.name, slug: data.slug, short_description: data.shortDescription, description: data.description, icon_key: data.iconKey, image_path: imagePath, gallery: lines(data.gallery), difficulty: data.difficulty, duration_text: data.durationText, show_on_home: data.showOnHome, home_rank: data.homeRank, status: data.status, published_at: publishedAt(data.status), seo_title: data.seoTitle, seo_description: data.seoDescription });
      mainRowSaved = true;
    } else if (resource === "trip-types") {
      const parsed = tripTypeSchema.safeParse({ name: value(formData, "name"), slug: value(formData, "slug"), shortDescription: value(formData, "shortDescription"), description: value(formData, "description"), iconKey: value(formData, "iconKey"), sortOrder: value(formData, "sortOrder"), isFeatured: formData.get("isFeatured"), status: value(formData, "status"), seoTitle: value(formData, "seoTitle"), seoDescription: value(formData, "seoDescription") });
      if (!parsed.success) { if (uploadedPath) await removeContentImage(uploadedPath); return errorState("Periksa kembali data trip type.", fieldErrors(parsed.error)); }
      const data = parsed.data; slug = data.slug; nextStatus = data.status;
      recordId = await persistRow(client, "trip_types", id, { name: data.name, slug: data.slug, short_description: data.shortDescription, description: data.description, icon_key: data.iconKey, image_path: imagePath, sort_order: data.sortOrder, is_featured: data.isFeatured, status: data.status, published_at: publishedAt(data.status), seo_title: data.seoTitle, seo_description: data.seoDescription });
      mainRowSaved = true;
    } else if (resource === "blog") {
      const parsed = blogSchema.safeParse({ title: value(formData, "title"), slug: value(formData, "slug"), excerpt: value(formData, "excerpt"), content: value(formData, "content"), authorLabel: value(formData, "authorLabel"), category: value(formData, "category"), tags: value(formData, "tags"), status: value(formData, "status"), showOnHome: formData.get("showOnHome"), homeRank: value(formData, "homeRank"), seoTitle: value(formData, "seoTitle"), seoDescription: value(formData, "seoDescription"), destinationIds: values(formData, "destinationIds"), activityIds: values(formData, "activityIds"), tripIds: values(formData, "tripIds") });
      if (!parsed.success) { if (uploadedPath) await removeContentImage(uploadedPath); return errorState("Periksa kembali data artikel.", fieldErrors(parsed.error)); }
      const data = parsed.data; slug = data.slug; nextStatus = data.status;
      recordId = await persistRow(client, "blog_posts", id, { title: data.title, slug: data.slug, excerpt: data.excerpt, content: { type: "plain_text", text: data.content }, cover_image_path: imagePath, author_label: data.authorLabel, category: data.category, tags: lines(data.tags.replaceAll(",", "\n")), status: data.status, published_at: publishedAt(data.status), show_on_home: data.showOnHome, home_rank: data.homeRank, seo_title: data.seoTitle, seo_description: data.seoDescription });
      mainRowSaved = true;
      if (!recordId) throw new Error("ID artikel tidak tersedia.");
      await replaceRelations(client, "blog_post_destinations", "blog_post_id", recordId, "destination_id", data.destinationIds);
      await replaceRelations(client, "blog_post_activities", "blog_post_id", recordId, "activity_id", data.activityIds);
      await replaceRelations(client, "blog_post_trips", "blog_post_id", recordId, "trip_id", data.tripIds);
    } else {
      const parsed = promotionSchema.safeParse({ name: value(formData, "name"), discountType: value(formData, "discountType"), discountValue: value(formData, "discountValue"), startsAt: value(formData, "startsAt"), endsAt: value(formData, "endsAt") || undefined, isActive: formData.get("isActive"), terms: value(formData, "terms"), tripIds: values(formData, "tripIds") });
      if (!parsed.success) return errorState("Periksa kembali data promo.", fieldErrors(parsed.error));
      const data = parsed.data; nextStatus = data.isActive ? "active" : "inactive";
      recordId = await persistRow(client, "promotions", id, { name: data.name, discount_type: data.discountType, discount_value: data.discountValue, starts_at: new Date(data.startsAt).toISOString(), ends_at: data.endsAt ? new Date(data.endsAt).toISOString() : null, is_active: data.isActive, terms: data.terms });
      mainRowSaved = true;
      if (!recordId) throw new Error("ID promo tidak tersedia.");
      await replaceRelations(client, "promotion_trips", "promotion_id", recordId, "trip_id", data.tripIds);
    }

    if (!recordId) throw new Error("ID konten tidak tersedia.");
    const action = !id ? "create" : nextStatus === "published" ? "publish" : nextStatus === "archived" ? "archive" : "update";
    await auditChange(client, admin.authUserId, auditResourceTypes[resource], recordId, action);
    if (uploadedPath && oldImagePath && uploadedPath !== oldImagePath) await removeContentImage(oldImagePath);
  } catch (error) {
    if (uploadedPath && !mainRowSaved) await removeContentImage(uploadedPath);
    return errorState(safeErrorMessage(error));
  }

  revalidateCmsResource(resource, slug);
  redirect(`/admin/${resource}?saved=1`);
}

export async function deleteCmsResource(
  _previousState: CmsActionState = INITIAL_CMS_ACTION_STATE,
  formData: FormData,
): Promise<CmsActionState> {
  void _previousState;
  const parsed = deleteCmsSchema.safeParse({ resource: value(formData, "resource"), id: value(formData, "id"), confirmation: value(formData, "confirmation") });
  if (!parsed.success) return errorState("Ketik HAPUS untuk mengonfirmasi penghapusan.", fieldErrors(parsed.error));
  const admin = await requireAdmin();
  const client = await createClient();
  const { resource, id } = parsed.data;
  const imagePath = await currentImagePath(client, resource, id);
  const { error } = await client.from(resourceTables[resource]).delete().eq("id", id);
  if (error) return errorState("Konten tidak dapat dihapus karena masih memiliki relasi atau riwayat penting. Gunakan Arsipkan.");
  await auditChange(client, admin.authUserId, auditResourceTypes[resource], id, "delete");
  await removeContentImage(imagePath);
  revalidateCmsResource(resource);
  redirect(`/admin/${resource}?deleted=1`);
}

export async function saveHomepageContent(_state: CmsActionState, formData: FormData): Promise<CmsActionState> {
  const parsed = homepageSchema.safeParse({ heroTitle: value(formData, "heroTitle"), heroSubtitle: value(formData, "heroSubtitle"), primaryCtaLabel: value(formData, "primaryCtaLabel"), primaryCtaHref: value(formData, "primaryCtaHref"), secondaryCtaLabel: value(formData, "secondaryCtaLabel"), secondaryCtaHref: value(formData, "secondaryCtaHref"), isPublished: formData.get("isPublished"), visibleSections: values(formData, "visibleSections"), imagePath: value(formData, "imagePath") });
  if (!parsed.success) return errorState("Periksa kembali konten Home.", fieldErrors(parsed.error));
  const admin = await requireAdmin(); const client = await createClient(); const image = fileValue(formData);
  const { data: current } = await client.from("homepage_content").select("hero_image_path").eq("id", true).maybeSingle();
  let uploaded: string | null = null;
  let rowSaved = false;
  try {
    if (image) uploaded = await uploadContentImage(image, "home");
    const selectedSections = new Set<string>(parsed.data.visibleSections);
    const visibility = Object.fromEntries(["booking", "popular", "usp", "featured", "deals", "destinations", "activities", "blog"].map((key) => [key, selectedSections.has(key)]));
    const { error } = await client.from("homepage_content").upsert({ id: true, hero_title: parsed.data.heroTitle, hero_subtitle: parsed.data.heroSubtitle, hero_image_path: uploaded ?? current?.hero_image_path ?? null, primary_cta_label: parsed.data.primaryCtaLabel, primary_cta_href: parsed.data.primaryCtaHref, secondary_cta_label: parsed.data.secondaryCtaLabel, secondary_cta_href: parsed.data.secondaryCtaHref || null, section_visibility: visibility, is_published: parsed.data.isPublished });
    if (error) throw new Error(`Database mutation gagal (${error.code}).`);
    rowSaved = true;
    await auditChange(client, admin.authUserId, "homepage_content", "singleton", parsed.data.isPublished ? "publish" : "update");
    if (uploaded && current?.hero_image_path) await removeContentImage(current.hero_image_path);
  } catch (error) { if (uploaded && !rowSaved) await removeContentImage(uploaded); return errorState(safeErrorMessage(error)); }
  revalidateHomepage(); redirect("/admin/home?saved=1");
}

export async function saveUspItem(_state: CmsActionState, formData: FormData): Promise<CmsActionState> {
  const parsed = uspSchema.safeParse({ id: value(formData, "id"), title: value(formData, "title"), description: value(formData, "description"), iconKey: value(formData, "iconKey"), sortOrder: value(formData, "sortOrder"), isActive: formData.get("isActive") });
  if (!parsed.success) return errorState("Periksa kembali data USP.", fieldErrors(parsed.error));
  const admin = await requireAdmin(); const client = await createClient(); const { id, ...data } = parsed.data;
  const uspId = await persistRow(client, "usp_items", id, { title: data.title, description: data.description, icon_key: data.iconKey, sort_order: data.sortOrder, is_active: data.isActive });
  await auditChange(client, admin.authUserId, "usp_item", uspId, id ? "update" : "create");
  revalidateHomepage(); redirect("/admin/home?uspSaved=1");
}

export async function deleteUspItem(formData: FormData) {
  const id = value(formData, "id");
  const admin = await requireAdmin(); const client = await createClient();
  const { error } = await client.from("usp_items").delete().eq("id", id);
  if (error) throw new Error("USP tidak dapat dihapus.");
  await auditChange(client, admin.authUserId, "usp_item", id, "delete");
  revalidateHomepage(); redirect("/admin/home?uspDeleted=1");
}

export async function saveSiteSettings(_state: CmsActionState, formData: FormData): Promise<CmsActionState> {
  const parsed = siteSettingsSchema.safeParse({ brandName: value(formData, "brandName"), logoPath: value(formData, "logoPath"), publicWhatsapp: value(formData, "publicWhatsapp"), email: value(formData, "email"), address: value(formData, "address"), bankName: value(formData, "bankName"), bankAccountNumber: value(formData, "bankAccountNumber"), bankAccountHolder: value(formData, "bankAccountHolder"), adminWhatsappNumber: value(formData, "adminWhatsappNumber"), footerText: value(formData, "footerText"), instagram: value(formData, "instagram"), facebook: value(formData, "facebook"), tiktok: value(formData, "tiktok") });
  if (!parsed.success) return errorState("Periksa kembali pengaturan bisnis.", fieldErrors(parsed.error));
  const admin = await requireAdmin(); const client = await createClient(); const image = fileValue(formData, "logo");
  const { data: current } = await client.from("site_settings").select("logo_path").eq("id", true).maybeSingle();
  let uploaded: string | null = null;
  let rowSaved = false;
  try {
    if (image) uploaded = await uploadContentImage(image, "branding");
    const data = parsed.data;
    const { error } = await client.from("site_settings").upsert({ id: true, brand_name: data.brandName, logo_path: uploaded ?? current?.logo_path ?? null, public_whatsapp: data.publicWhatsapp, email: data.email, address: data.address, bank_name: data.bankName, bank_account_number: data.bankAccountNumber, bank_account_holder: data.bankAccountHolder, admin_whatsapp_number: data.adminWhatsappNumber, footer_text: data.footerText, social_links: { instagram: data.instagram || null, facebook: data.facebook || null, tiktok: data.tiktok || null } });
    if (error) throw new Error(`Database mutation gagal (${error.code}).`);
    rowSaved = true;
    await auditChange(client, admin.authUserId, "site_settings", "singleton", "update");
    if (uploaded && current?.logo_path) await removeContentImage(current.logo_path);
  } catch (error) { if (uploaded && !rowSaved) await removeContentImage(uploaded); return errorState(safeErrorMessage(error)); }
  revalidateSiteSettings(); redirect("/admin/settings?saved=1");
}
