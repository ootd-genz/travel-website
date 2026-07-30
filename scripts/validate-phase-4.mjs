import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  destinationSchema,
  homepageSchema,
  promotionSchema,
  siteSettingsSchema,
  tripSchema,
} from "../src/validations/cms.ts";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const resources = ["trips", "destinations", "activities", "trip-types", "blog", "promotions"];
for (const resource of resources) {
  for (const route of [
    `src/app/(admin)/admin/${resource}/page.tsx`,
    `src/app/(admin)/admin/${resource}/new/page.tsx`,
    `src/app/(admin)/admin/${resource}/[id]/page.tsx`,
  ]) assert(existsSync(join(root, route)), `Route CMS belum tersedia: ${route}`);
}
for (const route of ["src/app/(admin)/admin/home/page.tsx", "src/app/(admin)/admin/settings/page.tsx"]) {
  assert(existsSync(join(root, route)), `Route singleton CMS belum tersedia: ${route}`);
}

const migration = read("src/migrations/006_create_admin_cms_foundations.sql");
const actions = read("src/actions/admin-cms.ts");
const queries = read("src/lib/cms/queries.ts");
const media = read("src/lib/cms/media.ts");
const form = read("src/app/(admin)/admin/_components/cms-form.tsx");
const list = read("src/app/(admin)/admin/_components/cms-pages.tsx");
const deleteButton = read("src/app/(admin)/admin/_components/delete-resource-button.tsx");
const adminLayout = read("src/app/(admin)/admin/layout.tsx");

