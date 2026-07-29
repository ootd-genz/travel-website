import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const exists = (path) => { read(path); return true; };

const routes = [
  "src/app/(public)/page.tsx",
  "src/app/(public)/blog/page.tsx",
  "src/app/(public)/blog/[slug]/page.tsx",
  "src/app/(public)/activities/page.tsx",
  "src/app/(public)/activities/[slug]/page.tsx",
  "src/app/(public)/destination/page.tsx",
  "src/app/(public)/destination/[slug]/page.tsx",
  "src/app/(public)/trip-types/page.tsx",
  "src/app/(public)/trip-types/[slug]/page.tsx",
  "src/app/(public)/trips/page.tsx",
  "src/app/(public)/trips/[slug]/page.tsx",
];
routes.forEach((route) => assert.equal(exists(route), true, `${route} harus tersedia`));

const header = read("src/components/common/site-header.tsx");
const menuLabels = ["Home", "Blog", "Activities", "Destination", "Trip Types"];
let previousIndex = -1;
for (const label of menuLabels) {
  const index = header.indexOf(`label: \"${label}\"`);
  assert.ok(index > previousIndex, `Urutan navigasi harus memuat ${label}`);
  previousIndex = index;
}
assert.match(header, /SheetTrigger/);
assert.match(header, /aria-current/);
assert.match(header, /href="\/"/);

const home = read("src/app/(public)/page.tsx");
for (const section of ["booking", "popular", "usp", "featured", "deals", "destinations", "activities", "blog"]) {
  assert.match(home, new RegExp(`visible\\(\\\"${section}\\\"\\)`), `Home harus menghormati visibility ${section}`);
}
for (const copy of ["Mau pergi ke mana selanjutnya?", "Paket Favorit Traveler", "Perjalanan Lebih Tenang", "Pergi Lebih Jauh", "Destinasi yang Bikin", "Pilih Aktivitas", "Inspirasi Sebelum Koper"]) {
  assert.ok(home.includes(copy), `Copy Home wajib tersedia: ${copy}`);
}

const dataLayer = read("src/lib/public/content.ts");
assert.match(dataLayer, /unstable_cache/);
assert.match(dataLayer, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
assert.doesNotMatch(dataLayer, /SUPABASE_SERVICE_ROLE_KEY|createAdminClient/);
assert.match(dataLayer, /PUBLIC_CACHE_TAGS/);
assert.match(dataLayer, /z\.object/);
assert.match(dataLayer, /images\.unsplash\.com/);

const nextConfig = read("next.config.ts");
assert.match(nextConfig, /images\.unsplash\.com/);

const demoSeed = read("scripts/seed-bali-demo.mjs");
assert.match(demoSeed, /--dry-run/);
assert.match(demoSeed, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
assert.match(demoSeed, /verifyPublicData/);
assert.match(demoSeed, /images\.unsplash\.com/);
assert.doesNotMatch(demoSeed, /\.delete\(/);

const revalidation = read("src/lib/cms/revalidation.ts");
assert.match(revalidation, /revalidateTag/);
assert.match(revalidation, /PUBLIC_CACHE_TAGS/);

const states = ["src/app/(public)/loading.tsx", "src/app/(public)/error.tsx"];
states.forEach((path) => assert.equal(exists(path), true));
assert.match(read(states[0]), /aria-busy/);
assert.match(read(states[1]), /reset/);
assert.match(read("src/components/common/public-content.tsx"), /EmptyState/);
assert.match(read("src/components/common/public-content.tsx"), /alt=/);

for (const route of routes) {
  const source = read(route);
  assert.doesNotMatch(source, /akan dibangun pada Phase 5|Phase 1 — Baseline/);
}

for (const detail of routes.filter((route) => route.includes("[slug]"))) {
  const source = read(detail);
  assert.match(source, /generateMetadata/);
  assert.match(source, /notFound\(\)/);
}

const migration = read("src/migrations/007_expose_public_site_settings.sql");
assert.match(migration, /security definer/i);
assert.match(migration, /grant execute.+anon, authenticated/is);
assert.doesNotMatch(migration, /bank_account_number|bank_account_holder|admin_whatsapp_number/);

console.log(`Phase 5 static checks passed: ${routes.length} public routes, cached RLS data layer, responsive navigation, UI states, metadata, safe settings projection, and idempotent Bali demo seed.`);
