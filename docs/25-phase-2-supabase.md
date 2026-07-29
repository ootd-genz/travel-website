# Phase 2 — Supabase Schema, Migration, RLS & Storage

Dokumen ini mencatat implementasi Phase 2 berdasarkan seluruh requirement di folder
`docs/`, terutama model data, booking contract, single-admin authorization, dan
keamanan upload.

## Implementasi

Empat migration berurutan tersedia di `src/migrations/`:

1. `001_create_content_schema.sql`
   - helper `updated_at` dan helper authorization `private.is_active_admin()`;
   - `admin_users` dengan batas satu admin aktif;
   - singleton `site_settings` dan `homepage_content`;
   - USP, destination, activity, trip type, trip, promotion, blog;
   - seluruh junction table yang dibutuhkan relasi paket dan blog;
   - constraint status, slug, harga, peserta, rank, coordinate, periode promo,
     JSON shape, serta index awal sesuai pola query dokumentasi.
2. `002_create_booking_schema.sql`
   - booking draft dan snapshot komersial immutable;
   - token publik hanya disimpan sebagai hash SHA-256;
   - customer, transfer, consent, status, dan retention anchor;
   - participant, append-style booking event, dan notification delivery;
   - idempotency notification berdasarkan booking + channel + event;
   - index dashboard, draft expiry, search WhatsApp, audit, retry, dan retention.
3. `003_enable_rls_and_private_storage.sql`
   - RLS aktif pada 21 tabel schema `public`;
   - anon/authenticated biasa hanya membaca konten published/active;
   - booking, customer, event, dan notification tidak dapat dibaca anon;
   - mutation dan private read hanya untuk user yang tercatat aktif di
     `admin_users`;
   - bucket `booking-transfer-proofs` selalu private, maksimum 5 MiB, dengan
     allowlist JPEG/PNG/PDF;
   - tidak membuat policy pada tabel internal `storage.objects` yang dimiliki role
     terkelola Supabase;
   - signed URL, upload, dan delete hanya melalui service role server-side setelah
     authorization dan validasi aplikasi.
4. `004_seed_business_settings.sql`
   - BCA `87654321` atas nama `Muhammad Fulan`;
   - nomor WhatsApp admin `6282261060675`;
   - tidak ada credential provider atau secret pada database.

## Keputusan Keamanan

- Role `anon` tidak mendapat privilege `SELECT` pada tabel booking. Ini menjadi
  lapisan tambahan di luar RLS deny-by-default.
- Authenticated non-admin memiliki privilege yang dibutuhkan API, tetapi policy RLS
  tetap menghasilkan nol row/menolak mutation karena bukan active admin.
- Service role hanya dipakai pada server dan tetap tidak muncul pada client bundle.
- Snapshot paket, harga, promo, traveler, total, currency, tanggal, dan versi harga
  tidak dapat diubah setelah booking dibuat.
- `terminal_at` dikelola trigger dari status terminal dan menjadi anchor retensi
  bukti transfer 24 bulan. Job penghapusan dijadwalkan pada phase operasional
  berikutnya; schema telah menyiapkan `transfer_proof_deleted_at` dan audit event.
- Storage path menyimpan object key private, bukan URL publik atau signed URL.
- Tidak ada akses object langsung untuk role anon/authenticated. Signed URL admin
  dibuat server-side setelah `requireAdmin()`, sehingga migration tidak perlu
  mengambil ownership atau mengubah policy tabel internal Supabase Storage.

## Environment

`.env.local` sudah dinormalisasi ke format `KEY=value` tanpa mengubah nilai
credential Supabase. Konfigurasi Phase 2 ditambahkan untuk TTL draft, batas upload,
MIME allowlist, routing WhatsApp, dan default rekening. `src/configs/env.ts`
memvalidasi seluruh nilai ini, termasuk `APP_URL` sebagai origin tanpa path/query.

## QA

Tersedia dua lapis test:

- `npm run test:phase2:static` memeriksa urutan migration, keberadaan 21 tabel,
  aktivasi RLS, least-privilege grant, private bucket, allowlist, satu admin aktif,
  dan proteksi snapshot.
- `supabase/tests/database/phase_2_schema_and_rls.test.sql` adalah pgTAP integration
  test untuk anon, authenticated non-admin, active admin, private booking, draft
  content, private bucket, dan immutability snapshot.

Hasil lokal pada 29 Juli 2026:

| Pemeriksaan | Hasil |
|---|---|
| `npm run lint` | Lulus |
| `npm run typecheck` | Lulus |
| `npm run test:phase2:static` | Lulus — 4 migration, 21 tabel RLS |
| PostgreSQL syntax parser | Lulus — 4 file migration berhasil diparse |
| `npm run build` | Lulus — 8 route aplikasi + proxy |
| Format `.env.local` | Lulus — seluruh entry memakai `KEY=value` |
| Remote schema | Lulus — 21 tabel Phase 2 tersedia melalui service role server-only |
| Remote public content | Lulus — anon dapat membaca endpoint destination (`200`) |
| Remote private booking | Lulus — anon ditolak saat membaca booking (`401`) |
| Remote transfer-proof bucket | Lulus — private, maksimum 5 MiB, allowlist JPEG/PNG/PDF |
| pgTAP authenticated fixture | Test tersedia untuk pipeline local/staging ketika Postgres test runner tersedia |

## Verifikasi Lanjutan di Pipeline/Staging

Implementasi dan smoke test kritis Phase 2 sudah selesai. Pipeline database
local/staging berikutnya tetap menjalankan pemeriksaan pertahanan berlapis:

1. jalankan pgTAP test dan `supabase db lint` pada database test/staging;
2. buat satu akun Supabase Auth admin secara terkontrol pada Phase 3 lalu masukkan UUID ke
   `admin_users`;
3. ulangi negative test dengan authenticated non-admin setelah auth fixture tersedia;
4. ketika preview bukti dibangun pada Phase 8, pastikan public URL tetap tidak dapat
   dipakai dan signed URL hanya dibuat server-side setelah authorization admin.

Keempat migration telah terdeteksi pada remote Supabase melalui pemeriksaan read-only;
tidak ada credential atau data private yang dicetak selama verifikasi.
