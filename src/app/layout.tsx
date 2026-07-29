import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { AppProviders } from "@/providers/app-providers";

export const metadata: Metadata = {
  title: {
    default: "Travel Website",
    template: "%s | Travel Website",
  },
  description:
    "Temukan paket perjalanan, destinasi, dan aktivitas pilihan untuk liburanmu.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
