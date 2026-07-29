# Acceptance Criteria & Definition of Done

## Public Navigation

- [x] Urutan menu: Home → Blog → Activities → Destination → Trip Types.
- [x] Logo kembali ke Home.
- [x] Mobile navigation accessible.

## Home

- [x] Semua section tersedia: Headline, Booking, Popular Package, USP, Featured Trips, Deals & Discounts, Popular Destinations, Browse Activities, Blog, Footer.
- [x] Data curated tidak diduplikasi.
- [x] CTA mengarah ke entity/paket yang benar.

## Content Pages

- [x] Blog, Activities, Destination, Trip Types memiliki list + detail yang sesuai.
- [x] Semua memiliki loading/empty/error state.
- [x] Only active/published content tampil publik.

## Package

- [x] Harga tampil jelas.
- [x] Itinerary, included, excluded, duration, destination tersedia.
- [x] CTA Pesan Sekarang membuat draft server-side.

## Booking

- [x] Harga snapshot dihitung server.
- [ ] Rekening tampil: BCA 87654321.
- [ ] Nama pemilik rekening berasal dari konfigurasi yang valid.
- [ ] Pengunjung dapat mengisi data diri.
- [ ] Bukti transfer wajib dan private.
- [ ] Submit valid menghasilkan `waiting_verification`.
- [ ] Double submit tidak membuat booking duplicate.
- [ ] Success page menampilkan kode booking tanpa mengekspos file private.

## WhatsApp

- [ ] Nomor tujuan default 6282261060675.
- [ ] Pesan memuat nama customer, package, booking code, tanggal, jumlah traveler, total, status.
- [ ] Pesan memuat link `/admin/bookings/{booking_id}` menggunakan base `APP_URL`.
- [ ] WhatsApp hanya dipicu setelah booking tersimpan.
- [ ] Kegagalan WhatsApp tidak membatalkan booking.
- [ ] Retry tidak menimbulkan duplikasi tak terkendali.

## Admin

- [ ] Hanya satu admin aktif.
- [ ] Tidak ada public signup.
- [ ] Admin dapat login/logout.
- [ ] Admin dapat mengelola content utama.
- [ ] Admin dapat melihat booking dan bukti transfer.
- [ ] Admin dapat confirm/reject/cancel/complete sesuai status transition.
- [ ] Action booking memiliki audit/event.

## Security

- [ ] Service role server-only.
- [ ] RLS aktif dan diuji.
- [ ] Booking private tidak dapat dibaca anon.
- [ ] File upload tervalidasi.
- [ ] Storage private.
- [ ] Rate limit endpoint sensitif.
- [ ] No secret di Git/log/client.
- [ ] Admin dan booking flow noindex.

## SEO & Accessibility

- [x] Metadata unique public pages.
- [ ] Sitemap dan robots valid.
- [x] Satu H1 utama per content page.
- [x] Alt image.
- [ ] Keyboard/focus/labels diuji.
- [ ] Target WCAG 2.2 AA untuk flow utama.

## Build & QA

- [x] TypeScript clean.
- [x] Lint clean.
- [x] Test kritis Phase 2–5 lulus.
- [x] Production build lulus.
- [x] Responsive QA Phase 5 lulus.
- [ ] Staging UAT disetujui.
