# UI/UX Guidelines — Clean untuk Pengunjung & Admin

## Fondasi

Seluruh primitive UI menggunakan shadcn/Radix sesuai `project-guidelines.md`.

## Prinsip Visual

- hierarchy jelas;
- whitespace cukup;
- maksimal satu CTA primer per area utama;
- card tidak dipenuhi metadata;
- gunakan semantic color token, bukan warna hardcoded tersebar;
- status tidak disampaikan hanya lewat warna—selalu ada label/icon/text;
- mobile-first;
- dark mode tetap terbaca bila diaktifkan.

## Public Layout

### Header

- logo jelas;
- 5 menu utama;
- menu mobile memakai Sheet;
- active state terlihat;
- sticky hanya bila tidak mengganggu ruang mobile.

### Card Paket

Urutan visual:

1. image
2. badge promo/popular
3. title
4. destination + duration
5. price
6. CTA

### Detail Paket

Gunakan sticky booking summary hanya pada desktop bila tidak mengganggu. Pada mobile, CTA dapat memakai sticky bottom action yang aksesibel.

## Booking UX

Booking dibagi menjadi langkah sederhana:

```text
1. Ringkasan
2. Transfer
3. Data & Bukti
4. Selesai
```

Tampilkan progress/step indicator yang tidak membuat pengguna merasa flow panjang.

### Instruksi Transfer

Card rekening harus sangat kontras dan mudah dipindai:

- Bank BCA
- No. Rekening 87654321
- Atas Nama Muhammad Fulan
- Total Transfer
- tombol copy nomor rekening/nominal opsional dengan feedback.

Jangan menyembunyikan total transfer di bawah fold tanpa ringkasan.

## Admin Layout

### Sidebar

Satu level utama. Hindari submenu bertingkat dalam untuk versi awal.

### Tables

- search + filter di atas;
- kolom utama saja;
- row click atau action `Lihat`;
- pagination;
- mobile menggunakan horizontal scroll/column visibility/card fallback jika lebih jelas.

### Forms

Pecah form panjang ke section Card:

- Informasi Utama
- Harga
- Relasi
- Media
- Detail Perjalanan
- SEO

Action `Simpan` konsisten di kanan bawah/sticky action bar bila form sangat panjang.

## Status Badge Booking

- Draft
- Menunggu Verifikasi
- Dikonfirmasi
- Bukti Ditolak
- Dibatalkan
- Selesai
- Kedaluwarsa

Setiap badge memiliki teks, bukan warna saja.

## Accessibility

- keyboard usable;
- visible focus;
- form label nyata, bukan placeholder-only;
- dialog focus trap dari Radix;
- icon-only button punya accessible label;
- heading hierarchy logis;
- target WCAG 2.2 AA.

## Loading / Empty / Error

Contoh admin empty state:

`Belum ada pemesanan yang cocok dengan filter ini.`

Contoh public empty:

`Belum ada paket aktif di kategori ini. Jelajahi pilihan perjalanan lainnya.`

Error selalu memberi langkah berikutnya bila memungkinkan.
