# Workflow Pengelolaan Konten Admin

## Prinsip Dasar

Admin mengelola sumber data utama. Home hanya melakukan kurasi dari entitas yang sudah ada.

## 1. Membuat Paket

```text
Paket Travel → Tambah Paket
→ Isi identitas
→ Isi harga
→ Pilih Destination
→ Pilih Activities
→ Pilih Trip Types
→ Isi itinerary/included/excluded
→ Upload media
→ Isi SEO
→ Simpan Draft
→ Preview
→ Publish
```

Setelah publish, halaman publik terkait direvalidate.

## 2. Menjadikan Popular Package

```text
Edit Paket
→ aktifkan Popular
→ atur Popular Rank
→ Simpan
```

Tidak membuat record paket kedua.

## 3. Menjadikan Featured Trip

Sama seperti Popular: flag + rank pada package.

## 4. Destination

```text
Destinasi → Tambah
→ nama + slug
→ gambar + deskripsi
→ highlights + waktu terbaik
→ activity/package relation
→ SEO
→ Publish
```

## 5. Activities

Admin membuat activity sekali, lalu menghubungkannya ke banyak paket/destination.

## 6. Trip Types

Admin membuat kategori gaya perjalanan dan menghubungkannya ke paket.

## 7. Blog

```text
Blog → Tulis Artikel
→ Draft
→ Isi title/excerpt/content/media
→ Relasikan destination/activity/package
→ SEO
→ Preview
→ Publish
```

## 8. Promo

```text
Promo → Tambah Promo
→ nama promo
→ tipe persen/nominal
→ nilai
→ periode aktif
→ paket target
→ aktifkan
```

Aturan harga promo dihitung server-side.

## 9. Home Hero & USP

Konten unik Home boleh dikelola pada `Halaman Home` karena bukan entitas katalog lain.

## 10. Unpublish vs Delete

Default operasi aman:

- konten yang sudah dipakai publik lebih baik `unpublish/archive`;
- delete permanen dibatasi;
- entitas dengan relasi booking historis tidak boleh menyebabkan history hilang;
- snapshot pada booking menjaga nama/harga historis meskipun paket berubah.

## 11. Media

Admin upload media konten ke bucket yang sesuai. File bukti transfer customer dipisahkan dari media publik dan tidak boleh masuk media library publik.
