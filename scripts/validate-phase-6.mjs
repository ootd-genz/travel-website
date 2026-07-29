import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { calculatePriceSnapshot } from "../src/lib/booking/pricing.ts";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const now = new Date("2026-07-29T04:00:00.000Z");

const fixedWins = calculatePriceSnapshot({
  basePrice: "1000.00",
  salePrice: "900.00",
  priceUnit: "per_person",
  travelerCount: 3,
  now,
  promotions: [
    {
      id: "promo-percent",
      name: "Diskon 10%",
      discountType: "percentage",
      discountValue: "10.00",
      startsAt: "2026-07-01T00:00:00.000Z",
      endsAt: null,
      isActive: true,
    },
    {
      id: "promo-fixed",
      name: "Potongan 300",
      discountType: "fixed",
      discountValue: "300.00",
      startsAt: "2026-07-20T00:00:00.000Z",
      endsAt: null,
      isActive: true,
    },
  ],
});
assert.deepEqual(
  {
    unitPrice: fixedWins.unitPrice,
    subtotal: fixedWins.subtotalAmount,
    discount: fixedWins.discountAmount,
    total: fixedWins.totalAmount,
    promotion: fixedWins.promotion?.id,
  },
  {
    unitPrice: "900.00",
    subtotal: "2700.00",
    discount: "300.00",
    total: "2400.00",
    promotion: "promo-fixed",
  },
);

const perPackage = calculatePriceSnapshot({
  basePrice: "6250000.00",
  salePrice: null,
  priceUnit: "per_package",
  travelerCount: 2,
  now,
  promotions: [],
});
assert.equal(
  perPackage.subtotalAmount,
  "6250000.00",
  "Harga per paket tidak boleh dikali traveler.",
);

const cappedDiscount = calculatePriceSnapshot({
  basePrice: "100.00",
  salePrice: null,
  priceUnit: "per_person",
  travelerCount: 1,
  now,
  promotions: [
    {
      id: "too-large",
      name: "Potongan besar",
      discountType: "fixed",
      discountValue: "500.00",
      startsAt: "2026-07-01T00:00:00.000Z",
      endsAt: null,
      isActive: true,
    },
  ],
});
assert.equal(cappedDiscount.totalAmount, "0.00");

const tieBreaker = calculatePriceSnapshot({
  basePrice: "1000.00",
  salePrice: null,
  priceUnit: "per_person",
  travelerCount: 1,
  now,
  promotions: [
    {
      id: "b-promo",
      name: "B",
      discountType: "fixed",
      discountValue: "100.00",
      startsAt: "2026-07-01T00:00:00.000Z",
      endsAt: null,
      isActive: true,
    },
    {
      id: "a-promo",
      name: "A",
      discountType: "percentage",
      discountValue: "10.00",
      startsAt: "2026-07-01T00:00:00.000Z",
      endsAt: null,
      isActive: true,
    },
    {
      id: "expired-promo",
      name: "Expired",
      discountType: "fixed",
      discountValue: "900.00",
      startsAt: "2026-06-01T00:00:00.000Z",
      endsAt: "2026-07-01T00:00:00.000Z",
      isActive: true,
    },
  ],
});
assert.equal(
  tieBreaker.promotion?.id,
  "a-promo",
  "ID harus menjadi tie-breaker terakhir setelah nominal dan starts_at sama.",
);

const draftLayer = read("src/lib/booking/drafts.ts");
const bookingAction = read("src/actions/booking.ts");
const draftForm = read(
  "src/app/(public)/trips/[slug]/_components/booking-draft-form.tsx",
);
const summaryPage = read("src/app/(public)/booking/[token]/page.tsx");
const tripPage = read("src/app/(public)/trips/[slug]/page.tsx");
const migration = read("src/migrations/008_add_booking_departure_snapshot.sql");

assert.match(draftLayer, /randomBytes\(32\)\.toString\("base64url"\)/);
assert.match(draftLayer, /createHash\("sha256"\)/);
assert.match(draftLayer, /status !== "published"/);
assert.match(draftLayer, /trip\.min_participants/);
assert.match(draftLayer, /trip\.max_participants/);
assert.match(draftLayer, /validDepartureOptions\.includes/);
assert.match(draftLayer, /calculatePriceSnapshot/);
assert.match(draftLayer, /BOOKING_DRAFT_TTL_MINUTES/);
assert.match(draftLayer, /status: "expired"/);
assert.match(draftLayer, /event_type: "draft_expired"/);
assert.doesNotMatch(
  bookingAction,
  /formData\.get\("(?:price|total|discount|subtotal)/i,
  "Action tidak boleh membaca harga atau total dari browser.",
);
assert.doesNotMatch(
  draftForm,
  /name="(?:price|total|discount|subtotal)/i,
  "Form browser tidak boleh mengirim field harga.",
);
assert.match(tripPage, /BookingDraftForm/);
assert.doesNotMatch(tripPage, /booking-phase-note|disabled[^>]+Pesan Sekarang/);
assert.match(summaryPage, /robots: \{ index: false, follow: false \}/);
assert.match(summaryPage, /noStore\(\)/);
assert.match(summaryPage, /draft\.totalAmount/);
assert.doesNotMatch(summaryPage, /public_token_hash|transfer_proof/);
assert.match(migration, /departure_option_snapshot/);
assert.match(migration, /protect_booking_snapshot/);

console.log(
  "Phase 6 checks passed: exact price snapshots, deterministic promotions, secure token hashing, server-only totals, expiry, immutable departure snapshot, CTA, and noindex summary verified.",
);
