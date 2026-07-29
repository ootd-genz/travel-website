import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const seo = read("src/lib/seo.ts");
assert.match(seo, /alternates:\s*\{\s*canonical:/);
assert.match(seo, /openGraph/);
assert.match(seo, /twitter/);
assert.match(seo, /max-image-preview/);

const rootLayout = read("src/app/layout.tsx");
assert.match(rootLayout, /metadataBase:\s*getSiteOrigin/);
assert.match(rootLayout, /<html lang="id"/);
assert.doesNotMatch(
  rootLayout,
  /AppProviders/,
  "Provider client global yang tidak dipakai tidak boleh menghidrasi seluruh app",
);

const sitemap = read("src/app/sitemap.ts");
for (const route of [
  "/blog",
  "/activities",
  "/destination",
  "/trip-types",
  "/trips",
]) {
  assert.ok(sitemap.includes(route), `Sitemap harus memuat ${route}`);
}
assert.match(sitemap, /getPublicCatalog/);
assert.doesNotMatch(sitemap, /\/admin|\/booking/);

const robots = read("src/app/robots.ts");
assert.match(robots, /\/admin\//);
assert.match(robots, /\/booking\//);
assert.match(robots, /sitemap\.xml/);

const publicRoutes = [
  "src/app/(public)/page.tsx",
  "src/app/(public)/blog/page.tsx",
  "src/app/(public)/activities/page.tsx",
  "src/app/(public)/destination/page.tsx",
  "src/app/(public)/trip-types/page.tsx",
  "src/app/(public)/trips/page.tsx",
  "src/app/(public)/blog/[slug]/page.tsx",
  "src/app/(public)/activities/[slug]/page.tsx",
  "src/app/(public)/destination/[slug]/page.tsx",
  "src/app/(public)/trip-types/[slug]/page.tsx",
  "src/app/(public)/trips/[slug]/page.tsx",
];
for (const route of publicRoutes) {
  const source = read(route);
  assert.match(
    source,
    /createPublicMetadata/,
    `${route} harus memakai metadata SEO konsisten`,
  );
}

for (const route of [
  "src/app/(public)/blog/page.tsx",
  "src/app/(public)/trips/page.tsx",
]) {
  const source = read(route);
  assert.match(source, /noIndex:\s*hasSearch/);
  assert.match(source, /path:\s*"\/(blog|trips)"/);
}

const blogDetail = read("src/app/(public)/blog/[slug]/page.tsx");
assert.match(blogDetail, /"@type":\s*"Article"/);
assert.match(blogDetail, /BreadcrumbList|createBreadcrumbJsonLd/);
assert.match(blogDetail, /datePublished/);

for (const route of [
  "src/app/(admin)/admin/layout.tsx",
  "src/app/(auth)/admin/login/layout.tsx",
  "src/app/(public)/booking/[token]/page.tsx",
  "src/app/(public)/booking/[token]/success/page.tsx",
]) {
  const source = read(route);
  assert.match(
    source,
    /robots:\s*\{\s*index:\s*false/,
    `${route} harus noindex`,
  );
}

const proxy = read("src/lib/supabase/proxy.ts");
assert.match(proxy, /pathname\.startsWith\("\/booking\/"\)/);
assert.match(proxy, /X-Robots-Tag/);
assert.match(proxy, /private, no-store/);

const publicLayout = read("src/app/(public)/layout.tsx");
const adminLayout = read("src/app/(admin)/admin/layout.tsx");
assert.match(publicLayout, /skip-link/);
assert.match(publicLayout, /id="main-content"/);
assert.match(adminLayout, /skip-link/);
assert.match(adminLayout, /id="admin-main-content"/);

const css = read("src/app/globals.css");
assert.match(css, /:focus-visible/);
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.match(css, /\.skip-link:focus/);
assert.match(css, /prefers-color-scheme:\s*dark/);

const publicComponents = read("src/components/common/public-content.tsx");
assert.match(publicComponents, /from "next\/image"/);
assert.match(publicComponents, /sizes=/);
assert.match(publicComponents, /priority/);

const siteHeader = read("src/components/common/site-header.tsx");
const siteNavigation = read("src/components/common/site-navigation.tsx");
const mobileMenu = read("src/components/common/site-mobile-menu.tsx");
assert.doesNotMatch(siteHeader, /"use client"/);
assert.match(siteNavigation, /lazy\(\(\)\s*=>/);
assert.match(siteNavigation, /site-mobile-menu-trigger/);
assert.match(siteNavigation, /requestAnimationFrame/);
assert.doesNotMatch(siteHeader, /components\/ui\/sheet/);
assert.doesNotMatch(siteNavigation, /components\/ui\/sheet/);
assert.match(mobileMenu, /components\/ui\/sheet/);

const publicSource = publicRoutes
  .map((route) => read(route))
  .join("\n");
assert.doesNotMatch(publicSource, /<img\b/i);
assert.doesNotMatch(publicSource, /from "(?:recharts|maplibre-gl)"/);

const dataLayer = read("src/lib/public/content.ts");
for (const getter of [
  "getPublicDestinations",
  "getPublicActivities",
  "getPublicTripTypes",
  "getPublicTrips",
  "getPublicBlogPosts",
  "getPublicPromotions",
]) {
  assert.match(dataLayer, new RegExp(`export const ${getter}`));
}

const budget = JSON.parse(read("performance-budget.json"));
assert.equal(budget.coreWebVitalsTargets.largestContentfulPaintMs, 2500);
assert.equal(budget.coreWebVitalsTargets.interactionToNextPaintMs, 200);
assert.equal(budget.coreWebVitalsTargets.cumulativeLayoutShift, 0.1);
assert.ok(budget.mobileLabBudget.performanceScore >= 0.8);
assert.ok(budget.mobileLabBudget.accessibilityScore >= 0.95);
assert.ok(budget.mobileLabBudget.seoScore >= 0.95);
assert.ok(budget.mobileLabBudget.totalBlockingTimeMs <= 300);
assert.ok(budget.assets.initialJavaScriptKb <= 180);

console.log(
  "Phase 10 static checks passed: metadata/canonical/OG, sitemap, robots, private noindex, structured data, accessibility baseline, granular caching, image optimization, and performance budget.",
);
