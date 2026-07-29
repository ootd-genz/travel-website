# Phase 9 — WhatsApp Notification

Dokumen ini mencatat implementasi Phase 9 berdasarkan seluruh requirement di
folder `docs/`, terutama trigger pasca-submit, adapter provider server-side,
format pesan minimum, delivery log, kegagalan non-blocking, idempotency, dan
retry admin.

## Implementasi

- Booking yang baru berhasil berubah menjadi `waiting_verification` memicu
  notifikasi setelah RPC submit selesai/commit. Outcome WhatsApp tidak pernah
  mengubah keberhasilan booking atau menghalangi redirect ke halaman sukses.
- Formatter Bahasa Indonesia memuat nama customer, paket, kode booking, tanggal
  keberangkatan, jumlah traveler, total transfer, status, dan deep link
  `${APP_URL}/admin/bookings/{booking_id}`.
- Pesan tidak memuat signed URL, storage path, credential, email, atau detail
  transfer lain yang tidak diperlukan admin.
- Destination dibaca dari `site_settings.admin_whatsapp_number`, lalu fallback
  ke `WHATSAPP_ADMIN_NUMBER`, dengan default terkunci `6282261060675`.
- Provider memakai abstraction `WhatsAppProvider`; implementasi pertama adalah
  Meta WhatsApp Cloud API melalui endpoint Graph API
  `/{version}/{phone-number-id}/messages`.
- Pengiriman memakai message template Meta yang sudah disetujui, bukan free-form
  text. Ini diperlukan untuk notifikasi business-initiated di luar customer
  service window 24 jam. Tujuh parameter body berasal dari formatter dengan
  urutan nama, paket, kode, tanggal, traveler, total, lalu deep link.
- Access token, sender phone-number ID, Graph API version, dan base URL hanya
  dibaca server-side. Base URL dibatasi ke origin HTTPS `graph.facebook.com`.
- Request provider memakai timeout delapan detik. Response hanya diparse sampai
  64 KiB dan provider error disimpan sebagai kode terkontrol tanpa raw response
  atau credential.

## Delivery, Idempotency, dan Retry

Migration `011_whatsapp_notification_delivery.sql` menambahkan dua RPC
service-role-only:

1. `claim_whatsapp_notification`
   - memastikan booking masih `waiting_verification`;
   - membuat satu delivery unik untuk event
     `booking_waiting_verification`;
   - mengunci row dengan `FOR UPDATE`;
   - memakai lease 30 detik agar request paralel tidak mengirim bersamaan;
   - menolak event yang sudah terkirim, masih aktif, belum melewati backoff,
     permanen, atau sudah mencapai batas percobaan.
2. `finalize_whatsapp_notification`
   - hanya menyelesaikan attempt yang masih menjadi claim aktif;
   - menyimpan provider message ID untuk sukses;
   - menyimpan error code yang disanitasi untuk gagal;
   - memberi backoff satu menit setelah kegagalan pertama dan lima menit setelah
     kegagalan kedua;
   - membatasi total menjadi tiga attempt dan tidak membuat retry loop tanpa
     batas.

HTTP `408`, `429`, `5xx`, Graph transient/rate-limit code terpilih, timeout, dan
network failure dianggap layak retry. Error `4xx` permanen tidak otomatis dibuka
untuk retry. Kegagalan konfigurasi diberi retry terkontrol agar admin dapat
mencoba kembali setelah secret/environment diperbaiki.

## UI Admin

- Daftar booking dan dashboard terbaru menampilkan status `WA diproses`,
  `WA terkirim`, atau badge `WA gagal`.
- Detail booking menampilkan destination, attempt count, waktu update/kirim,
  error code aman, serta jadwal retry berikutnya.
- Tombol `Coba Kirim Ulang` hanya tersedia pada delivery gagal yang masih
  retryable dan belum mencapai tiga attempt.
- Server Action retry selalu menjalankan `requireAdmin()` dan kembali memakai
  claim database yang sama, sehingga klik ganda tidak melewati kontrol
  idempotency.

## Environment

Konfigurasi tambahan:

```text
WHATSAPP_GRAPH_API_VERSION=v25.0
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_NAME=booking_waiting_verification
WHATSAPP_TEMPLATE_LANGUAGE=id
```

`v25.0` pada `env.example` adalah versi yang dipin saat implementasi. Versi aktif
environment harus ditinjau saat deployment karena lifecycle Graph API dikelola
Meta. Credential nyata tidak tersedia dan tidak dibuat selama QA lokal.

## QA Lokal

`npm run test:phase9` memverifikasi:

- seluruh field pesan dan deep link admin;
- tidak adanya signed URL/storage path pada pesan;
- request Meta Cloud API, bearer auth, destination, dan response message ID;
- mapping sukses, `4xx` permanen, `5xx` retryable, serta timeout;
- trigger hanya pada outcome submit baru, bukan duplicate submit;
- unique event, row lock, lease, attempt counter, backoff, dan grant
  service-role-only pada migration;
- authorization retry, badge gagal, dan tombol retry admin.

Hasil akhir juga melewati lint, typecheck, seluruh static test Phase 2–9, dan
production build.

## Aktivasi Runtime

Sebelum pengiriman nyata di staging/production:

1. terapkan migration `011_whatsapp_notification_delivery.sql` setelah
   migration `001`–`010`;
2. isi `WHATSAPP_GRAPH_API_VERSION`, `WHATSAPP_ACCESS_TOKEN`, dan
   `WHATSAPP_PHONE_NUMBER_ID` dengan konfigurasi Meta yang sah;
3. buat dan setujui template `booking_waiting_verification` (bahasa `id`) dengan
   tujuh parameter body dalam urutan yang didokumentasikan;
4. pastikan `APP_URL` adalah origin environment yang benar dan destination admin
   masih `6282261060675`;
5. lakukan booking UAT, verifikasi pesan diterima, deep link meminta login/buka
   booking yang benar, provider message ID tersimpan, serta tidak ada duplikasi;
6. simulasi credential salah, timeout, `4xx`, dan `5xx` pada staging untuk
   memverifikasi booking tetap sukses dan retry UI sesuai.

Pengujian live Meta tidak dilakukan tanpa credential provider milik pemilik
project. Database/dashboard tetap menjadi sumber kebenaran apabila delivery
gagal.
