import type { ReactNode } from "react";

import { SiteFooter } from "@/components/common/site-footer";
import { SiteHeader } from "@/components/common/site-header";
import { getPublicSiteSettings, publicMediaUrl } from "@/lib/public/content";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await getPublicSiteSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <a className="skip-link" href="#main-content">
        Lewati ke konten utama
      </a>
      <SiteHeader brandName={settings.brandName} logoUrl={publicMediaUrl(settings.logoPath)} />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
