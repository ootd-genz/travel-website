# Phase 12 — Automated Test, Manual QA & UAT Staging

Dokumen ini mencatat implementasi Phase 12 setelah seluruh file di folder `docs/`
dibaca. Phase ini menggabungkan regression test Phase 2–11, menyediakan preflight
staging read-only, mencatat manual QA runtime, dan memisahkan bukti teknis dari
persetujuan UAT yang hanya boleh diberikan pemilik bisnis.

## Status

**Implementasi teknis dan QA lokal selesai pada 30 Juli 2026.** Phase 12 belum
ditutup sebagai UAT staging karena aplikasi yang diuji masih memakai
`http://localhost:3000`, credential Meta WhatsApp staging belum tersedia, dan
persetujuan bisnis belum diberikan.

## Automated Test

`npm run test:phase12` menjalankan seluruh regression Phase 2–11 lalu memeriksa
kontrak Phase 12. `npm run check` menjadi release gate lokal dengan urutan:

```text
Lint → Typecheck → Regression Phase 2–11 → Phase 12 contract
→ Secret scan → Production build
```

Matriks cakupan:

| Area | Bukti automated | Status lokal |
|---|---|---|
| unit | pricing/promo, booking validation, phone normalization, proof validation, WhatsApp formatter/provider | Lulus |
| integration | atomic draft/submit, orphan cleanup, duplicate submit, admin transition/audit, notification claim/finalize | Lulus |
| RLS | migration/policy static test dan pgTAP fixture; preflight anon public/private | Lulus pada environment yang terhubung |
| E2E booking | contract dan negative path automated; full browser submit harus memakai staging | Menunggu staging |
| E2E admin | auth boundary automated; authenticated CRUD/status/proof memerlukan akun UAT staging | Menunggu staging |
| WhatsApp failure scenario | timeout, `4xx`, `5xx`, retryable/permanent mapping, non-blocking booking, bounded retry | Lulus |
| responsive | pemeriksaan runtime pada lima viewport | Lulus lokal |
| accessibility | semantic/keyboard/focus runtime + regression Phase 10 | Lulus lokal setelah satu perbaikan |
| SEO | metadata/canonical/robots/sitemap/noindex/404 runtime + regression Phase 10 | Lulus lokal |

## Staging Preflight Read-only

`npm run test:phase12:staging` tidak membuat booking, user, file, event, atau
mutation lain. Runner memeriksa:

- origin staging HTTPS;
- route publik, satu H1, security headers, auth redirect, real 404;
- robots dan sitemap tanpa admin/booking;
- public content dapat dibaca anon dan booking ditolak;
- kolom schema yang dibutuhkan Phase 6–11;
- tepat satu admin aktif;
- BCA `87654321`, nama rekening terisi, dan WhatsApp `6282261060675`;
- bucket bukti transfer tetap private;
- keberadaan konfigurasi runtime Meta tanpa mencetak credential.

Siapkan `.env.staging.local` yang diabaikan Git dengan variable aplikasi staging,
termasuk `PHASE12_BASE_URL`, Supabase staging, `APP_URL`, dan credential Meta.
Kemudian jalankan:

```bash
npm run test:phase12:staging
```

Local diagnostic dapat memakai `PHASE12_ALLOW_LOCAL=true`, tetapi hasil tersebut
tidak menggantikan staging HTTPS.

Hasil diagnostic lokal 30 Juli 2026: seluruh route/header/SEO, anon/private RLS,
schema, satu admin aktif, business settings, dan private bucket lulus. Satu gate
gagal karena `WHATSAPP_GRAPH_API_VERSION`, `WHATSAPP_ACCESS_TOKEN`,
`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME`, serta
`WHATSAPP_TEMPLATE_LANGUAGE` belum lengkap pada environment QA lokal.

## Manual QA Runtime

### Responsive dan UI

| Viewport | Hasil |
|---|---|
| 390×844 | mobile trigger tampil, Sheet berisi lima menu, tidak ada horizontal overflow |
| 768×1024 | mobile/tablet navigation tampil, tidak ada horizontal overflow |
| 1024×768 | desktop navigation tampil, tidak ada horizontal overflow |
| 1265×720 | Home lengkap, satu H1, seluruh landmark dan image alt tersedia |
| 1440×900 | desktop lebar tetap stabil tanpa overflow |

Home, Blog, Activities, Destination, Trip Types, katalog paket, detail paket, dan
detail blog diuji pada runtime. Semua route mempunyai title, canonical, satu H1,
image alt, dan tidak mengalami horizontal overflow. Console tidak menampilkan
warning/error pada skenario yang diuji.

### Accessibility

- skip link dan landmark `header`, `nav`, `main`, `footer` tersedia;
- menu mobile memakai dialog berlabel, fokus masuk ke dialog, `Escape` menutup,
  dan fokus kembali ke tombol pembuka;
- form login memiliki label email/password dan pending button;
- seluruh image yang diuji mempunyai atribut `alt`;
- satu temuan: login dan forbidden memakai H2 sebagai heading pertama;
- perbaikan: kedua route sekarang memakai H1 tanpa mengubah primitive Card global.

### SEO dan Security Smoke

- enam route list publik dan dua detail mempunyai metadata/canonical yang sesuai;
- admin redirect `307` ke login, `private, no-store`, dan `noindex, nofollow`;
- route acak menghasilkan HTTP `404`, bukan soft-404;
- sitemap berisi 34 URL dan tidak memuat `/admin` atau `/booking`;
- robots memblokir `/admin/`, `/booking/`, dan `/api/`;
- CSP, nosniff, frame denial, referrer policy, permissions policy, dan request ID
  tersedia pada response yang diuji.

## E2E/UAT Staging yang Masih Wajib

- [ ] login dengan akun admin UAT, logout, session expiry, dan non-admin forbidden;
- [ ] CRUD/publish/archive konten serta audit actor;
- [ ] buat booking dari paket published sampai success menggunakan data dummy;
- [ ] verifikasi snapshot harga tidak berubah ketika payload client dimanipulasi;
- [ ] tolak file invalid/oversized/MIME mismatch dan pastikan tidak ada orphan;
- [ ] lihat booking di dashboard serta signed proof tanpa public URL;
- [ ] confirm/reject/cancel/complete dan verifikasi event/actor/timestamp;
- [ ] simulasi WhatsApp gagal lalu pastikan booking tetap sukses dan retry bounded;
- [ ] kirim satu template Meta staging, cek destination/deep link/provider ID;
- [ ] ulangi responsive/keyboard pada URL staging HTTPS;
- [ ] catat issue severity, owner, hasil retest, dan keputusan release.

Test memakai data dummy dan tidak boleh memakai data customer production atau
transfer uang nyata.

## Checklist Sign-off UAT Bisnis

Checklist berikut sengaja tidak dicentang oleh automation:

- [ ] copywriting
- [ ] harga
- [ ] rekening BCA
- [ ] nama rekening
- [ ] flow transfer
- [ ] booking data
- [ ] pesan WhatsApp
- [ ] admin usability

Catatan sign-off:

```text
Environment / URL :
Tanggal           :
Nama approver     :
Keputusan         : Approved / Rejected
Catatan           :
```

## Release Decision

Phase 13 tidak boleh dimulai berdasarkan hasil lokal saja. Gate Phase 12 terpenuhi
hanya jika preflight staging, E2E booking/admin, skenario kegagalan WhatsApp, dan
sign-off bisnis semuanya selesai tanpa blocker/high severity issue pada payment,
booking, auth, atau data privacy.
