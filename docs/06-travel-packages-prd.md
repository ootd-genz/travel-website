# PRD Paket Travel

Paket travel adalah entitas komersial utama. Popular Package dan Featured Trips pada Home **bukan tabel terpisah**, tetapi flag/kurasi dari data paket yang sama.

## Field Paket

### Identitas

- nama paket;
- slug;
- short description;
- long description;
- cover image;
- gallery;
- status: draft/published/archived.

### Relasi

- destination;
- activities;
- trip types;
- related blog posts bila perlu.

### Komersial

- base price;
- optional sale price;
- currency: IDR;
- price unit, misalnya per orang/per paket;
- promo aktif;
- minimum participants;
- maximum participants/quota bila dipakai;
- duration days/nights;
- departure options bila dipakai.

### Konten detail

- highlights;
- itinerary per hari;
- included;
- excluded;
- meeting point;
- accommodation information;
- transportation information;
- notes;
- terms & conditions;
- cancellation note;
- FAQ.

### Merchandising

- is_popular;
- popular_rank;
- is_featured;
- featured_rank.

## Harga

### Aturan

- harga hanya dapat diubah admin;
- browser tidak boleh menentukan total harga final;
- ketika booking dimulai, server membuat snapshot:
  - package_id;
  - package_name;
  - unit_price;
  - discount;
  - participant_count;
  - calculated_total;
  - currency;
  - price_version/timestamp.

Jika harga paket berubah setelah draft dibuat, draft tetap memakai snapshot sampai masa berlaku habis.

## Detail Paket — Copywriting

### H1 pattern

`[Nama Paket] — Saatnya Membuat [Destination] Jadi Cerita Nyata.`

### Supporting copy

`Itinerary sudah disiapkan, pengalaman terbaik sudah dipilih. Kamu tinggal tentukan tanggal, siapkan koper, dan mulai perjalanan.`

### CTA utama

`Pesan Sekarang`

### Trust copy dekat CTA

`Harga ditampilkan dengan jelas sebelum transfer. Pemesanan akan diverifikasi langsung oleh admin setelah bukti pembayaran dikirim.`

## Detail Paket Minimum

Di atas fold:

- judul;
- destination;
- duration;
- price;
- badge promo;
- hero image;
- 3–4 highlight utama;
- CTA Pesan Sekarang.

Di bawah fold:

- itinerary;
- included/excluded;
- activities;
- trip type;
- terms;
- related packages;
- FAQ.

## Availability

Apabila kuota/tanggal keberangkatan digunakan, server wajib mengecek availability lagi pada saat membuat booking draft dan saat admin konfirmasi.
