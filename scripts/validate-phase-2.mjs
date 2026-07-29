import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const migrationDirectory = join(process.cwd(), "src", "migrations");
const allMigrationFiles = readdirSync(migrationDirectory)
  .filter((file) => /^\d{3}_.+\.sql$/.test(file))
  .sort();

const expectedMigrationFiles = [
  "001_create_content_schema.sql",
  "002_create_booking_schema.sql",
  "003_enable_rls_and_private_storage.sql",
  "004_seed_business_settings.sql",
];

const migrationFiles = allMigrationFiles.filter((file) => file.startsWith("00") && file < "005_");

const expectedTables = [
  "admin_users",
  "site_settings",
  "homepage_content",
  "usp_items",
  "destinations",
  "activities",
  "trip_types",
  "trips",
  "trip_destinations",
  "trip_activities",
  "trip_trip_types",
  "promotions",
  "promotion_trips",
  "blog_posts",
  "blog_post_destinations",
  "blog_post_activities",
  "blog_post_trips",
  "bookings",
  "booking_participants",
  "booking_events",
  "notification_deliveries",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  JSON.stringify(migrationFiles) === JSON.stringify(expectedMigrationFiles),
  `Migration Phase 2 tidak berurutan atau tidak lengkap: ${migrationFiles.join(", ")}`,
);

const sql = migrationFiles
  .map((file) => readFileSync(join(migrationDirectory, file), "utf8"))
  .join("\n");

for (const table of expectedTables) {
  assert(
    new RegExp(`create\\s+table\\s+public\\.${table}\\s*\\(`, "i").test(sql),
    `Tabel public.${table} belum dibuat.`,
  );
  assert(
    new RegExp(
      `alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`,
      "i",
    ).test(sql),
    `RLS public.${table} belum diaktifkan.`,
  );
}

assert(
  /'booking-transfer-proofs'[\s\S]+?false,[\s\S]+?5242880/i.test(sql),
  "Bucket bukti transfer harus private dengan limit 5 MiB.",
);
assert(
  /array\['image\/jpeg',\s*'image\/png',\s*'application\/pdf'\]/i.test(sql),
  "Allowlist MIME bucket bukti transfer tidak lengkap.",
);
assert(
  /revoke\s+all\s+on\s+table[\s\S]+?public\.bookings[\s\S]+?from\s+anon,\s*authenticated/i.test(
    sql,
  ),
  "Hak akses tabel Phase 2 belum di-reset sebelum grant least privilege.",
);
assert(
  !/grant\s+select\s+on(?:\s+table)?[\s\S]{0,300}public\.bookings[\s\S]{0,80}to\s+anon/i.test(
    sql,
  ),
  "Anon tidak boleh mendapat SELECT langsung pada bookings.",
);
assert(
  !/create\s+policy[\s\S]{0,120}on\s+storage\.objects/i.test(sql),
  "Migration aplikasi tidak boleh mengubah policy tabel internal storage.objects.",
);
assert(
  /private bucket and no object policy/i.test(sql),
  "Strategi akses bukti transfer server-only belum didokumentasikan di migration.",
);
assert(
  /create\s+unique\s+index\s+admin_users_one_active_idx/i.test(sql),
  "Constraint satu admin aktif belum tersedia.",
);
assert(
  /create\s+or\s+replace\s+function\s+private\.protect_booking_snapshot/i.test(
    sql,
  ),
  "Snapshot komersial booking belum dilindungi dari update.",
);

const envExample = readFileSync(join(process.cwd(), "env.example"), "utf8");
for (const key of [
  "BOOKING_DRAFT_TTL_MINUTES",
  "TRANSFER_PROOF_MAX_BYTES",
  "TRANSFER_PROOF_ALLOWED_TYPES",
  "BANK_ACCOUNT_HOLDER",
]) {
  assert(new RegExp(`^${key}=.+$`, "m").test(envExample), `${key} belum ada di env.example.`);
}

console.log(
  `Phase 2 static validation passed: ${migrationFiles.length} migrations, ${expectedTables.length} RLS tables, and private storage controls verified.`,
);
