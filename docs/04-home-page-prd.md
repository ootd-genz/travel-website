# PRD Halaman Home

## Tujuan

Meyakinkan pengunjung bahwa website ini membantu mereka menemukan dan memesan perjalanan dengan mudah, aman, dan jelas.

## 1. Header / Navigation

**Konten:** logo, Home, Blog, Activities, Destination, Trip Types.

**Admin:** logo dan informasi brand dapat dikelola. Urutan menu inti sebaiknya tetap untuk menjaga arsitektur informasi.

## 2. Headline / Hero

### Copy utama

**H1:** `Liburan Impian, Lebih Mudah Dimulai di Sini.`

**Subheadline:** `Temukan paket perjalanan pilihan, destinasi memukau, dan aktivitas seru yang sudah kami kurasi agar kamu tinggal fokus menikmati perjalanan.`

**CTA utama:** `Temukan Perjalananmu`

**CTA sekunder:** `Lihat Paket Favorit`

### Dikelola admin

- headline;
- subheadline;
- hero image;
- CTA label + destination;
- badge kecil, misalnya `Paket pilihan • Harga transparan • Dukungan responsif`.

## 3. Booking / Search

Copy:

**Judul:** `Mau pergi ke mana selanjutnya?`

**Deskripsi:** `Mulai dari tujuan, aktivitas, atau gaya perjalanan favoritmu.`

Field discovery boleh berupa Destination, Trip Type, Activities, periode, dan jumlah traveler. Search hanya membantu menemukan paket; harga final selalu ditentukan paket server-side.

CTA: `Cari Perjalanan`

## 4. Popular Package

**Judul:** `Paket Favorit Traveler`

**Deskripsi:** `Pilihan perjalanan yang paling sering dilirik—lengkap dengan itinerary, pengalaman terbaik, dan harga yang jelas sejak awal.`

Card minimal:

- foto;
- nama paket;
- destination;
- duration;
- harga mulai;
- badge promo bila ada;
- CTA `Lihat Detail`.

Admin cukup menandai package `Popular`; jangan membuat duplicate package khusus Home.

## 5. USP / Why Choose Us

**Judul:** `Perjalanan Lebih Tenang, Cerita Lebih Banyak.`

Contoh USP:

- `Pilihan Terkurasi` — Paket dipilih agar pengalaman, waktu, dan budget terasa seimbang.
- `Harga Transparan` — Lihat harga dan detail yang didapat sebelum memesan.
- `Proses Mudah` — Pilih paket, transfer, kirim data, lalu tunggu konfirmasi admin.
- `Dukungan Responsif` — Pemesanan masuk langsung ke admin untuk segera diverifikasi.

Admin dapat mengatur judul, icon, deskripsi, urutan, dan visibility.

## 6. Featured Trips

**Judul:** `Perjalanan Pilihan Minggu Ini`

**Deskripsi:** `Dari laut biru sampai pegunungan sejuk, ini perjalanan yang layak masuk daftar berangkatmu.`

CTA section: `Lihat Semua Paket`

Admin menandai package `Featured` dan urutan tampil.

## 7. Deals & Discounts

**Judul:** `Pergi Lebih Jauh, Tetap Lebih Hemat.`

**Deskripsi:** `Manfaatkan promo terbatas untuk perjalanan yang sudah lama kamu rencanakan.`

Promo memiliki periode aktif, label, nominal/persentase, paket terkait, dan status aktif.

CTA: `Lihat Promo Aktif`

## 8. Popular Destinations

**Judul:** `Destinasi yang Bikin Ingin Berangkat Sekarang`

**Deskripsi:** `Cari suasana yang kamu butuhkan—pantai, budaya, alam, atau kota yang penuh cerita.`

Card mengarah ke detail destination.

## 9. Browse Activities

**Judul:** `Pilih Aktivitas, Ciptakan Ceritamu.`

**Deskripsi:** `Snorkeling, hiking, city tour, kuliner, atau sekadar menikmati sunset—pilih pengalaman yang paling kamu tunggu.`

CTA pada card: `Lihat Paket dengan Aktivitas Ini`

## 10. Blog

**Judul:** `Inspirasi Sebelum Koper Ditutup`

**Deskripsi:** `Baca tips, panduan, dan cerita yang membantu perjalananmu terasa lebih siap dan lebih seru.`

Admin memilih artikel `Show on Home`.

## 11. Footer

Copy CTA:

**Judul:** `Sudah Kebayang Liburannya? Saatnya Tentukan Perjalanannya.`

**CTA:** `Jelajahi Paket Travel`

Footer juga memuat kontak, social media, alamat, copyright, dan link penting.

## State UI

- loading skeleton untuk card list;
- empty state yang tetap mengarahkan ke konten lain;
- image fallback;
- CTA tetap jelas pada mobile;
- section dapat disembunyikan admin bila belum ada konten.
