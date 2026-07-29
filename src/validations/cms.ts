import { z } from "zod";

const slug = z.string().trim().min(2).max(180).regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Gunakan huruf kecil, angka, dan tanda hubung.",
);
const status = z.enum(["draft", "published", "archived"]);
const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null);
const optionalNumber = z.preprocess((value) => value === "" ? null : value, z.coerce.number().nullable());
const checkbox = z.preprocess((value) => value === "on" || value === "true", z.boolean());
const relationIds = z.array(z.string().uuid()).max(100);

export const commonCmsSchema = z.object({
  id: z.preprocess((value) => value || undefined, z.string().uuid().optional()),
  resource: z.enum(["trips", "destinations", "activities", "trip-types", "blog", "promotions"]),
  imagePath: optionalText(500),
});

export const destinationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug,
  shortDescription: z.string().trim().min(2).max(500),
  description: z.string().trim().min(2).max(20_000),
  country: z.string().trim().min(2).max(100),
  region: optionalText(100),
  city: optionalText(100),
  highlights: z.string().max(5_000),
  bestTimeToVisit: optionalText(500),
  latitude: optionalNumber.pipe(z.number().min(-90).max(90).nullable()),
  longitude: optionalNumber.pipe(z.number().min(-180).max(180).nullable()),
  isPopular: checkbox,
  popularRank: z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().min(0).nullable()),
  status,
  seoTitle: optionalText(70),
  seoDescription: optionalText(170),
}).superRefine((value, context) => {
  if ((value.latitude === null) !== (value.longitude === null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["latitude"], message: "Latitude dan longitude harus diisi bersama." });
  }
  if (value.isPopular && value.popularRank === null) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["popularRank"], message: "Rank wajib untuk destinasi populer." });
  }
});

export const activitySchema = z.object({
  name: z.string().trim().min(2).max(120), slug,
  shortDescription: z.string().trim().min(2).max(500),
  description: z.string().trim().min(2).max(20_000),
  iconKey: optionalText(100), difficulty: optionalText(100), durationText: optionalText(100),
  gallery: z.string().max(5_000), showOnHome: checkbox,
  homeRank: z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().min(0).nullable()),
  status, seoTitle: optionalText(70), seoDescription: optionalText(170),
}).superRefine((value, context) => {
  if (value.showOnHome && value.homeRank === null) context.addIssue({ code: z.ZodIssueCode.custom, path: ["homeRank"], message: "Rank wajib bila tampil di Home." });
});

export const tripTypeSchema = z.object({
  name: z.string().trim().min(2).max(120), slug,
  shortDescription: optionalText(500), description: z.string().trim().min(2).max(20_000),
  iconKey: optionalText(100), sortOrder: z.coerce.number().int().min(0), isFeatured: checkbox,
  status, seoTitle: optionalText(70), seoDescription: optionalText(170),
});

export const tripSchema = z.object({
  name: z.string().trim().min(2).max(160), slug,
  shortDescription: z.string().trim().min(2).max(500), description: z.string().trim().min(2).max(30_000),
  basePrice: z.coerce.number().min(0),
  salePrice: z.preprocess((value) => value === "" ? null : value, z.coerce.number().min(0).nullable()),
  priceUnit: z.enum(["per_person", "per_package"]),
  durationDays: z.coerce.number().int().min(1), durationNights: z.coerce.number().int().min(0),
  minParticipants: z.coerce.number().int().min(1), maxParticipants: z.coerce.number().int().min(1),
  departureOptions: z.string().max(5_000), highlights: z.string().max(5_000), itinerary: z.string().max(20_000),
  included: z.string().max(10_000), excluded: z.string().max(10_000),
  meetingPoint: optionalText(2_000), accommodationInfo: optionalText(5_000), transportationInfo: optionalText(5_000),
  notes: optionalText(5_000), terms: optionalText(10_000), cancellationNote: optionalText(5_000), faq: z.string().max(10_000),
  isPopular: checkbox, popularRank: z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().min(0).nullable()),
  isFeatured: checkbox, featuredRank: z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().min(0).nullable()),
  status, seoTitle: optionalText(70), seoDescription: optionalText(170),
  destinationIds: relationIds, activityIds: relationIds, tripTypeIds: relationIds,
}).superRefine((value, context) => {
  if (value.salePrice !== null && value.salePrice > value.basePrice) context.addIssue({ code: z.ZodIssueCode.custom, path: ["salePrice"], message: "Harga promo tidak boleh melebihi harga dasar." });
  if (value.durationNights > value.durationDays) context.addIssue({ code: z.ZodIssueCode.custom, path: ["durationNights"], message: "Jumlah malam tidak boleh melebihi hari." });
  if (value.minParticipants > value.maxParticipants) context.addIssue({ code: z.ZodIssueCode.custom, path: ["maxParticipants"], message: "Maksimum traveler harus lebih besar atau sama dengan minimum." });
  if (value.isPopular && value.popularRank === null) context.addIssue({ code: z.ZodIssueCode.custom, path: ["popularRank"], message: "Rank Popular wajib diisi." });
  if (value.isFeatured && value.featuredRank === null) context.addIssue({ code: z.ZodIssueCode.custom, path: ["featuredRank"], message: "Rank Featured wajib diisi." });
  if (value.destinationIds.length === 0) context.addIssue({ code: z.ZodIssueCode.custom, path: ["destinationIds"], message: "Pilih minimal satu destinasi." });
});

