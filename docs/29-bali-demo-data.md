# Data Demo Travel Bali

Dataset demo Bali tersedia untuk mengisi seluruh halaman konten publik tanpa
menambahkan credential atau secret ke repository. Seed menggunakan Supabase service
role hanya dari server/CLI, bersifat idempotent, dan tidak menghapus konten lain.

## Cakupan Data

- 6 destinasi: Ubud, Nusa Penida, Uluwatu, Munduk, Kintamani, dan Seminyak;
- 6 aktivitas: Snorkeling, Sunrise Trekking, Jelajah Sawah, Tur Pura & Budaya,
  Waterfall Trekking, dan Sunset & Wellness;
- 5 trip types: Adventure, Cultural Journey, Beach Escape, Honeymoon, dan Family Trip;
- 6 paket perjalanan lengkap dengan harga, itinerary, benefit, FAQ, dan relasi;
- 5 artikel blog beserta relasi destinasi, aktivitas, dan paket;
- 2 promo aktif, 4 USP, homepage published, serta branding/footer Travel Bali.

Media demo menggunakan URL HTTPS stabil dari `images.unsplash.com`. Aplikasi hanya
menerima host eksternal tersebut untuk media publik; path media CMS biasa tetap
diarahkan ke bucket `content-media` Supabase.

## Menjalankan Seed

Pastikan `.env.local` berisi `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY`.

```bash
npm run seed:bali-demo -- --dry-run
npm run seed:bali-demo
```

Mode `--dry-run` hanya memeriksa kesiapan tabel dan jumlah data. Perintah kedua
melakukan upsert berdasarkan slug/ID, membangun junction relation, lalu menguji
kembali jumlah row yang dapat dibaca oleh pengunjung anonim.

## Hasil Verifikasi 29 Juli 2026

- dua kali eksekusi menghasilkan jumlah yang sama tanpa duplikasi;
- anon RLS membaca 6 destinasi, 6 aktivitas, 5 trip types, 6 paket, 5 blog,
  2 promo, 4 USP, dan 1 homepage;
- seluruh lima route list dan contoh route detail menampilkan data serta relasinya;
- gambar artikel diuji selesai dimuat dengan `naturalWidth` lebih dari nol;
- `npm run check` lulus, termasuk lint, typecheck, static validation Phase 2–5,
  dan production build.
