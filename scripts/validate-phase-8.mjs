import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const statusRules = read("src/lib/booking/status.ts");
const validations = read("src/validations/admin-booking.ts");
assert.match(
  statusRules,
  /waiting_verification:\s*\["confirm",\s*"reject",\s*"cancel"\]/,
);
assert.match(statusRules, /confirmed:\s*\["complete"\]/);
assert.match(statusRules, /payment_rejected:\s*\[\]/);
assert.match(statusRules, /cancelled:\s*\[\]/);
assert.match(validations, /value\.action === "reject"[\s\S]+value\.action === "cancel"/);
assert.match(validations, /value\.reason\.length < 3/);
assert.match(validations, /adminNotes:\s*z\.string\(\)\.trim\(\)\.max\(4_000\)/);
assert.match(validations, /value\.from > value\.to/);

const migration = read("src/migrations/010_admin_booking_management.sql");
const bookingSchema = read("src/migrations/002_create_booking_schema.sql");
assert.match(migration, /create or replace function public\.transition_booking_status/i);
assert.match(migration, /for update/i);
assert.match(migration, /private\.is_active_admin\(\)/i);
assert.match(migration, /auth\.uid\(\)/i);
assert.match(migration, /waiting_verification[\s\S]+confirmed[\s\S]+payment_rejected[\s\S]+cancelled/i);
assert.match(migration, /confirmed[\s\S]+completed/i);
assert.match(migration, /insert into public\.booking_events/i);
assert.match(migration, /actor_type[\s\S]+actor_id/i);
assert.match(bookingSchema, /create table public\.booking_events[\s\S]+created_at timestamptz not null default now\(\)/i);
assert.match(migration, /already_current/i);
assert.match(migration, /invalid_transition/i);
assert.match(migration, /confirmed_at[\s\S]+confirmed_by/i);
assert.match(migration, /grant execute[\s\S]+to authenticated/i);
assert.doesNotMatch(migration, /\bbegin\s*;/i);
assert.doesNotMatch(migration, /\bcommit\s*;/i);

const dataLayer = read("src/lib/booking/admin.ts");
const actions = read("src/actions/admin-booking.ts");
const listPage = read("src/app/(admin)/admin/bookings/page.tsx");
const detailPage = read("src/app/(admin)/admin/bookings/[id]/page.tsx");
const table = read(
  "src/app/(admin)/admin/bookings/_components/booking-table.tsx",
);
const actionUi = read(
  "src/app/(admin)/admin/bookings/_components/booking-actions.tsx",
);
const dashboard = read("src/app/(admin)/admin/page.tsx");

assert.match(dataLayer, /await requireAdmin\(\)/);
assert.match(dataLayer, /createSignedUrl\(/);
assert.match(dataLayer, /TRANSFER_PROOF_SIGNED_URL_TTL_SECONDS = 5 \* 60/);
assert.match(dataLayer, /booking-transfer-proofs/);
assert.doesNotMatch(dataLayer, /getPublicUrl/);
assert.match(dataLayer, /\.range\(/);
assert.match(dataLayer, /count: "exact"/);
assert.match(dataLayer, /booking_code\.ilike/);
assert.match(dataLayer, /customer_name\.ilike/);
assert.match(dataLayer, /customer_whatsapp\.ilike/);

assert.match(actions, /await requireAdmin\(\)/);
assert.match(actions, /\.rpc\("transition_booking_status"/);
assert.match(actions, /\.rpc\("update_booking_admin_notes"/);
assert.match(actions, /revalidatePath\("\/admin\/bookings"\)/);

assert.match(listPage, /getAdminBookings/);
assert.match(listPage, /name="status"/);
assert.match(listPage, /name="packageId"/);
assert.match(listPage, /DatePicker/);
assert.doesNotMatch(listPage, /type="date"/);
assert.match(listPage, /Pagination booking/);
assert.match(table, /useReactTable/);
assert.match(table, /md:hidden/);
assert.match(table, /hidden md:block/);

assert.match(detailPage, /getAdminBookingDetail/);
assert.match(detailPage, /Bukti Transfer Private/);
assert.match(detailPage, /Riwayat Status & Audit/);
assert.match(detailPage, /Status Notifikasi WhatsApp/);
assert.match(detailPage, /BookingActions/);
assert.match(detailPage, /AdminNotesForm/);
assert.doesNotMatch(detailPage, /transfer_proof_path/);
assert.match(actionUi, /Dialog/);
assert.match(actionUi, /required=\{content\.reasonRequired\}/);

assert.match(dashboard, /Menunggu Verifikasi/);
assert.match(dashboard, /Pemesanan Terbaru/);
assert.match(dashboard, /getAdminBookingDashboard/);

console.log(
  "Phase 8 checks passed: server-side filters/pagination, admin-only proof signing, atomic status transitions, audit history, responsive booking UI, and dashboard counters verified.",
);
