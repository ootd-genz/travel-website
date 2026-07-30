import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const packageJson = JSON.parse(read("package.json"));
const roadmap = read("docs/roadmap.md");
const phase12Report = read(
  "docs/36-phase-12-automated-test-manual-qa-uat-staging.md",
);
const loginPage = read("src/app/(auth)/admin/login/page.tsx");
const forbiddenPage = read("src/app/(auth)/admin/forbidden/page.tsx");
const stagingRunner = read("scripts/validate-phase-12-staging.mjs");

for (let phase = 2; phase <= 11; phase += 1) {
  assert.match(
    packageJson.scripts["test:regression"],
    new RegExp(`test:phase${phase}`),
    `Regression suite belum menjalankan Phase ${phase}.`,
  );
}

assert.equal(
  packageJson.scripts["test:phase12"],
  "npm run test:regression && node scripts/validate-phase-12.mjs",
);
assert.match(packageJson.scripts.check, /test:phase12/);
assert.match(packageJson.scripts.check, /security:scan/);
assert.match(packageJson.scripts.check, /npm run build/);

for (const requirement of [
  "unit",
  "integration",
  "RLS",
  "E2E booking",
  "E2E admin",
  "WhatsApp failure scenario",
  "responsive",
  "accessibility",
  "SEO",
]) {
  assert.match(
    phase12Report,
    new RegExp(requirement, "i"),
    `Matriks Phase 12 belum memuat ${requirement}.`,
  );
}

for (const businessItem of [
  "copywriting",
  "harga",
  "rekening BCA",
  "nama rekening",
  "flow transfer",
  "booking data",
  "pesan WhatsApp",
  "admin usability",
]) {
  assert.match(
    phase12Report,
    new RegExp(`- \\[ \\] ${businessItem}`, "i"),
    `UAT bisnis ${businessItem} tidak boleh ditandai otomatis.`,
  );
}

assert.match(roadmap, /# Phase 12[\s\S]+- \[x\] unit/);
assert.match(roadmap, /# Phase 12[\s\S]+- \[ \] E2E booking pada staging/);
assert.match(roadmap, /# Phase 12[\s\S]+- \[ \] persetujuan UAT bisnis/);

assert.match(loginPage, /<h1[^>]*>[\s\S]*Login Admin[\s\S]*<\/h1>/);
assert.doesNotMatch(loginPage, /<CardTitle>Login Admin<\/CardTitle>/);
assert.match(
  forbiddenPage,
  /<h1[^>]*>[\s\S]*Akses admin ditolak[\s\S]*<\/h1>/,
);

for (const contract of [
  "PHASE12_BASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "single-active-admin",
  "private-proof-bucket",
  "anon-booking-denied",
  "whatsapp-runtime-config",
]) {
  assert.match(
    stagingRunner,
    new RegExp(contract),
    `Preflight staging belum memeriksa ${contract}.`,
  );
}

console.log(
  "Phase 12 validation passed: consolidated regression, staging preflight contract, manual QA evidence, UAT gates, and auth heading fix verified.",
);
