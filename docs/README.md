# Dokumentasi Proyek Website Travel

Dokumentasi ini adalah sumber acuan produk dan implementasi untuk website travel dengan **1 akun admin**. Baseline aplikasi mulai tersedia sejak Phase 1; fitur bisnis tetap dibangun bertahap mengikuti roadmap.

## Tujuan Produk

Membangun website travel yang:

- mudah dipahami pengunjung dan mendorong konversi pemesanan;
- mudah dikelola oleh satu admin tanpa perlu mengubah kode;
- memiliki alur pemesanan manual transfer bank yang jelas;
- mengirim pemesanan ke dashboard admin dan notifikasi WhatsApp admin;
- mengikuti pedoman teknis, keamanan, SEO, aksesibilitas, testing, dan deployment pada `project-guidelines.md`.

## Urutan Halaman Publik

1. Home
2. Blog
3. Activities
4. Destination
5. Trip Types

Detail paket tetap memiliki halaman sendiri agar kartu paket dari Home, Destination, Activities, atau Trip Types dapat diarahkan ke halaman paket sebelum pemesanan.

## Alur Bisnis Utama

```text
Pengunjung memilih paket
        ↓
Membuka detail paket dan klik "Pesan Sekarang"
        ↓
Sistem membuat booking draft + mengunci snapshot harga
        ↓
Pengunjung melihat ringkasan dan instruksi transfer
BCA • No. Rekening 87654321
        ↓
Pengunjung melakukan transfer sesuai total
        ↓
Pengunjung mengisi data diri + detail perjalanan
+ upload bukti transfer
        ↓
Validasi server + simpan booking + file private
        ↓
Status: Menunggu Verifikasi
        ↓
Booking muncul di Dashboard Admin
        ↓
Notifikasi otomatis dikirim ke WhatsApp admin 6282261060675
berisi link langsung ke detail booking di dashboard
        ↓
Admin memverifikasi transfer
        ↓
Dikonfirmasi / Ditolak / Dibatalkan / Selesai
```

## Dokumen Utama

| File | Isi |
|---|---|
| `00-phase-0-requirement-lock.md` | Keputusan bisnis Phase 0, aturan final, dan blocker pemilik bisnis |
| `01-product-prd.md` | PRD utama, tujuan, scope, persona, kebutuhan bisnis |
| `02-architecture-tech-stack.md` | Arsitektur dan tech stack sesuai guideline |
| `03-public-site-map.md` | Sitemap, route, dan urutan halaman publik |
| `04-home-page-prd.md` | Detail seluruh section Home |
| `05-content-pages-prd.md` | PRD Blog, Activities, Destination, Trip Types |
| `06-travel-packages-prd.md` | Model produk/paket travel |
| `07-booking-payment-flow.md` | Alur pemesanan dan transfer bank end-to-end |
| `08-booking-form-data-contract.md` | Field form, validasi, status, dan snapshot harga |
| `09-whatsapp-notification.md` | Notifikasi otomatis WhatsApp admin |
| `10-admin-dashboard-prd.md` | Struktur dashboard admin yang clean |
| `11-admin-content-workflows.md` | Workflow CRUD konten oleh admin |
| `12-admin-booking-workflow.md` | Workflow pengelolaan pemesanan |
| `13-database-data-model.md` | Model data konseptual Supabase |
| `14-auth-security-rls.md` | Single admin auth, authorization, RLS, security |
| `15-storage-upload-security.md` | Upload bukti transfer private dan validasi file |
| `16-routes-actions-integration.md` | Route publik/admin dan kontrak server-side |
| `17-copywriting-library.md` | Copywriting Bahasa Indonesia siap pakai |
| `18-ui-ux-design-system.md` | Pedoman UI/UX pengunjung dan admin |
| `19-seo-accessibility-performance.md` | SEO, WCAG 2.2 AA, performa |
| `20-testing-qa.md` | Test plan dan checklist QA |
| `21-deployment-operations.md` | Staging, deploy, monitoring, rollback |
| `22-env-configuration.md` | Daftar environment/config tanpa secret nyata |
| `23-acceptance-criteria.md` | Definition of Done dan acceptance criteria |
| `24-phase-1-baseline.md` | Implementasi, batas scope, dan hasil validasi baseline Phase 1 |
| `25-phase-2-supabase.md` | Implementasi schema, migration, RLS, private storage, dan QA Phase 2 |
| `26-phase-3-single-admin-auth.md` | Implementasi login/logout, authorization, rate limit, audit, dan QA Phase 3 |
| `27-phase-4-admin-cms-core.md` | Implementasi CMS admin, validasi, relasi, media konten, audit, dan QA Phase 4 |
| `28-phase-5-public-content-pages.md` | Implementasi halaman publik, data published, cache/revalidation, responsive UI, dan QA Phase 5 |
| `29-bali-demo-data.md` | Seed data demo Travel Bali, cakupan konten, gambar Unsplash, dan cara verifikasi Supabase |
| `30-phase-6-booking-draft-price-snapshot.md` | Implementasi draft booking, kalkulasi promo, token aman, expiry, snapshot harga, dan QA Phase 6 |
| `roadmap.md` | Tahapan setup sampai production & QA |
| `project-guidelines.md` | Salinan guideline sumber dari lampiran |

## Prinsip Produk yang Tidak Boleh Dilanggar

- Harga final **tidak pernah dipercaya dari browser**; server mengambil harga paket dan menyimpan snapshot saat booking dibuat.
- Bukti transfer tidak membuat pembayaran otomatis valid. Status awal setelah form adalah **Menunggu Verifikasi**.
- Bukti transfer disimpan **private**, bukan bucket publik.
- Notifikasi WhatsApp adalah notifikasi operasional; dashboard/database tetap menjadi sumber data utama apabila WhatsApp gagal.
- Tidak ada registrasi admin publik. Hanya satu akun admin yang dibuat secara terkontrol.
- Seluruh UI menggunakan komponen **shadcn** sebagai fondasi sesuai guideline.
- Bahasa utama website dan dashboard adalah **Bahasa Indonesia**.
