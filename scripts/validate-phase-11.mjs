import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { redactLogValue, sanitizeLogString } from "../src/lib/observability/redaction.ts";
import {
  TransferProofError,
  validateTransferProofFile,
} from "../src/lib/booking/proof-validation.ts";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const nextConfig = read("next.config.ts");
for (const directive of [
  "Content-Security-Policy",
  "default-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Strict-Transport-Security",
]) {
  assert.ok(nextConfig.includes(directive), `Security header ${directive} belum ada.`);
}
assert.match(nextConfig, /serverActions:\s*\{\s*bodySizeLimit:\s*"6mb"/s);
assert.match(nextConfig, /isHttpsProduction[\s\S]+APP_URL\?\.startsWith\("https:\/\/"\)/);

const packageJson = JSON.parse(read("package.json"));
assert.ok(
  Number(packageJson.dependencies.next.split(".")[2]) >= 11,
  "Next.js belum memakai patch keamanan 16.2.11 atau lebih baru.",
);

const proxy = read("src/proxy.ts");
assert.match(proxy, /x-request-id/);
assert.match(proxy, /crypto\.randomUUID\(\)/);
assert.match(proxy, /'strict-dynamic'/);
assert.match(proxy, /requestHeaders\.set\("x-nonce"/);
assert.match(
  read("src/app/(auth)/admin/forbidden/page.tsx"),
  /dynamic\s*=\s*"force-dynamic"/,
);
const instrumentation = read("src/instrumentation.ts");
assert.match(instrumentation, /onRequestError/);
assert.match(instrumentation, /reportUnhandledRequestError/);

const redacted = redactLogValue({
  authorization: "Bearer secret-token",
  customerEmail: "customer@example.com",
  nested: { token: "raw-token", message: "Hubungi +62 812-3456-7890" },
});
assert.deepEqual(redacted, {
  authorization: "[REDACTED]",
  customerEmail: "[REDACTED]",
  nested: { token: "[REDACTED]", message: "Hubungi [REDACTED]" },
});
assert.equal(
  sanitizeLogString("https://example.test/?token=abc123"),
  "https://example.test/?token=[REDACTED]",
);

const migration = read("src/migrations/013_security_hardening_observability.sql");
assert.match(migration, /create table public\.request_rate_limits/i);
assert.match(migration, /create or replace function public\.consume_request_rate_limit/i);
assert.match(migration, /to service_role/i);
assert.match(migration, /revoke insert on table public\.booking_events from authenticated/i);
assert.match(migration, /record_content_change_event/i);
assert.match(migration, /record_booking_proof_access/i);
for (const trigger of [
  "admin_auth_events_append_only",
  "content_change_events_append_only",
  "booking_events_append_only",
]) {
  assert.ok(migration.includes(trigger), `Trigger ${trigger} belum ada.`);
}

const bookingAction = read("src/actions/booking.ts");
assert.match(bookingAction, /consumeBookingDraftRateLimit/);
assert.match(bookingAction, /consumeBookingSubmitRateLimits/);
assert.ok(
  bookingAction.indexOf("consumeBookingSubmitRateLimits") <
    bookingAction.indexOf("uploadTransferProof(draftContext.bookingId"),
  "Rate limit submit harus berjalan sebelum upload.",
);
assert.match(bookingAction, /booking\.submit_rate_limited/);

const proofConfig = {
  maxBytes: 256,
  allowedTypes: ["image/png", "application/pdf"],
};
const oversizedDimensions = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
  0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x17, 0x70, 0x00, 0x00,
  0x17, 0x70,
]);
await assert.rejects(
  () =>
    validateTransferProofFile(
      new File([oversizedDimensions], "bomb.png", { type: "image/png" }),
      proofConfig,
    ),
  (error) => error instanceof TransferProofError && error.code === "unsafe_content",
);
await assert.rejects(
  () =>
    validateTransferProofFile(
      new File(
        ["%PDF-1.7\n1 0 obj\n<< /OpenAction 2 0 R /JavaScript (x) >>\n%%EOF"],
        "active.pdf",
        { type: "application/pdf" },
      ),
      proofConfig,
    ),
  (error) => error instanceof TransferProofError && error.code === "unsafe_content",
);

const bookingDetail = read("src/app/(admin)/admin/bookings/[id]/page.tsx");
assert.doesNotMatch(bookingDetail, /<iframe/);
const jsonLd = read("src/components/common/json-ld.tsx");
assert.match(jsonLd, /replace\(\/<\/g, "\\\\u003c"\)/);

const secretScan = spawnSync(process.execPath, ["scripts/scan-secrets.mjs"], {
  cwd: root,
  encoding: "utf8",
});
assert.equal(
  secretScan.status,
  0,
  secretScan.stderr || secretScan.stdout || "Secret scan gagal.",
);

console.log(
  "Phase 11 checks passed: headers/CSP, patched framework, correlation IDs, redacted structured logs, monitoring hook, durable rate limits, upload abuse checks, secret scan, and append-only admin audit verified.",
);
