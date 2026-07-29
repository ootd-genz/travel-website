# Route, Server Action & Integration Contract

Dokumen ini menjelaskan kontrak konseptual. Nama function final dapat menyesuaikan codebase existing.

## Public Routes

```text
/
/blog
/blog/[slug]
/activities
/activities/[slug]
/destination
/destination/[slug]
/trip-types
/trip-types/[slug]
/trips/[slug]
/booking/[token]
/booking/[token]/success
```

## Admin Routes

```text
/admin/login
/admin
/admin/bookings
/admin/bookings/[id]
/admin/trips
/admin/destinations
/admin/activities
/admin/trip-types
/admin/blog
/admin/promotions
/admin/home
/admin/settings
```

Semua `/admin/*` kecuali login private + noindex.

## Server Operations — Public

### `createBookingDraft`

Input minimum:

- package identifier;
- traveler count;
- departure selection bila relevan.

Server:

- validasi paket aktif;
- cek availability;
- hitung harga;
- buat snapshot;
- buat token + expiry;
- return safe booking summary.

### `submitBooking`

Input:

- token;
- customer form;
- transfer data;
- proof file.

Server:

- validate;
- deduplicate;
- store proof;
- save booking;
- set `waiting_verification`;
- enqueue/trigger WhatsApp send setelah booking aman.

## Server Operations — Admin

Semua wajib `requireAdmin()`:

- list/get bookings;
- confirm payment;
- reject payment;
- cancel booking;
- complete booking;
- retry WhatsApp notification;
- CRUD content;
- update site settings.

## Status HTTP / Error Semantics

Jika menggunakan Route Handler:

- 400 validation;
- 401 unauthenticated;
- 403 non-admin;
- 404 resource/token tidak ditemukan;
- 409 duplicate/invalid state transition;
- 413 file terlalu besar;
- 429 rate limited;
- 5xx unexpected server/provider error.

Client menerima pesan aman, bukan SQL error/stack trace.

## WhatsApp Integration

Module khusus server-side. Terapkan timeout, validation response, provider error mapping, dan idempotency.

## Revalidation

Mutation admin pada public content memicu revalidation yang spesifik, misalnya:

- paket → detail package + Home bila popular/featured + related entity pages;
- blog → `/blog`, detail artikel, Home bila show_on_home;
- destination → `/destination`, detail, Home bila popular.

Hindari invalidasi seluruh aplikasi tanpa kebutuhan.
