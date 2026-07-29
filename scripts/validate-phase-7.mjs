import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  TransferProofError,
  validateTransferProofFile,
} from "../src/lib/booking/proof-validation.ts";
import {
  normalizeCustomerWhatsapp,
  submitBookingSchema,
} from "../src/validations/booking.ts";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

assert.equal(normalizeCustomerWhatsapp("0812 3456-7890"), "6281234567890");
assert.equal(normalizeCustomerWhatsapp("+62 812 3456 7890"), "6281234567890");
assert.equal(normalizeCustomerWhatsapp("abc"), null);

const validSubmission = submitBookingSchema.safeParse({
  customerName: "Budi Santoso",
  customerWhatsapp: "0812 3456 7890",
  customerEmail: "BUDI@example.com",
  customerCity: "",
  participantNames: ["Budi Santoso", "Sari Santoso"],
  senderBankName: "BCA",
  senderAccountName: "Budi Santoso",
  declaredTransferAmount: "2750000",
  transferredAt: "2026-07-29T10:30",
  customerNotes: "",
  consentDataIsCorrect: "on",
  consentPaymentRequiresVerification: "on",
});
assert.equal(validSubmission.success, true);
if (validSubmission.success) {
  assert.equal(validSubmission.data.customerWhatsapp, "6281234567890");
  assert.equal(validSubmission.data.customerEmail, "budi@example.com");
  assert.equal(validSubmission.data.declaredTransferAmount, "2750000.00");
  assert.equal(validSubmission.data.customerCity, null);
}

assert.equal(
  submitBookingSchema.safeParse({
    customerName: "B",
    customerWhatsapp: "invalid",
    customerEmail: "invalid",
    customerCity: "",
    participantNames: [],
    senderBankName: "",
    senderAccountName: "",
    declaredTransferAmount: "1,000",
    transferredAt: "invalid",
    customerNotes: "",
    consentDataIsCorrect: null,
    consentPaymentRequiresVerification: null,
  }).success,
  false,
);

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];
const proofConfig = { maxBytes: 64, allowedTypes };

const jpeg = new File(
  [new Uint8Array([0xff, 0xd8, 0xff, 0xe0])],
  "transfer.JPG",
  { type: "image/jpeg" },
);
const png = new File(
  [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  "transfer.png",
  { type: "image/png" },
);
const pdf = new File(["%PDF-1.7"], "transfer.pdf", {
  type: "application/pdf",
});

assert.equal((await validateTransferProofFile(jpeg, proofConfig)).extension, "jpg");
assert.equal((await validateTransferProofFile(png, proofConfig)).extension, "png");
assert.equal((await validateTransferProofFile(pdf, proofConfig)).extension, "pdf");

async function assertProofError(file, code, config = proofConfig) {
  await assert.rejects(
    () => validateTransferProofFile(file, config),
    (error) => error instanceof TransferProofError && error.code === code,
  );
}

await assertProofError(
  new File([new Uint8Array(65)], "large.jpg", { type: "image/jpeg" }),
  "too_large",
);
await assertProofError(
  new File(["hello"], "proof.txt", { type: "text/plain" }),
  "invalid_type",
);
await assertProofError(
  new File(["not-a-pdf"], "proof.pdf", { type: "application/pdf" }),
  "invalid_signature",
);
await assertProofError(
  new File(["%PDF-1.7"], "proof.jpg", { type: "application/pdf" }),
  "invalid_extension",
);

const action = read("src/actions/booking.ts");
const proofs = read("src/lib/booking/proofs.ts");
const submissions = read("src/lib/booking/submissions.ts");
const form = read(
  "src/app/(public)/booking/[token]/_components/booking-submission-form.tsx",
);
const bookingPage = read("src/app/(public)/booking/[token]/page.tsx");
const successPage = read(
  "src/app/(public)/booking/[token]/success/page.tsx",
);
const migration = read("src/migrations/009_submit_booking_atomically.sql");
const storageMigration = read(
  "src/migrations/003_enable_rls_and_private_storage.sql",
);
const config = read("next.config.ts");

for (const field of [
  "customerName",
  "customerWhatsapp",
  "customerEmail",
  "customerCity",
  "participantNames",
  "senderBankName",
  "senderAccountName",
  "declaredTransferAmount",
  "transferredAt",
  "transferProof",
  "customerNotes",
  "consentDataIsCorrect",
  "consentPaymentRequiresVerification",
]) {
  assert.match(form, new RegExp(`name="${field}"`), `${field} belum ada di form.`);
}

assert.match(bookingPage, /getBookingPaymentInstructions/);
assert.match(submissions, /bank_name,bank_account_number,bank_account_holder/);
assert.match(bookingPage, /draft\.totalAmount/);
assert.match(bookingPage, /payment\.bank_account_number/);
assert.match(bookingPage, /payment\.bank_account_holder/);
assert.match(form, /accept="\.jpg,\.jpeg,\.png,\.pdf/);
assert.match(form, /disabled=\{pending\}/);
assert.match(config, /bodySizeLimit: "6mb"/);

assert.match(proofs, /booking-transfer-proofs/);
assert.match(proofs, /randomUUID\(\)/);
assert.match(proofs, /upsert: false/);
assert.doesNotMatch(proofs, /getPublicUrl|createSignedUrl/);
assert.match(storageMigration, /'booking-transfer-proofs'[\s\S]+?false/);

assert.match(action, /cleanupUploadedProof\(uploadedPath\)/);
assert.match(action, /outcome\.outcome === "already_submitted"/);
assert.match(action, /outcome\.outcome === "expired"/);
assert.match(action, /outcome\.outcome === "amount_mismatch"/);
assert.match(action, /redirect\(`\/booking\/\$\{parsedToken\.data\}\/success`\)/);

assert.match(migration, /for update/i);
assert.match(migration, /status = 'waiting_verification'/i);
assert.match(migration, /insert into public\.booking_participants/i);
assert.match(migration, /'booking_submitted'/i);
assert.match(migration, /'already_submitted'/i);
assert.match(migration, /draft_expires_at <= now\(\)/i);
assert.match(migration, /to service_role/i);
assert.match(migration, /from public, anon, authenticated/i);

assert.match(successPage, /robots: \{ index: false, follow: false \}/);
assert.match(successPage, /booking\.bookingCode/);
assert.match(successPage, /Menunggu Verifikasi/);
assert.doesNotMatch(successPage, /transfer_proof_path|getPublicUrl|createSignedUrl/);

console.log(
  "Phase 7 checks passed: customer/consent validation, exact transfer metadata, private proof signature/size/type validation, atomic locked submit, orphan cleanup, duplicate/expiry handling, and safe success page verified.",
);
