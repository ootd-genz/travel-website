import { createClient } from "@supabase/supabase-js";

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
}

function present(name) {
  return typeof process.env[name] === "string" && process.env[name].trim() !== "";
}

async function checkHttp(name, url, validate, options = {}) {
  try {
    const response = await fetch(url, {
      redirect: options.redirect ?? "follow",
      signal: AbortSignal.timeout(15_000),
    });
    const body = options.readBody === false ? "" : await response.text();
    const outcome = validate(response, body);
    record(name, outcome.ok, outcome.detail);
  } catch (error) {
    record(name, false, error instanceof Error ? error.name : "request_failed");
  }
}

const baseValue = process.env.PHASE12_BASE_URL?.trim();
let baseUrl = null;

try {
  baseUrl = baseValue ? new URL(baseValue) : null;
  if (!baseUrl || baseUrl.pathname !== "/" || baseUrl.search || baseUrl.hash) {
    throw new Error("invalid_origin");
  }
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname);
  const localAllowed = process.env.PHASE12_ALLOW_LOCAL === "true";
  record(
    "staging-origin",
    baseUrl.protocol === "https:" || (isLocal && localAllowed),
    isLocal ? "local QA override" : `${baseUrl.protocol}//${baseUrl.host}`,
  );
} catch {
  record("staging-origin", false, "PHASE12_BASE_URL harus berupa origin staging HTTPS");
}

for (const name of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]) {
  record(`env:${name}`, present(name), present(name) ? "tersedia" : "kosong");
}

record(
  "whatsapp-runtime-config",
  [
    "WHATSAPP_GRAPH_API_VERSION",
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_TEMPLATE_NAME",
    "WHATSAPP_TEMPLATE_LANGUAGE",
  ].every(present),
  "credential hanya diperiksa keberadaannya dan tidak pernah dicetak",
);

if (baseUrl) {
  const origin = baseUrl.origin;

  for (const route of ["/", "/blog", "/activities", "/destination", "/trip-types", "/trips"]) {
    await checkHttp(`public:${route}`, `${origin}${route}`, (response, body) => {
      const h1Count = (body.match(/<h1\b/gi) ?? []).length;
      return {
        ok: response.status === 200 && h1Count === 1,
        detail: `status=${response.status}, h1=${h1Count}`,
      };
    });
  }

  await checkHttp(
    "security-headers",
    `${origin}/`,
    (response) => {
      const required = [
        "content-security-policy",
        "x-content-type-options",
        "referrer-policy",
        "x-frame-options",
        "permissions-policy",
        "x-request-id",
      ];
      const missing = required.filter((header) => !response.headers.get(header));
      return { ok: missing.length === 0, detail: missing.length ? `missing=${missing.join(",")}` : "lengkap" };
    },
    { readBody: false },
  );

  await checkHttp(
    "admin-auth-boundary",
    `${origin}/admin`,
    (response) => ({
      ok:
        [302, 303, 307, 308].includes(response.status) &&
        (response.headers.get("location") ?? "").startsWith("/admin/login") &&
        response.headers.get("x-robots-tag") === "noindex, nofollow",
      detail: `status=${response.status}, location=${response.headers.get("location") ?? "missing"}`,
    }),
    { redirect: "manual", readBody: false },
  );

  await checkHttp("not-found-status", `${origin}/phase12-route-not-found`, (response) => ({
    ok: response.status === 404,
    detail: `status=${response.status}`,
  }));

  await checkHttp("robots", `${origin}/robots.txt`, (response, body) => ({
    ok:
      response.status === 200 &&
      body.includes("Disallow: /admin/") &&
      body.includes("Disallow: /booking/"),
    detail: `status=${response.status}`,
  }));

  await checkHttp("sitemap-private-exclusion", `${origin}/sitemap.xml`, (response, body) => ({
    ok: response.status === 200 && !body.includes("/admin") && !body.includes("/booking"),
    detail: `status=${response.status}`,
  }));
}

if (
  present("NEXT_PUBLIC_SUPABASE_URL") &&
  present("NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
  present("SUPABASE_SERVICE_ROLE_KEY")
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const service = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const publicRead = await anon.from("destinations").select("id").limit(1);
  record("anon-public-content", !publicRead.error, publicRead.error?.code ?? "read allowed");

  const privateRead = await anon.from("bookings").select("id").limit(1);
  record("anon-booking-denied", Boolean(privateRead.error), privateRead.error?.code ?? "unexpected read");

  for (const [table, columns] of [
    ["bookings", "id,departure_option_snapshot,promotion_code_snapshot,terminal_at"],
    ["notification_deliveries", "id,attempt_count,next_attempt_at"],
    ["admin_auth_events", "id"],
    ["content_change_events", "id"],
    ["public_mutation_rate_limits", "id"],
  ]) {
    const query = await service.from(table).select(columns, { head: true, count: "exact" });
    record(
      `schema:${table}`,
      !query.error,
      query.error?.code ?? (query.error ? "query_failed" : "ready"),
    );
  }

  const admin = await service
    .from("admin_users")
    .select("id", { head: true, count: "exact" })
    .eq("is_active", true);
  record(
    "single-active-admin",
    !admin.error && admin.count === 1,
    admin.error?.code ?? `count=${admin.count ?? 0}`,
  );

  const settings = await service
    .from("site_settings")
    .select("bank_name,bank_account_number,bank_account_holder,admin_whatsapp_number")
    .eq("id", true)
    .maybeSingle();
  record(
    "business-settings",
    !settings.error &&
      settings.data?.bank_name === "BCA" &&
      settings.data?.bank_account_number === "87654321" &&
      Boolean(settings.data?.bank_account_holder) &&
      settings.data?.admin_whatsapp_number === "6282261060675",
    settings.error?.code ?? "nilai wajib tersedia",
  );

  const buckets = await service.storage.listBuckets();
  const proofBucket = buckets.data?.find((bucket) => bucket.id === "booking-transfer-proofs");
  record(
    "private-proof-bucket",
    !buckets.error && proofBucket?.public === false,
    buckets.error?.name ?? (proofBucket ? `public=${proofBucket.public}` : "bucket missing"),
  );
}

for (const result of results) {
  console.log(`${result.ok ? "PASS" : "FAIL"} ${result.name}: ${result.detail}`);
}

const failures = results.filter((result) => !result.ok);
if (failures.length) {
  console.error(`\nPhase 12 staging preflight gagal: ${failures.length} pemeriksaan belum siap.`);
  process.exitCode = 1;
} else {
  console.log(`\nPhase 12 staging preflight lulus: ${results.length} pemeriksaan read-only.`);
}
