# Phase 5 — Public Content Pages

Dokumen ini mencatat implementasi halaman konten publik berdasarkan seluruh
requirement di folder `docs/`, terutama sitemap publik, PRD Home dan halaman
konten, copywriting Bahasa Indonesia, UI/UX, serta aturan cache dan revalidation.

## Implementasi

- Header publik responsif dengan urutan tetap Home, Blog, Activities, Destination,
  dan Trip Types. Logo kembali ke Home, active state memakai `aria-current`, dan
  menu mobile menggunakan Sheet Radix/shadcn.
- Home memuat hero, discovery/search entry, Popular Package, USP, Featured Trips,
  Deals & Discounts, Popular Destinations, Browse Activities, Blog, dan footer.
  Section visibility, hero, CTA, serta USP mengikuti konfigurasi CMS yang published.
- List dan detail tersedia untuk Blog, Activities, Destination, dan Trip Types.
- Route pendukung `/trips` menyediakan pencarian katalog; detail `/trips/[slug]`
  menampilkan harga, duration, traveler range, destination, highlights, itinerary,
  included/excluded, informasi praktis, terms, FAQ, dan paket terkait.
- CTA booking pada detail paket sudah ditampilkan sebagai kontrol nonaktif dengan
  penjelasan yang jujur. Pembuatan draft server-side tetap menjadi scope Phase 6;
  Phase 5 tidak membuat link booking palsu atau mempercayai harga dari browser.
- Seluruh list mempunyai empty state yang mengarahkan pengunjung ke konten lain.
  Route group publik mempunyai skeleton loading dan error recovery.
- Media memakai `next/image`, aspect ratio tetap, alt deskriptif, serta fallback
  visual bila CMS belum memiliki gambar.

## Data Publik dan Cache

- `src/lib/public/content.ts` adalah data-access layer server-only.
- Query memakai anon key Supabase dan RLS, sehingga hanya row published/active
  yang dapat masuk ke UI. Response database diparse dengan Zod sebelum dipetakan
  menjadi tipe domain publik.
- Data katalog dan layout memakai cache lima menit dengan tag per resource.
  Mutation CMS Phase 4 sekarang merevalidasi path dan tag yang terkait saja.
- Migration `007_expose_public_site_settings.sql` menambahkan RPC security-definer
  read-only yang hanya memproyeksikan brand, logo, kontak publik, alamat, footer,
  dan social links. Nomor rekening serta nomor WhatsApp admin internal tidak ikut
  diekspos oleh RPC.
- Bila environment belum memiliki migration `007`, layout memakai fallback brand
  `Travel Bali` tanpa membocorkan error atau membuat data kontak palsu.

## SEO dan Aksesibilitas Dasar

- Metadata unik tersedia pada setiap list; metadata detail berasal dari SEO field
  CMS dengan fallback ke title dan deskripsi konten.
- Detail slug yang tidak tersedia menggunakan `notFound()` dan metadata noindex
  bawaan Next.js untuk not-found streaming response.
- Setiap content page memiliki satu H1; heading section disusun logis.
- Link internal deskriptif, form pencarian memiliki label, focus state terlihat,
  dan status tidak bergantung pada warna saja.
- Public page tetap Server Component secara default; hanya header mobile dan error
  retry yang menjadi Client Component karena memerlukan interaksi browser.

## QA Lokal

Hasil pada 29 Juli 2026:

| Pemeriksaan | Hasil |
|---|---|
| `npm run lint` | Lulus tanpa warning |
| `npm run typecheck` | Lulus |
| `npm run test:phase2:static` | Lulus |
| `npm run test:phase3:static` | Lulus |
| `npm run test:phase4:static` | Lulus |
| `npm run test:phase5:static` | Lulus — 11 route publik, cache/RLS, navigation, state, metadata, projection settings |
| `npm run build` | Lulus — list publik static/ISR 5 menit, list ber-query dan detail dynamic |
| Browser desktop 1440×900 | Satu H1, lima menu berurutan, footer, tanpa horizontal overflow |
| Browser mobile 390×844 | Hero dan CTA responsif, tanpa horizontal overflow, Sheet membuka dialog dengan lima menu |
| Console browser | Tidak ada warning/error |

Runtime Supabase telah diuji end-to-end menggunakan fixture published Travel Bali.
Role anonim dapat membaca katalog, promo, USP, dan homepage sesuai RLS; seluruh list,
detail, relasi, serta gambar Unsplash juga telah diuji pada aplikasi lokal. Rincian
dataset dan cara menjalankan ulang seed tersedia di
[`29-bali-demo-data.md`](29-bali-demo-data.md). Provisioning satu akun admin tetap
menjadi prosedur terpisah dan credential tidak disimpan di repository.
