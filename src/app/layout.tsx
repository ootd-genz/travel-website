import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

import { BRAND_LOGO_PATH } from "@/components/common/brand-logo";
import { DEFAULT_OG_IMAGE_PATH, getSiteOrigin } from "@/lib/seo";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

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
  icons: {
    icon: [{ url: BRAND_LOGO_PATH, type: "image/png" }],
    apple: [{ url: BRAND_LOGO_PATH, type: "image/png" }],
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
    <html lang="id"
      className={`${manrope.variable} ${fraunces.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
