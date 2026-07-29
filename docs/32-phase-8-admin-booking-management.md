# Phase 8 — Admin Booking Management

Dokumen ini mencatat implementasi Phase 8 berdasarkan seluruh requirement di
folder `docs/`, terutama PRD dashboard, workflow verifikasi booking, authorization
single admin, private proof, audit event, responsive table, dan validasi transisi
status.

## Implementasi

- Route `/admin/bookings` sekarang memuat tabel booking terbaru dengan:
  - pencarian kode booking, nama customer, atau nomor WhatsApp;
  - filter status, paket, serta rentang tanggal;
  - pagination server-side 20 row per halaman;
  - jumlah hasil dan URL state yang dapat dibagikan;
  - TanStack Table untuk rendering tabel desktop;
  - card fallback pada mobile serta empty/error/loading state.
- Route `/admin/bookings/[id]` menampilkan:
  - header kode, status, waktu masuk, dan waktu perubahan terakhir;
  - action bar sesuai status;
  - snapshot paket, promo, harga, traveler, dan total;
  - data customer, perjalanan, nama peserta, dan metadata transfer;
  - preview bukti transfer private;
  - catatan internal admin;
  - riwayat status/event dengan actor dan timestamp;
  - status delivery WhatsApp bila record sudah tersedia.
- Dashboard utama sekarang memprioritaskan counter `Menunggu Verifikasi`,
  `Dikonfirmasi`, total pemesanan bulan berjalan, paket aktif, serta lima
  pemesanan terbaru.
- Delete booking permanen tidak ditambahkan sesuai keputusan audit dan retention
  versi pertama.

## Private Proof

`getTransferProofSignedUrl()`:

1. memvalidasi UUID booking;
2. menjalankan `requireAdmin()`;
3. membaca object path melalui authenticated server client;
4. memakai service role hanya pada module server-only untuk membuat signed URL;
5. memberi expiry lima menit;
6. tidak mengirim raw storage path, public URL, atau signed URL ke WhatsApp.

Image ditampilkan dengan alt deskriptif. PDF memakai preview terpisah dan link
tab baru dengan referrer policy yang tidak mengirim URL admin.

## Transisi Status dan Audit

Migration `010_admin_booking_management.sql` menambahkan RPC
`transition_booking_status` yang:

- hanya dapat dipanggil role `authenticated`;
- tetap memverifikasi `private.is_active_admin()` serta `auth.uid()`;
- mengunci row booking menggunakan `FOR UPDATE`;
- mengizinkan transisi:
  - `waiting_verification` → `confirmed`;
  - `waiting_verification` → `payment_rejected`;
  - `waiting_verification` → `cancelled`;
  - `confirmed` → `completed`;
- menolak transisi lain di database, bukan hanya melalui disabled button;
- mewajibkan alasan untuk reject/cancel;
- mengisi `confirmed_at` dan `confirmed_by` saat confirm;
- menulis `booking_events` dalam transaksi yang sama;
- mengembalikan `already_current` tanpa event baru ketika aksi yang sama terkirim
  ulang.

RPC `update_booking_admin_notes` juga memakai row lock, active-admin check, batas
4.000 karakter, dan audit event. Catatan yang tidak berubah tidak membuat event
duplikat.

## QA Lokal

Hasil pada 29 Juli 2026:

| Pemeriksaan | Hasil |
|---|---|
| `npm run lint` | Lulus tanpa warning |
| `npm run typecheck` | Lulus |
| `npm run test:phase8` | Lulus — filter/pagination, authorization proof, transisi, audit, responsive structure, dashboard |
| `npm run build` | Lulus — `/admin/bookings` dan `/admin/bookings/[id]` dynamic/private |
| `npm run check` | Lulus — lint, typecheck, seluruh test Phase 2–8, dan production build |
| Browser route tanpa session | `307` ke `/admin/login?next=%2Fadmin%2Fbookings` |
| Browser metadata auth boundary | `noindex, nofollow`, tanpa horizontal overflow dan tanpa console error |
| Remote booking schema | Dapat dibaca service-role server-only tanpa mencetak row private |
| Remote proof bucket | Private |

Test Phase 8 juga memeriksa matriks transisi positif/negatif, row lock, active
admin, actor, idempotency, expiry signed URL, pencarian tiga field, pagination
server-side, dialog aksi kritis, mobile card fallback, history, dan counter
dashboard.

## Aktivasi Runtime Supabase

Implementasi lokal selesai. Sebelum aksi Phase 8 digunakan pada staging/production:

1. terapkan migration `009_submit_booking_atomically.sql` bila belum diterapkan;
2. terapkan migration `010_admin_booking_management.sql`;
3. provision satu akun admin menggunakan prosedur Phase 3 bila environment target
   belum memilikinya;
4. ulangi QA authenticated untuk list/filter/pagination, preview image/PDF,
   confirm/reject/cancel/complete, race klik ulang, audit actor/time, catatan admin,
   dan viewport mobile/desktop.

QA browser authenticated tidak dipalsukan dengan membuat credential baru. Saat
verifikasi lokal ini, route admin dengan benar berhenti pada login karena browser
QA tidak memiliki session admin.

`npm audit --omit=dev` masih melaporkan tiga advisory high pada Next.js 16.2.7
beserta dependency PostCSS/Sharp. Perbaikan otomatis meminta Next.js 16.2.12,
sedangkan versi proyek masih dikunci ke 16.2.7. `npm audit fix --force` tidak
dijalankan; upgrade terkontrol dan regression test tetap menjadi tindak lanjut
Phase 11.
