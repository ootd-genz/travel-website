# Roadmap Pengembangan — Setup sampai Deploy & QA

Roadmap ini sengaja memisahkan tahap agar risiko booking, pembayaran manual, upload, dan admin authorization diuji lebih awal.

# Phase 0 — Requirement Lock & Project Review

## Tujuan

Memastikan seluruh tim memahami scope sebelum coding.

## Checklist

- [x] baca seluruh dokumentasi, termasuk `project-guidelines.md`;
- [x] konfirmasi 5 menu publik;
- [x] konfirmasi bank BCA 87654321;
- [x] pemilik bisnis mengisi **nama pemilik rekening: Muhammad Fulan**;
- [x] konfirmasi WhatsApp admin 6282261060675;
- [x] tentukan provider WhatsApp: Meta WhatsApp Cloud API;
- [x] tentukan domain production/`travelbali.com`:
- [x] konfirmasi field customer yang benar-benar diperlukan;
- [x] konfirmasi aturan promo dan traveler count;
- [x] tetapkan retention bukti transfer: 24 bulan setelah status terminal.

Keputusan lengkap dan dua blocker tersisa didokumentasikan pada
[`00-phase-0-requirement-lock.md`](00-phase-0-requirement-lock.md).

## Exit Criteria

Tidak ada requirement bisnis kritis yang ambigu. Phase ini belum dapat ditutup
sebelum nama pemilik rekening dan domain production diisi oleh pemilik bisnis.

---

# Phase 1 — Project Setup & Baseline

## Scope

- [x] setup Next.js App Router sesuai versi guideline;
- [x] TypeScript strict sesuai project;
- [x] Tailwind 4 + shadcn;
- [x] Supabase SSR helpers;
- [x] env validation/config;
- [x] route groups `(public)`, `(auth)`, `(admin)`;
- [x] base layout, theme, error/loading patterns;
- [x] lint/typecheck/build pipeline.

## QA

- [x] build production clean;
- [x] no secret committed;
- [x] basic responsive shell.

Hasil implementasi dan validasi dicatat pada
[`24-phase-1-baseline.md`](24-phase-1-baseline.md).

---

# Phase 2 — Supabase Schema, Migration, RLS & Storage

**Status: selesai dan diverifikasi pada 29 Juli 2026.**

## Scope

- [x] migration awal tabel content;
- [x] trips dan relation;
- [x] bookings + booking events;
- [x] notification deliveries;
- [x] admin_users;
- [x] site settings;
- [x] storage private transfer proof;
- [x] RLS policy;
- [x] indexes awal berdasarkan query;
- [x] rapihkan file `.env.local`.

## QA

- [x] anon vs authenticated RLS test;
- [x] private booking tidak bocor;
- [x] upload bucket private.

Implementasi, hasil validasi lokal, serta langkah verifikasi runtime environment
dicatat pada [`25-phase-2-supabase.md`](25-phase-2-supabase.md).

---

# Phase 3 — Single Admin Authentication

**Status implementasi: selesai dan diverifikasi lokal pada 29 Juli 2026.**
Aktivasi runtime remote menunggu migration `005` serta credential admin yang dipilih
pemilik project; credential tidak dibuat atau disimpan di repository.

## Scope

- [x] admin login/logout;
- [x] workflow provisioning satu account admin;
- [x] `requireAdmin` server authorization;
- [x] `/admin/*` protected;
- [x] noindex admin/auth;
- [x] login rate limit;
- [x] audit basic.

## QA

- [x] unauthenticated redirect pada production smoke test lokal;
- [x] non-admin forbidden pada authorization/static test;
- [x] session expiry ditangani proxy + server authorization;
- [x] logout tersedia dan lulus typecheck/build;
- [ ] ulangi seluruh skenario dengan fixture Auth setelah migration dan admin remote diaktifkan.

