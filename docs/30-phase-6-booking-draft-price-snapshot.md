# Phase 6 — Booking Draft & Price Snapshot

Dokumen ini mencatat implementasi Phase 6 berdasarkan seluruh requirement di
folder `docs/`, terutama aturan paket, promo, traveler, token publik, expiry, dan
snapshot harga server-side.

## Implementasi

- CTA `Pesan Sekarang` pada detail paket sudah aktif.
- Form awal hanya mengirim ID paket, jumlah traveler, dan opsi keberangkatan bila
  paket memilikinya.
- Browser tidak mengirim harga dasar, harga sale, promo, subtotal, diskon, atau
  total.
- Server mengambil ulang paket menggunakan service role server-only dan menolak
  paket selain `published`.
- Jumlah traveler divalidasi ulang terhadap `min_participants` dan
  `max_participants`.
- Opsi keberangkatan wajib sama persis dengan salah satu opsi paket yang masih
  tersedia.
- Harga efektif memakai `sale_price` yang valid, selain itu `base_price`.
- Harga `per_person` dikali jumlah traveler, sedangkan `per_package` tidak.
- Promo aktif dipilih secara deterministik berdasarkan diskon nominal terbesar,
  `starts_at` paling awal, lalu ID sebagai tie-breaker terakhir.
- Diskon fixed dibatasi sebesar subtotal dan diskon persentase dibatasi 100%.
- Perhitungan uang menggunakan integer berbasis dua desimal agar tidak bergantung
  pada floating-point browser.
- Draft menyimpan snapshot paket, harga unit, satuan harga, traveler, subtotal,
  promo, diskon, total, currency, versi harga, dan opsi keberangkatan.

## Token, Kode Booking, dan Expiry

- Token URL dibuat dari 32 byte acak kriptografis dan dikirim sebagai Base64URL.
- Database hanya menyimpan hash SHA-256 token; token mentah tidak disimpan atau
  dicatat pada event.
- Kode booking manusiawi dibuat server-side dengan pola
  `TRV-YYYYMMDD-XXXXXX` dan insert collision diulang secara terbatas.
- TTL dibaca dari `BOOKING_DRAFT_TTL_MINUTES`, default konfigurasi 60 menit.
- Draft kedaluwarsa diubah dari `draft` menjadi `expired` secara idempotent dan
  event `draft_expired` dicatat.
- Customer diarahkan kembali ke detail paket untuk membuat snapshot baru setelah
  expiry.

## Schema

Migration `008_add_booking_departure_snapshot.sql` menambahkan
`departure_option_snapshot` agar label keberangkatan dari CMS tetap tersedia pada
ringkasan historis. Kolom tersebut ditambahkan ke trigger proteksi snapshot dan
tidak dapat diubah setelah draft dibuat.

Migration ini harus diterapkan setelah migration `001`–`007` sebelum runtime
Phase 6 diaktifkan pada staging/production.

## Booking Summary

Route `/booking/[token]`:

- dynamic dan tidak memakai shared cache;
- memiliki metadata `noindex, nofollow`;
- mencari draft melalui hash token;
- tidak menampilkan hash token, ID internal, storage path, atau data private;
- menampilkan kode booking, paket, destination, traveler, keberangkatan, subtotal,
  promo/diskon, total snapshot, dan waktu expiry;
- menjelaskan bahwa draft belum berarti pembayaran atau konfirmasi admin.

Instruksi transfer, form customer, bukti pembayaran, dan perubahan status menjadi
`waiting_verification` tetap berada pada Phase 7.

## QA Lokal

Test `npm run test:phase6` memverifikasi:

- sale price dan aturan `per_person`/`per_package`;
- promo terbesar, promo expired, batas diskon, serta tie-breaker;
- browser tidak mengirim field harga/total;
- token acak dan hash server-side;
- validasi paket published, rentang traveler, dan opsi keberangkatan;
- TTL serta event expiry;
- snapshot opsi keberangkatan immutable;
- CTA aktif dan halaman ringkasan noindex/no-store.

Hasil akhir juga harus melewati `npm run check`, yang menjalankan lint, typecheck,
seluruh test statis Phase 2–6, dan production build.
