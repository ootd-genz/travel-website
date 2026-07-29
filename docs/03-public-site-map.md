# Sitemap & Urutan Halaman Publik

## Navigasi Utama

Urutan menu harus konsisten:

**Home → Blog → Activities → Destination → Trip Types**

Logo berada di sisi awal navigation bar dan kembali ke Home.

## Route Publik

| Halaman | Route | Tujuan |
|---|---|---|
| Home | `/` | Landing utama dan pintu masuk ke seluruh konten |
| Blog | `/blog` | Artikel, panduan, inspirasi travel |
| Detail Blog | `/blog/[slug]` | Membaca artikel |
| Activities | `/activities` | Menjelajah aktivitas |
| Activity Detail | `/activities/[slug]` | Detail aktivitas dan paket terkait |
| Destination | `/destination` | Menjelajah destinasi |
| Destination Detail | `/destination/[slug]` | Detail destinasi dan paket terkait |
| Trip Types | `/trip-types` | Menjelajah gaya/jenis perjalanan |
| Trip Type Detail | `/trip-types/[slug]` | Detail kategori dan paket terkait |
| Paket | `/trips/[slug]` | Informasi lengkap paket dan CTA booking |
| Booking | `/booking/[token]` | Flow pembayaran + data diri + upload |
| Booking Success | `/booking/[token]/success` | Konfirmasi data berhasil diterima |

## Home

Urutan section:

1. Header / Navigation
2. Headline / Hero
3. Booking / Search
4. Popular Package
5. USP / Why Choose Us
6. Featured Trips
7. Deals & Discounts
8. Popular Destinations
9. Browse Activities
10. Blog
11. Footer

## Blog

1. Header
2. Hero Blog
3. Featured article opsional
4. List artikel + kategori/search
5. CTA ke paket/destinasi relevan
6. Footer

## Activities

1. Header
2. Hero Activities
3. Activity grid
4. Paket berdasarkan aktivitas
5. CTA eksplorasi
6. Footer

## Destination

1. Header
2. Hero Destination
3. Destination grid
4. Popular destinations
5. Paket per destination
6. Footer

## Trip Types

1. Header
2. Hero Trip Types
3. Trip type grid
4. Paket berdasarkan trip type
5. CTA konsultasi/pilih paket
6. Footer

## Cross-linking

Setiap entitas mengarahkan ke paket terkait:

```text
Blog ─────────────┐
Activities ───────┼→ Paket → Booking
Destination ──────┤
Trip Types ───────┘
```

Link harus deskriptif, misalnya `Lihat paket snorkeling di Nusa Penida`, bukan `Klik di sini`.