export const blogSchema = z.object({
  title: z.string().trim().min(2).max(180), slug,
  excerpt: z.string().trim().min(2).max(500), content: z.string().trim().min(2).max(50_000),
  authorLabel: z.string().trim().min(2).max(100), category: optionalText(100),
  tags: z.string().max(2_000), status, showOnHome: checkbox,
  homeRank: z.preprocess((value) => value === "" ? null : value, z.coerce.number().int().min(0).nullable()),
  seoTitle: optionalText(70), seoDescription: optionalText(170),
  destinationIds: relationIds, activityIds: relationIds, tripIds: relationIds,
}).superRefine((value, context) => {
  if (value.showOnHome && value.homeRank === null) context.addIssue({ code: z.ZodIssueCode.custom, path: ["homeRank"], message: "Rank wajib bila artikel tampil di Home." });
});

export const promotionSchema = z.object({
  name: z.string().trim().min(2).max(120), discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().min(0), startsAt: z.string().min(1), endsAt: z.string().optional(),
  isActive: checkbox, terms: optionalText(10_000), tripIds: relationIds,
}).superRefine((value, context) => {
  if (value.discountType === "percentage" && value.discountValue > 100) context.addIssue({ code: z.ZodIssueCode.custom, path: ["discountValue"], message: "Diskon persen maksimum 100%." });
  if (value.endsAt && new Date(value.startsAt) >= new Date(value.endsAt)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["endsAt"], message: "Waktu selesai harus setelah waktu mulai." });
  if (value.tripIds.length === 0) context.addIssue({ code: z.ZodIssueCode.custom, path: ["tripIds"], message: "Pilih minimal satu paket target." });
});

export const deleteCmsSchema = z.object({
  resource: commonCmsSchema.shape.resource,
  id: z.string().uuid(),
  confirmation: z.literal("HAPUS"),
});

export const homepageSchema = z.object({
  heroTitle: z.string().trim().min(2).max(160), heroSubtitle: z.string().trim().min(2).max(500),
  primaryCtaLabel: z.string().trim().min(1).max(80), primaryCtaHref: z.string().startsWith("/").refine((value) => !value.startsWith("//")),
  secondaryCtaLabel: optionalText(80), secondaryCtaHref: z.string().trim().max(500).refine((value) => !value || (value.startsWith("/") && !value.startsWith("//")), "Gunakan path internal."),
  isPublished: checkbox,
  visibleSections: z.array(z.enum(["booking", "popular", "usp", "featured", "deals", "destinations", "activities", "blog"])),
  imagePath: optionalText(500),
});

export const uspSchema = z.object({
  id: z.preprocess((value) => value || undefined, z.string().uuid().optional()),
  title: z.string().trim().min(2).max(100), description: z.string().trim().min(2).max(500),
  iconKey: optionalText(100), sortOrder: z.coerce.number().int().min(0), isActive: checkbox,
});

export const siteSettingsSchema = z.object({
  brandName: z.string().trim().min(2).max(100), logoPath: optionalText(500),
  publicWhatsapp: z.string().trim().regex(/^[1-9][0-9]{7,14}$/).or(z.literal("")).transform((value) => value || null),
  email: z.string().trim().email().or(z.literal("")).transform((value) => value || null), address: optionalText(2_000),
  bankName: z.string().trim().min(2).max(50), bankAccountNumber: z.string().regex(/^[0-9]{6,30}$/),
  bankAccountHolder: z.string().trim().min(2).max(100), adminWhatsappNumber: z.string().regex(/^[1-9][0-9]{7,14}$/),
  footerText: optionalText(2_000), instagram: z.string().url().or(z.literal("")), facebook: z.string().url().or(z.literal("")), tiktok: z.string().url().or(z.literal("")),
});
