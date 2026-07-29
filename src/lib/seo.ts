import type { Metadata } from "next";

const LOCAL_SITE_ORIGIN = "http://localhost:3000";
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

export function getSiteOrigin() {
  const configuredOrigin = process.env.APP_URL;

  if (!configuredOrigin) return new URL(LOCAL_SITE_ORIGIN);

  try {
    return new URL(configuredOrigin);
  } catch {
    return new URL(LOCAL_SITE_ORIGIN);
  }
}

export function absoluteUrl(path: string) {
  return new URL(path, getSiteOrigin()).toString();
}

export function createBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

type PublicMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string;
  noIndex?: boolean;
};

export function createPublicMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  publishedTime,
  noIndex = false,
}: PublicMetadataInput): Metadata {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const imageUrl = image ?? DEFAULT_OG_IMAGE_PATH;
  const openGraph =
    type === "article"
      ? {
          type,
          title,
          description,
          url: canonicalPath,
          siteName: "Travel Bali",
          locale: "id_ID",
          images: [{ url: imageUrl, alt: title }],
          publishedTime,
        }
      : {
          type,
          title,
          description,
          url: canonicalPath,
          siteName: "Travel Bali",
          locale: "id_ID",
          images: [{ url: imageUrl, alt: title }],
        };

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: noIndex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}
