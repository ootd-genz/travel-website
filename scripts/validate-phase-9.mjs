import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  formatBookingWaitingVerificationMessage,
  getBookingWaitingVerificationTemplateParameters,
} from "../src/lib/notifications/whatsapp/formatter.ts";
import { sendMetaCloudApiTemplate } from "../src/lib/notifications/whatsapp/meta-cloud-api.ts";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const message = formatBookingWaitingVerificationMessage({
  bookingId: "1f7f301b-69a9-42a8-bb23-b48e1e0bf3a1",
  bookingCode: "TRV-20260729-AB12CD",
  customerName: "Budi Santoso",
  packageName: "Pesona Ubud 3 Hari",
  departureDate: "2026-08-17",
  travelerCount: 2,
  totalAmount: 2_750_000,
  currency: "IDR",
  appUrl: "https://travelbali.com",
});

for (const expected of [
  "Budi Santoso",
  "Pesona Ubud 3 Hari",
  "TRV-20260729-AB12CD",
  "17 Agustus 2026",
  "Jumlah traveler: 2",
  "Rp",
  "2.750.000",
  "Menunggu verifikasi pembayaran",
  "https://travelbali.com/admin/bookings/1f7f301b-69a9-42a8-bb23-b48e1e0bf3a1",
]) {
  assert.match(message, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.doesNotMatch(message, /signed|transfer_proof|storage/i);

const providerConfig = {
  apiBaseUrl: "https://graph.facebook.com",
  apiVersion: "v25.0",
  accessToken: "test-token-never-sent",
  phoneNumberId: "123456789",
  timeoutMs: 20,
};
const templateMessage = {
  destinationNumber: "6282261060675",
  templateName: "booking_waiting_verification",
  languageCode: "id",
  bodyParameters: getBookingWaitingVerificationTemplateParameters({
    bookingId: "1f7f301b-69a9-42a8-bb23-b48e1e0bf3a1",
    bookingCode: "TRV-20260729-AB12CD",
    customerName: "Budi Santoso",
    packageName: "Pesona Ubud 3 Hari",
    departureDate: "2026-08-17",
    travelerCount: 2,
    totalAmount: 2_750_000,
    currency: "IDR",
    appUrl: "https://travelbali.com",
  }),
};

let capturedUrl = "";
let capturedRequest;
const successfulSend = await sendMetaCloudApiTemplate(
  providerConfig,
  templateMessage,
  async (input, init) => {
    capturedUrl = String(input);
    capturedRequest = init;
    return new Response(
      JSON.stringify({ messages: [{ id: "wamid.phase9-success" }] }),
      { status: 200 },
    );
  },
);
assert.deepEqual(successfulSend, {
  ok: true,
  providerMessageId: "wamid.phase9-success",
});
assert.equal(
  capturedUrl,
  "https://graph.facebook.com/v25.0/123456789/messages",
);
assert.equal(capturedRequest?.method, "POST");
assert.equal(
  capturedRequest?.headers.Authorization,
  "Bearer test-token-never-sent",
);
const requestBody = JSON.parse(String(capturedRequest?.body));
assert.equal(requestBody.messaging_product, "whatsapp");
assert.equal(requestBody.to, "6282261060675");
assert.equal(requestBody.type, "template");
assert.equal(requestBody.template.name, "booking_waiting_verification");
assert.equal(requestBody.template.language.code, "id");
assert.deepEqual(
  requestBody.template.components[0].parameters.map(
    (parameter) => parameter.text,
  ),
  templateMessage.bodyParameters,
);

const permanentFailure = await sendMetaCloudApiTemplate(
  providerConfig,
  templateMessage,
  async () =>
    new Response(JSON.stringify({ error: { code: 190 } }), { status: 401 }),
);
assert.deepEqual(permanentFailure, {
  ok: false,
  errorCode: "meta_190",
  retryable: false,
});

const retryableFailure = await sendMetaCloudApiTemplate(
  providerConfig,
  templateMessage,
  async () =>
    new Response(JSON.stringify({ error: { code: 2 } }), { status: 503 }),
);
assert.deepEqual(retryableFailure, {
  ok: false,
  errorCode: "meta_2",
  retryable: true,
});

const timeoutFailure = await sendMetaCloudApiTemplate(
  providerConfig,
  templateMessage,
  (_input, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      });
    }),
);
assert.deepEqual(timeoutFailure, {
  ok: false,
  errorCode: "provider_timeout",
  retryable: true,
});

const bookingAction = read("src/actions/booking.ts");
const adminAction = read("src/actions/admin-booking.ts");
const service = read("src/lib/notifications/whatsapp/service.ts");
const migration = read(
  "src/migrations/011_whatsapp_notification_delivery.sql",
);
const detailPage = read(
  "src/app/(admin)/admin/bookings/[id]/page.tsx",
);
const bookingTable = read(
  "src/app/(admin)/admin/bookings/_components/booking-table.tsx",
);
const envConfig = read("src/configs/env.ts");

assert.match(
  bookingAction,
  /outcome\.outcome === "already_submitted"[\s\S]+else if \(outcome\.booking_id\)[\s\S]+sendBookingWaitingVerificationNotification/,
);
assert.match(service, /WHATSAPP_WAITING_VERIFICATION_EVENT/);
assert.match(service, /MAX_DELIVERY_ATTEMPTS = 3/);
assert.match(service, /provider_configuration_invalid/);
assert.doesNotMatch(
  service,
  /console\.(?:log|error)\([^\n]*(?:WHATSAPP_ACCESS_TOKEN|accessToken)/,
);

assert.match(migration, /create or replace function public\.claim_whatsapp_notification/i);
assert.match(migration, /create or replace function public\.finalize_whatsapp_notification/i);
assert.match(migration, /for update/i);
assert.match(migration, /on conflict \(booking_id, channel, event_type\) do nothing/i);
assert.match(migration, /attempt_count = attempt_count \+ 1/i);
assert.match(migration, /interval '1 minute'/i);
assert.match(migration, /interval '5 minutes'/i);
assert.match(migration, /grant execute[\s\S]+to service_role/i);
assert.doesNotMatch(migration, /\bbegin\s*;/i);
assert.doesNotMatch(migration, /\bcommit\s*;/i);

assert.match(adminAction, /retryWhatsAppNotificationAction/);
assert.match(adminAction, /await requireAdmin\(\)/);
assert.match(detailPage, /RetryWhatsAppNotificationButton/);
assert.match(detailPage, /Retry dinonaktifkan/);
assert.match(bookingTable, /Notifikasi WA gagal/);
assert.match(envConfig, /WHATSAPP_GRAPH_API_VERSION/);
assert.match(envConfig, /WHATSAPP_ACCESS_TOKEN/);
assert.match(envConfig, /WHATSAPP_PHONE_NUMBER_ID/);
assert.match(envConfig, /WHATSAPP_TEMPLATE_NAME/);
assert.match(envConfig, /WHATSAPP_TEMPLATE_LANGUAGE/);

console.log(
  "Phase 9 checks passed: message fields and admin deep link, Meta adapter success/4xx/5xx/timeout mapping, post-submit trigger, atomic delivery claim, bounded retry, and failure UI verified.",
);
