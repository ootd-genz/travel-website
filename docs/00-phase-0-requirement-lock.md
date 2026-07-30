# Phase 0 — Requirement Lock

Dokumen ini adalah keputusan bisnis dan produk yang mengikat implementasi versi pertama. Dokumen disusun setelah meninjau seluruh isi folder `docs/`.

## Status

**Belum dapat ditutup.** Seluruh keputusan yang dapat diturunkan dari dokumentasi sudah dikunci. Dua nilai milik bisnis masih wajib diisi sebelum Phase 0 memenuhi exit criteria:

1. nama pemilik rekening BCA;
2. domain production untuk `APP_URL`.

Placeholder untuk kedua nilai tersebut tidak boleh digunakan pada production.

## Keputusan yang Sudah Dikunci

### Navigasi publik

Terdapat tepat lima menu publik utama dengan urutan tetap:

1. Home (`/`)
2. Blog (`/blog`)
3. Activities (`/activities`)
4. Destination (`/destination`)
5. Trip Types (`/trip-types`)

Detail paket (`/trips/[slug]`) dan booking (`/booking/[token]`) tetap tersedia sebagai route pendukung, bukan menu utama.

### Rekening pembayaran

- Bank: **BCA**
- Nomor rekening: **87654321**
- Nama pemilik rekening: **BLOCKER — menunggu nilai resmi dari pemilik bisnis**

Nama pemilik rekening harus berasal dari `site_settings.bank_account_holder`. Aplikasi tidak boleh mengarang fallback atau menampilkan placeholder pada production.

### Notifikasi WhatsApp admin

- Nomor tujuan: **6282261060675**
- Provider versi pertama: **Meta WhatsApp Cloud API**
- Integrasi wajib server-side melalui provider adapter agar dapat diganti tanpa mengubah domain booking.
- Credential provider hanya disimpan di environment/secret manager.
- Notifikasi dikirim setelah booking aman tersimpan sebagai `waiting_verification`.
- Kegagalan WhatsApp tidak menggagalkan booking dan harus tercatat pada `notification_deliveries`.

### Domain dan `APP_URL`

- Local development: `http://localhost:3000`
- Preview/staging: URL deployment environment terkait
- Production: **BLOCKER — menunggu domain resmi pemilik bisnis**

`APP_URL` production harus berupa origin HTTPS tanpa path dan digunakan untuk deep link admin pada pesan WhatsApp. Nilai preview tidak boleh dipakai sebagai fallback production.

### Data customer yang dikumpulkan

Field wajib:

- nama lengkap, 2–100 karakter;
- nomor WhatsApp aktif, dinormalisasi ke format internasional;
- email valid;
- tanggal keberangkatan jika paket memiliki pilihan keberangkatan;
- jumlah traveler;
- nama peserta untuk setiap traveler;
- nama pemilik rekening pengirim;
- nominal transfer yang dideklarasikan customer;
- satu bukti transfer;
- dua consent yang tercantum pada `08-booking-form-data-contract.md`.

Field opsional:

- kota domisili, maksimum 100 karakter;
- bank pengirim;
- waktu transfer;
- catatan khusus dengan batas panjang yang ditetapkan pada schema implementasi.

Jangan menambah data identitas sensitif seperti NIK, nomor paspor, atau tanggal lahir pada versi pertama tanpa requirement baru dan review privasi.

### Aturan traveler count

- Nilai harus bilangan bulat.
- Setiap paket published wajib memiliki `min_participants` dan `max_participants` yang valid.
- Syaratnya `1 <= min_participants <= max_participants`.
- Booking hanya valid jika jumlah traveler berada di dalam rentang paket.
- Harga `per_person` dikalikan jumlah traveler; harga `per_package` tidak dikalikan jumlah traveler.
- Server memvalidasi ulang rentang dan availability saat draft dibuat.
- Snapshot jumlah traveler dan harga tidak dapat diubah dari browser setelah draft dibuat.

### Aturan promo

- Promo tidak dapat ditumpuk; satu booking hanya memakai satu promo.
- Harga dasar efektif memakai `sale_price` paket jika tersedia dan valid, selain itu `base_price`.
- Promo harus aktif, berada dalam periode berlaku, dan terhubung ke paket.
- Jika lebih dari satu promo valid, server memilih promo yang menghasilkan diskon nominal terbesar. Jika nilainya sama, promo dengan `starts_at` paling awal dipilih; ID menjadi tie-breaker terakhir agar hasil deterministik.
- Diskon persentase dibatasi pada rentang 0–100%.
- Diskon nominal tidak boleh membuat total kurang dari nol.
- Diskon dihitung terhadap subtotal: harga efektif dikali traveler untuk `per_person`, atau harga efektif paket untuk `per_package`.
- Browser tidak menjadi sumber kebenaran harga, promo, atau total.
- Draft booking berlaku **60 menit**. Setelah kedaluwarsa, harga, promo, dan availability harus dihitung ulang melalui draft baru.

### Retensi bukti transfer

- Bukti transfer disimpan pada bucket private.
- Retensi versi pertama: **24 bulan setelah booking masuk status terminal** (`payment_rejected`, `cancelled`, atau `completed`).
- Booking yang masih `waiting_verification` atau `confirmed` tidak boleh kehilangan bukti transfer karena job retensi.
- Setelah masa retensi, object bukti transfer dihapus melalui proses terkontrol dan event penghapusan dicatat tanpa menyimpan signed URL atau isi file.
- Record booking dan audit tidak ikut terhapus oleh kebijakan retensi file.
- Kebijakan ini adalah keputusan produk; pemilik bisnis tetap harus meninjaunya sebelum production bila ada kewajiban akuntansi atau regulasi khusus.

## Keputusan Teknis Turunan

- Tech stack memakai Next.js 16.2.12 (patch keamanan Phase 11), React 19.2.4, TypeScript, Tailwind CSS 4, shadcn/Radix, dan Supabase sesuai dokumen arsitektur.
- Hanya satu admin aktif dan tidak ada public signup.
- Bukti transfer private; signed URL hanya diberikan setelah authorization admin.
- Harga selalu dihitung dan disnapshot server-side.
- Status setelah submit adalah `waiting_verification`, bukan `confirmed`.
- Dashboard/database adalah sumber kebenaran apabila notifikasi gagal.
- Bahasa utama public site dan dashboard adalah Bahasa Indonesia.

## Blocker yang Harus Diisi Pemilik Bisnis

| Keputusan | Nilai yang dibutuhkan | Dampak bila kosong |
|---|---|---|
| Nama pemilik rekening | Nama resmi sesuai rekening BCA 87654321 An. Muhammad Fulan| Instruksi transfer tidak boleh dipublikasikan |
| Domain production | Origin HTTPS, contoh `https://travelbali.com` | Deep link WhatsApp dan metadata canonical production tidak dapat difinalkan |

## Exit Criteria Phase 0

Phase 0 selesai hanya jika:

- semua keputusan di atas diterima pemilik bisnis;
- kedua blocker sudah diganti dengan nilai final;
- bank, nomor rekening, nomor WhatsApp, dan domain diuji ulang sebelum production;
- tidak ada placeholder requirement yang digunakan sebagai konfigurasi production.
