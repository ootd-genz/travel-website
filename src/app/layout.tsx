import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { DEFAULT_OG_IMAGE_PATH, getSiteOrigin } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: getSiteOrigin(),
  applicationName: "Travel Bali",
  title: {
    default: "Travel Bali — Liburan Impian Dimulai di Sini",
    template: "%s | Travel Bali",
  },
  description:
    "Temukan paket perjalanan, destinasi, dan aktivitas pilihan untuk liburanmu.",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Travel Bali",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        alt: "Travel Bali — paket perjalanan dan destinasi pilihan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