Implementasi dan hasil validasi dicatat pada
[`26-phase-3-single-admin-auth.md`](26-phase-3-single-admin-auth.md).

---

# Phase 4 — Admin CMS Core

**Status implementasi: selesai dan diverifikasi lokal pada 29 Juli 2026.**
Schema konten dan RLS runtime Supabase telah diverifikasi. Pengujian CRUD dengan
session admin tetap menunggu provisioning credential yang dipilih pemilik project.

## Scope

Urutan implementasi:

- [x] Paket Travel
- [x] Destination
- [x] Activities
- [x] Trip Types
- [x] Blog
- [x] Promotions
- [x] Home content/USP
- [x] Site settings/footer/payment info

## UX

- [x] clean sidebar desktop + Sheet mobile;
- [x] table shadcn responsif untuk list sederhana; TanStack Table tidak diperlukan untuk dataset CMS awal;
- [x] simple forms shadcn/Radix yang dipisah per section;
- [x] loading/empty/error/success states.

## QA

- [x] CRUD pages dan Server Actions lulus static validation/typecheck/build;
- [x] validation Zod server lulus positive/negative fixture;
- [x] media upload memiliki allowlist, size/signature check, random path, dan orphan cleanup;
- [x] publish/unpublish/archive diproses server-side dan memicu revalidation;
- [x] relation integrity dijaga validation, foreign key, composite key, dan sinkronisasi junction;
- [ ] ulangi seluruh skenario CRUD/upload dengan fixture admin remote setelah satu akun admin diprovision.

Implementasi dan hasil validasi dicatat pada
[`27-phase-4-admin-cms-core.md`](27-phase-4-admin-cms-core.md).

---

# Phase 5 — Public Content Pages

**Status implementasi: selesai dan diverifikasi lokal pada 29 Juli 2026.**
Konten runtime mengikuti row published/active pada Supabase. Projection pengaturan
publik, anon RLS, dan fixture Travel Bali telah diverifikasi pada runtime Supabase.

## Scope

- [x] Home dengan 10 section + footer;
- [x] Blog list/detail;
- [x] Activities list/detail;
- [x] Destination list/detail;
- [x] Trip Types list/detail;
- [x] Package list/detail sebagai route pendukung katalog;
- [x] responsive header/footer;
- [x] public content caching/revalidation.

## Copywriting

- [x] implementasikan Bahasa Indonesia dari `17-copywriting-library.md` dengan fallback brand `Travel Bali`;
- [x] konten hero, USP, kurasi, branding, kontak, dan footer mengikuti data CMS ketika tersedia.

## QA

- [x] desktop/mobile diverifikasi pada viewport 1440×900 dan 390×844;
- [x] internal link dan active navigation;
- [x] loading/empty/error state;
- [x] image alt dan fallback media;
- [x] semantic heading dengan satu H1 per content page;
- [x] seed dummy Travel Bali tersimpan idempotent di Supabase;
- [x] seluruh data dummy dapat dibaca role anonim sesuai RLS;
- [x] gambar katalog publik termuat dari CDN Unsplash;
- [x] lint, typecheck, static test Phase 2–5, dan production build.

Hasil implementasi dan validasi dicatat pada
[`28-phase-5-public-content-pages.md`](28-phase-5-public-content-pages.md) dan
[`29-bali-demo-data.md`](29-bali-demo-data.md).

---

# Phase 6 — Booking Draft & Price Snapshot

**Status implementasi: selesai dan diverifikasi lokal pada 29 Juli 2026.**
Migration `008` harus diterapkan pada environment target sebelum runtime Phase 6
diaktifkan.

## Scope

- [x] CTA Pesan Sekarang;
- [x] server validation package;
- [x] promo calculation;
- [x] booking draft;
- [x] secure public token;
- [x] expiry;
- [x] snapshot price;
- [x] booking summary.

## QA Kritis

