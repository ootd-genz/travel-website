# Phase 10 — SEO, Accessibility & Performance

Dokumen ini mencatat implementasi Phase 10 setelah seluruh file di folder
`docs/` dibaca dan requirement SEO, WCAG 2.2 AA, caching, image delivery, serta
Core Web Vitals dipetakan ke aplikasi yang sudah tersedia.

## SEO

- Root Metadata API menetapkan `metadataBase`, title template, deskripsi,
  locale Indonesia, Open Graph, Twitter card, referrer policy, dan format
  detection.
- Seluruh route publik memakai helper metadata konsisten dengan:
  - title dan description unik;
  - canonical route tanpa query pencarian;
  - OG/Twitter image dari media CMS dengan fallback image 1200×630;
  - robots `index, follow` hanya untuk konten publik.
- `/blog?q=...` dan `/trips?q=...` memiliki canonical ke route list utama dan
  `noindex, follow` agar kombinasi query tidak menjadi duplicate content.
- Detail artikel menghasilkan JSON-LD `Article` dan `BreadcrumbList` dari data
  published yang benar.
- `sitemap.xml` hanya mengambil route statis dan slug published/active dari
  public data layer/RLS. Admin, booking, preview, draft, dan query URL tidak
  dimasukkan.
- `robots.txt` mengizinkan konten publik dan memblokir `/admin/`, `/booking/`,
  serta `/api/` sebagai lapisan crawler tambahan.
- Admin, login, forbidden, booking, success booking, dan not-found memakai
  metadata noindex. Proxy juga menambahkan `X-Robots-Tag: noindex, nofollow`
  pada admin dan booking, termasuk ketika Supabase public environment belum
  tersedia.
- Runtime lokal memverifikasi 34 URL sitemap, tanpa URL admin/booking.

## Accessibility

- Skip link tersedia untuk shell publik dan admin serta memindahkan pengguna ke
  landmark `main`.
- Focus ring global terlihat dan seluruh motion non-esensial menghormati
  `prefers-reduced-motion`.
- Landmark publik lengkap: `header`, navigation berlabel, satu `main`, dan
  `footer`.
- Mobile menu tetap memakai primitive Radix/shadcn, dimuat saat pertama kali
  dibuka, menjebak fokus di dialog, dapat ditutup dengan `Escape`, dan
  mengembalikan fokus ke trigger.
- Form pencarian dan booking memiliki label, helper/error association,
  `aria-invalid`, serta announcement error. Duplicate ID pada error booking
  draft sudah dihilangkan.
- Tahapan booking memakai `aria-current="step"` dan status langkah selesai
  tersedia untuk screen reader.
- Kontras tombol promo diperbaiki. Footer muted text juga dinaikkan kontrasnya.
- Audit Lighthouse mobile final: Accessibility **100**. Audit browser juga
  memverifikasi satu H1, alt image lengkap, link deskriptif, dialog berlabel,
  dan tanpa horizontal overflow pada viewport 390×844.

## Performance

- Server Component tetap menjadi default.
- Provider global React Query/theme/toast yang tidak dipakai tidak lagi
  menghidrasi seluruh aplikasi. Preferensi dark mode ditangani CSS sistem.
- Public data layer dipecah menjadi cache granular untuk destination, activity,
  trip type, trip, blog, dan promo. Route list tidak lagi mengambil seluruh
  katalog yang tidak digunakan.
- Semua media publik tetap memakai `next/image`, aspect ratio tetap, `sizes`
  responsif, priority hanya untuk image utama above-the-fold, serta AVIF/WebP.
- Mobile Sheet/Radix dipisahkan menjadi lazy client chunk dan baru dimuat saat
  menu pertama kali dibuka. Tidak ada map, chart, atau editor berat pada route
  publik yang perlu dimuat.
- Cache/revalidation tetap lima menit dan berbasis tag resource.
- Initial JavaScript mobile turun dari **182,1 KiB** menjadi **169,5 KiB**.

## Performance Budget dan Baseline

Budget tercatat pada `performance-budget.json`.

| Metrik mobile lab | Budget | Baseline lokal production |
|---|---:|---:|
| Lighthouse Performance | ≥ 80 | 81 cold / 89 warm |
| Accessibility | ≥ 95 | 100 |
| SEO | ≥ 95 | 100 |
| LCP lab | ≤ 4.000 ms | 3.770 ms cold / 3.164 ms warm |
| TBT lab | ≤ 300 ms | 238 ms |
| CLS | ≤ 0,10 | 0 |
| Initial JavaScript | ≤ 180 KiB | 169,5 KiB |

Target Core Web Vitals production tetap LCP ≤ 2,5 detik, INP ≤ 200 ms, dan
CLS ≤ 0,1. INP dan data persentil ke-75 memerlukan Real User Monitoring atau
Search Console setelah domain production aktif; TBT hanya dipakai sebagai
proxy interaktivitas pada lab lokal.

## QA

Hasil pada 29 Juli 2026:

| Pemeriksaan | Hasil |
|---|---|
| `npm run lint` | Lulus |
| `npm run typecheck` | Lulus |
| `npm run test:phase5:static` | Lulus setelah pemisahan navigation island |
| `npm run test:phase10` | Lulus |
| `npm run build` | Lulus; sitemap/robots/OG route terdeteksi |
| Canonical + query noindex | Lulus pada Home, Blog search, dan detail artikel |
| Sitemap/robots runtime | Lulus; 34 canonical URL, tanpa admin/booking |
| Desktop/mobile browser | Satu H1, landmark/alt/link valid, tanpa overflow |
| Keyboard mobile menu | Fokus dialog, `Escape`, dan focus return lulus |
| Lighthouse mobile production | Performance 81–89, Accessibility 100, SEO 100 |

Search Console, field Core Web Vitals, dan validasi canonical domain production
dilanjutkan pada Phase 13 karena membutuhkan domain production final.
