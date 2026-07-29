# Testing & QA Plan

## Strategi

Prioritas test mengikuti risiko bisnis:

1. harga dan booking;
2. upload bukti transfer;
3. admin authorization;
4. status transition;
5. WhatsApp trigger;
6. content CRUD;
7. SEO/accessibility/responsive.

## Unit Test

- price calculation;
- promo validity;
- booking status transition;
- booking code generator;
- phone normalization;
- WhatsApp message formatter;
- input schema validation.

## Integration Test

- create booking draft dengan harga server;
- tamper total dari client ditolak/diabaikan;
- submit booking valid;
- expired token;
- duplicate submit;
- upload validation;
- cleanup storage jika DB save gagal;
- admin-only booking read;
- admin update status;
- WhatsApp delivery record.

## RLS/Auth Test

- anon hanya membaca public content;
- anon tidak dapat membaca bookings;
- authenticated non-admin tidak dapat membuka admin data/action;
- admin valid dapat mengelola data;
- service role tidak pernah muncul di client bundle/response.

## E2E — Flow Kritis

### E2E 1 — Booking sukses

1. buka paket;
2. klik Pesan Sekarang;
3. ringkasan harga benar;
4. BCA 87654321 terlihat;
5. isi form;
6. upload bukti valid;
7. submit;
8. success page;
9. booking muncul admin;
10. notification delivery dibuat.

### E2E 2 — Harga dimanipulasi

Client mencoba mengubah total. Server tetap memakai total snapshot.

### E2E 3 — Bukti invalid

File oversized/format salah ditolak dengan error field yang jelas.

### E2E 4 — Admin confirm

Admin login → buka pending booking → confirm → status dan audit berubah.

### E2E 5 — WhatsApp gagal

Simulasi provider gagal. Booking tetap tersimpan dan dashboard menunjukkan notification failed/retry.

## UI QA

Test minimal:

- mobile kecil;
- tablet;
- laptop;
- desktop lebar;
- light mode;
- dark mode bila aktif;
- keyboard navigation;
- focus visible;
- long text;
- empty list;
- slow network/loading;
- server error.

## SEO QA

- metadata unique;
- canonical;
- sitemap;
- robots;
- admin/booking noindex;
- satu H1 utama;
- image alt;
- 404 benar, bukan soft-404.

## Security QA

- rate limit;
- auth bypass attempt;
- open redirect check;
- upload extension/MIME mismatch;
- XSS attempt pada field teks;
- SQL injection attempt tidak relevan pada parameterized client tetapi input tetap divalidasi;
- secret scan;
- CSP/security headers.

## Release Gate

Production tidak boleh deploy jika flow booking, admin auth, upload proof, atau pricing test kritis gagal.