- [x] client price tampering tidak mengubah total;
- [x] expired draft;
- [x] package inactive;
- [x] invalid traveler count;
- [x] promo expiry.

Implementasi dan hasil validasi dicatat pada
[`30-phase-6-booking-draft-price-snapshot.md`](30-phase-6-booking-draft-price-snapshot.md).

---

# Phase 7 — Transfer Instruction + Customer Form + Proof Upload

## Scope

- step booking;
- BCA 87654321;
- account holder from config;
- exact total;
- data diri;
- transfer metadata;
- proof upload private;
- submit validation;
- cleanup orphan file;
- status `waiting_verification`;
- success page.

## QA Kritis

- oversized file;
- invalid file type;
- upload fail;
- DB fail after upload;
- duplicate submit;
- draft expired during submit;
- proof not publicly accessible.

---

# Phase 8 — Admin Booking Management

## Scope

- booking table + filters;
- booking detail;
- signed URL proof;
- confirm/reject/cancel/complete;
- booking history/events;
- dashboard pending counter.

## QA

- valid state transition;
- invalid transition rejected server-side;
- audit actor/time;
- responsive table/detail.

---

# Phase 9 — WhatsApp Notification

## Scope

- provider adapter;
- message formatter;
- destination 6282261060675;
- dashboard deep link;
- delivery log;
- idempotency;
- failure/retry UI.

## QA

- pesan field benar;
- link admin benar;
- provider timeout;
- provider 4xx/5xx;
- booking tetap tersimpan saat WA gagal;
- retry tidak duplicate berlebihan.

---

# Phase 10 — SEO, Accessibility & Performance

## Scope

- Metadata API;
- canonical;
- OG;
- sitemap;
- robots;
- noindex admin/booking;
- accessibility audit;
- Core Web Vitals baseline;
- image optimization;
- code splitting/lazy load berat.

## QA

- keyboard;
- focus;
- labels;
- contrast;
- H1;
- sitemap/canonical;
- mobile performance.

---

# Phase 11 — Security Hardening & Observability

## Scope

- security headers/CSP;
- rate limits;
- log redaction;
- structured logs;
- error tracking/monitoring;
- upload abuse checks;
- secret scan;
- admin action audit review.

## QA

- auth bypass attempts;
- file MIME mismatch;
- XSS input;
- excessive payload;
- rate limit;
- no secret exposure.

---

# Phase 12 — Automated Test, Manual QA & UAT Staging

## Test Suite

- unit;
- integration;
- RLS;
- E2E booking;
- E2E admin;
- WhatsApp failure scenario;
- responsive;
- accessibility;
- SEO.

## UAT Bisnis

Pemilik bisnis memvalidasi:

- copywriting;
- harga;
- rekening BCA;
- nama rekening;
- flow transfer;
- booking data;
- pesan WhatsApp;
- admin usability.

## Exit Criteria

Tidak ada blocker/high severity issue pada flow pembayaran, booking, auth, atau data privacy.

---

# Phase 13 — Production Deployment

## Scope

- production secrets;
- migration production;
- production admin account;
- provider WhatsApp production;
- HTTPS;
- domain + APP_URL;
- monitoring;
- Search Console setelah siap.

## Smoke Test

- navigation;
- public page;
- package;
- booking summary;
- rekening BCA;
- admin login;
- booking dashboard;
- WhatsApp link.

---

# Phase 14 — Post Launch

## 24–72 Jam Pertama

Pantau:

- submission error;
- upload error;
- WhatsApp failure;
- admin login failure;
- slow queries;
- unexpected bot traffic;
- Core Web Vitals.

## Iterasi Berikutnya

Baru pertimbangkan:

- customer account;
- payment gateway;
- automated customer WhatsApp;
- voucher lebih kompleks;
- inventory/quota advanced;
- multi-admin bila bisnis benar-benar membutuhkan.

Jangan menambah kompleksitas sebelum kebutuhan nyata muncul.
