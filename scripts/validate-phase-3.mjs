import { readFileSync } from "node:fs";
import { join } from "node:path";

function read(path) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const migration = read("src/migrations/005_create_admin_auth_security.sql");
const action = read("src/actions/admin-auth.ts");
const authorization = read("src/lib/auth/require-admin.ts");
const proxy = read("src/lib/supabase/proxy.ts");
const adminLayout = read("src/app/(admin)/admin/layout.tsx");
const adminPage = read("src/app/(admin)/admin/page.tsx");
const loginPage = read("src/app/(auth)/admin/login/page.tsx");

for (const table of ["admin_login_rate_limits", "admin_auth_events"]) {
  assert(
    new RegExp(`create\\s+table\\s+public\\.${table}`, "i").test(migration),
    `Tabel ${table} belum tersedia.`,
  );
  assert(
    new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, "i").test(migration),
    `RLS ${table} belum aktif.`,
  );
}

assert(/consume_admin_login_rate_limit/i.test(migration), "RPC rate limit belum tersedia.");
assert(
  /grant execute[\s\S]+to service_role/i.test(migration) &&
    !/grant execute[\s\S]+to anon/i.test(migration),
  "RPC rate limit harus service-role-only.",
);
assert(/signInWithPassword/.test(action), "Login Supabase belum diimplementasikan.");
assert(/signOut/.test(action), "Logout Supabase belum diimplementasikan.");
assert(/consumeAdminLoginAttempt/.test(action), "Login belum dilindungi rate limit.");
assert(/writeAdminAuthEvent/.test(action), "Login/logout belum memiliki audit.");
assert(/auth\.getUser\(\)/.test(authorization), "Session server belum diverifikasi dengan getUser().");
assert(/\.eq\("is_active", true\)/.test(authorization), "Allowlist admin aktif belum diverifikasi.");
assert(/requireAdminPage/.test(adminLayout), "Layout admin belum diproteksi.");
assert(/requireAdmin\(\)/.test(adminPage), "Data/page admin belum memakai requireAdmin().");
assert(/getSafeAdminRedirect/.test(loginPage), "Redirect login belum divalidasi.");
assert(/getClaims\(\)/.test(proxy), "Proxy belum memverifikasi session claim.");
assert(/X-Robots-Tag/.test(proxy), "Header noindex admin belum tersedia.");

console.log("Phase 3 static validation passed: auth, authorization, rate limit, audit, logout, and noindex controls verified.");

