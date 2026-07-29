# Phase 7 — Transfer Instruction, Customer Form & Proof Upload

Dokumen ini mencatat implementasi Phase 7 berdasarkan seluruh requirement di
folder `docs/`, terutama alur pembayaran manual, kontrak data customer, storage
private, validasi upload, anti-submit ganda, dan halaman sukses.

## Implementasi

- Route `/booking/[token]` sekarang menampilkan indikator empat langkah:
  Ringkasan, Transfer, Data & Bukti, dan Selesai.
- Instruksi pembayaran membaca bank, nomor rekening, dan nama pemilik rekening
  dari singleton `site_settings` melalui service role server-only.
- Total transfer selalu memakai snapshot server Phase 6 dan tidak dibaca dari
  hidden input atau dipercaya dari browser.
- Form mengumpulkan nama, WhatsApp, email, kota opsional, tepat satu nama untuk
  setiap traveler, catatan opsional, metadata transfer, satu bukti transfer, dan
  dua consent wajib.
- Nomor WhatsApp Indonesia seperti `08...` dinormalisasi menjadi format
  internasional `62...`; email dan seluruh string tervalidasi serta dinormalisasi
  di server.
- Nominal yang dideklarasikan customer harus sama persis dengan total snapshot.
- Tombol submit mempunyai pending state dan server tetap melindungi race submit
  ganda.

## Private Proof Upload

- Bukti transfer hanya menerima JPEG, PNG, atau PDF dengan ukuran maksimum 5 MiB.
- Server memeriksa file tidak kosong, MIME allowlist, ekstensi, dan magic
  bytes/signature dasar; MIME dari browser tidak dijadikan satu-satunya sumber
  kebenaran.
- Object disimpan pada bucket private `booking-transfer-proofs` dengan pola
  `{booking_uuid}/{random_uuid}.{safe_extension}` dan `upsert: false`.
- Tidak ada public URL atau signed URL yang diberikan kepada customer.
- Bila upload gagal, booking tidak dimutasi.
- Bila database gagal setelah upload, object yang baru diunggah dihapus.
- Bila dua request berlomba dan request kedua menemukan booking sudah tersubmit,
  object kedua dibersihkan lalu customer diarahkan ke halaman sukses yang sama.

## Submit Atomik

Migration `009_submit_booking_atomically.sql` menambahkan RPC
`submit_booking_draft` yang:

- hanya dapat dieksekusi `service_role`;
- mengunci row booking menggunakan `FOR UPDATE`;
- menolak token tidak ditemukan, status tidak valid, draft kedaluwarsa, nominal
  tidak cocok, dan payload peserta invalid;
- mengubah status menjadi `waiting_verification`;
- menyimpan data customer dan transfer;
- memasukkan seluruh `booking_participants`;
- menulis event `booking_submitted`;
- menjalankan seluruh perubahan database dalam satu transaksi.

Migration ini harus diterapkan setelah migration `001`–`008` sebelum submit
Phase 7 diaktifkan pada staging/production.

## Success Page

Route `/booking/[token]/success` bersifat dynamic, `no-store`, dan
`noindex, nofollow`. Halaman hanya menampilkan kode booking, paket, total snapshot,
serta status operasional. Storage path dan URL bukti transfer tidak pernah
ditampilkan.

Submit ulang untuk token yang sudah diproses diarahkan ke halaman status yang sama,
sehingga tidak membuat booking atau event duplikat.

## QA Lokal

`npm run test:phase7` memverifikasi:

- normalisasi WhatsApp, email, uang, consent, dan field customer;
- file valid JPEG/PNG/PDF;
- file oversized, MIME invalid, ekstensi tidak cocok, dan signature invalid;
- bucket/path private tanpa public atau signed URL customer;
- cleanup setelah database gagal dan setelah race submit ganda;
- row lock, expiry, nominal exact, peserta, status, dan audit event pada RPC;
- success route token-scoped, noindex, serta tanpa storage path.

Hasil akhir juga melewati `npm run check`: lint, typecheck, seluruh test statis
Phase 2–7, dan production build.

Smoke test browser lokal memverifikasi rekening BCA `87654321` atas nama
`Muhammad Fulan`, total snapshot, seluruh field/label, server validation message,
satu H1, tidak ada horizontal overflow pada viewport mobile 390×844, dan layout
desktop.
