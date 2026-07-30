import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/providers/theme-provider";

export const metadata: Metadata = { title: "Login Admin", robots: { index: false, follow: false } };

export default function AdminLoginLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="travel-public-theme"
    >
      {children}
    </ThemeProvider>
  );
}