assert(/create table public\.content_change_events/i.test(migration), "Audit mutation CMS belum dibuat.");
assert(/enable row level security/i.test(migration) && /force row level security/i.test(migration), "RLS audit CMS belum lengkap.");
assert(/content_change_events_admin_insert/i.test(migration) && /actor_id\s*=\s*\(select auth\.uid\(\)\)/i.test(migration), "Actor audit CMS belum divalidasi oleh RLS.");
assert(/'content-media'[\s\S]+?true,[\s\S]+?5242880/i.test(migration), "Bucket media konten publik 5 MiB belum tersedia.");
assert(/image\/jpeg'[\s\S]+image\/png'[\s\S]+image\/webp'/i.test(migration), "Allowlist media konten belum lengkap.");
assert(!/'booking-transfer-proofs'[\s\S]{0,160}?true/i.test(migration), "Bucket bukti transfer tidak boleh dibuat public.");

assert(/requireAdmin\(\)/.test(actions) && /requireAdmin\(\)/.test(queries), "Read dan mutation CMS wajib memverifikasi admin.");
assert(/uploadContentImage/.test(actions) && /removeContentImage\(uploadedPath\)/.test(actions), "Upload media harus memiliki cleanup saat mutation gagal.");
assert(/hasValidSignature/.test(media) && /image\/jpeg/.test(media) && /image\/png/.test(media) && /image\/webp/.test(media), "Validasi signature media belum lengkap.");
assert(/randomUUID/.test(media) && !/file\.name/.test(media), "Object path media harus random dan tidak memakai nama file mentah.");
for (const relation of ["trip_destinations", "trip_activities", "trip_trip_types", "blog_post_destinations", "blog_post_activities", "blog_post_trips", "promotion_trips"]) {
  assert(actions.includes(`"${relation}"`), `Sinkronisasi relasi ${relation} belum tersedia.`);
}
assert(/\.limit\(100\)/.test(queries), "Query list CMS harus memiliki batas row.");
assert(/status: value\(formData, "status"\)/.test(actions) && /published_at/.test(actions), "Publish/unpublish belum diproses server-side.");
assert(/DeletePanel/.test(form) && /confirmation/.test(form), "Delete permanen belum memiliki confirmation gate.");
assert(/DeleteResourceButton/.test(list), "Tabel CMS belum memiliki aksi hapus.");
assert(/Trash2/.test(deleteButton) && /Dialog\.Title/.test(deleteButton), "Aksi hapus tabel belum memakai ikon dan dialog konfirmasi.");
assert(/name="confirmation" value="HAPUS"/.test(deleteButton), "Konfirmasi hapus tabel belum melewati validation gate server.");
assert(/useActionState\(deleteCmsResource/.test(deleteButton), "Dialog hapus tabel belum terhubung ke Server Action.");
assert(/MobileAdminNavigation/.test(adminLayout), "Sidebar mobile admin belum tersedia.");
assert(existsSync(join(root, "src/app/(admin)/admin/loading.tsx")) && existsSync(join(root, "src/app/(admin)/admin/error.tsx")), "Loading/error state admin belum tersedia.");

const validTrip = {
  name: "Paket Bali", slug: "paket-bali", shortDescription: "Paket lengkap", description: "Deskripsi lengkap",
  basePrice: "1000000", salePrice: "900000", priceUnit: "per_person", durationDays: "3", durationNights: "2",
  minParticipants: "1", maxParticipants: "8", departureOptions: "", highlights: "Pantai", itinerary: "Hari pertama",
  included: "Hotel", excluded: "Tiket", meetingPoint: "", accommodationInfo: "", transportationInfo: "", notes: "", terms: "", cancellationNote: "", faq: "",
  isPopular: "on", popularRank: "1", isFeatured: "on", featuredRank: "1", status: "published", seoTitle: "", seoDescription: "",
  destinationIds: ["00000000-0000-4000-8000-000000000001"], activityIds: [], tripTypeIds: [],
};
assert(tripSchema.safeParse(validTrip).success, "Fixture paket valid ditolak schema.");
assert(!tripSchema.safeParse({ ...validTrip, salePrice: "1100000" }).success, "Sale price di atas base price harus ditolak.");
assert(!tripSchema.safeParse({ ...validTrip, destinationIds: [] }).success, "Paket tanpa destinasi harus ditolak.");
assert(!destinationSchema.safeParse({ name: "Bali", slug: "bali", shortDescription: "Indah", description: "Pulau indah", country: "Indonesia", region: "", city: "", highlights: "", bestTimeToVisit: "", latitude: "-8", longitude: "", isPopular: false, popularRank: "", status: "draft", seoTitle: "", seoDescription: "" }).success, "Koordinat parsial harus ditolak.");
assert(!promotionSchema.safeParse({ name: "Diskon", discountType: "percentage", discountValue: "101", startsAt: "2026-07-29T10:00", endsAt: "", isActive: true, terms: "", tripIds: [] }).success, "Promo invalid harus ditolak.");
assert(!promotionSchema.safeParse({ name: "Diskon", code: "kode promo", discountType: "percentage", discountValue: "10", startsAt: "2026-07-29T10:00", endsAt: "2026-07-30T10:00", isActive: true, terms: "", tripIds: ["cde0f46a-8a08-4acb-9cbe-4c3abdf11727"] }).success, "Format kode promo invalid harus ditolak.");
assert(!homepageSchema.safeParse({ heroTitle: "Hero", heroSubtitle: "Subtitle", primaryCtaLabel: "CTA", primaryCtaHref: "https://evil.example", secondaryCtaLabel: "", secondaryCtaHref: "", isPublished: true, visibleSections: [], imagePath: "" }).success, "CTA eksternal Home harus ditolak.");
assert(!siteSettingsSchema.safeParse({ brandName: "Travel", logoPath: "", publicWhatsapp: "abc", email: "bad", address: "", bankName: "BCA", bankAccountNumber: "123", bankAccountHolder: "Admin", adminWhatsappNumber: "abc", footerText: "", instagram: "", facebook: "", tiktok: "" }).success, "Pengaturan bisnis invalid harus ditolak.");

console.log("Phase 4 static validation passed: CMS routes, authorization, validation, media, publish states, relations, and audit verified.");
