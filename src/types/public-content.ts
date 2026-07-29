export type PublicDestination = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  country: string;
  region: string | null;
  city: string | null;
  imagePath: string | null;
  highlights: string[];
  bestTimeToVisit: string | null;
  isPopular: boolean;
  popularRank: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type PublicActivity = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  iconKey: string | null;
  imagePath: string | null;
  difficulty: string | null;
  durationText: string | null;
  showOnHome: boolean;
  homeRank: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type PublicTripType = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  iconKey: string | null;
  imagePath: string | null;
  sortOrder: number;
  isFeatured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type PublicTripRelation = {
  id: string;
  name: string;
  slug: string;
};

export type PublicItineraryItem = {
  day: number;
  title: string;
  description: string | null;
};

export type PublicFaqItem = {
  question: string;
  answer: string;
};

export type PublicTrip = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  salePrice: number | null;
  currency: string;
  priceUnit: "per_person" | "per_package";
  durationDays: number;
  durationNights: number;
  minParticipants: number;
  maxParticipants: number;
  departureOptions: string[];
  imagePath: string | null;
  highlights: string[];
  itinerary: PublicItineraryItem[];
  included: string[];
  excluded: string[];
  meetingPoint: string | null;
  accommodationInfo: string | null;
  transportationInfo: string | null;
  notes: string | null;
  terms: string | null;
  cancellationNote: string | null;
  faq: PublicFaqItem[];
  isPopular: boolean;
  popularRank: number | null;
  isFeatured: boolean;
  featuredRank: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  destinations: PublicTripRelation[];
  activities: PublicTripRelation[];
  tripTypes: PublicTripRelation[];
};

export type PublicBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imagePath: string | null;
  authorLabel: string;
  category: string | null;
  tags: string[];
  publishedAt: string;
  showOnHome: boolean;
  homeRank: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  destinations: PublicTripRelation[];
  activities: PublicTripRelation[];
  trips: PublicTripRelation[];
};

export type PublicPromotion = {
  id: string;
  name: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startsAt: string;
  endsAt: string | null;
  terms: string | null;
  tripIds: string[];
};

export type PublicHomepage = {
  heroTitle: string;
  heroSubtitle: string;
  heroImagePath: string | null;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  sectionVisibility: Record<string, boolean>;
};

export type PublicUspItem = {
  id: string;
  title: string;
  description: string;
  iconKey: string | null;
  sortOrder: number;
};

export type PublicSiteSettings = {
  brandName: string;
  logoPath: string | null;
  publicWhatsapp: string | null;
  email: string | null;
  address: string | null;
  footerText: string | null;
  socialLinks: Record<string, string>;
};

export type PublicCatalog = {
  destinations: PublicDestination[];
  activities: PublicActivity[];
  tripTypes: PublicTripType[];
  trips: PublicTrip[];
  blogPosts: PublicBlogPost[];
  promotions: PublicPromotion[];
};
