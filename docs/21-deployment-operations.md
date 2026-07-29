# Deployment & Operations

## Environment

Minimal:

- Local Development
- Preview/Staging
- Production

Gunakan Supabase project/environment yang sesuai strategi tim. Jangan menggunakan data production nyata untuk test.

## CI Minimum

```text
Install deterministic
→ Lint
→ Typecheck
→ Test
→ Production build
```

Tambahkan E2E/QA automation sesuai maturity project.

## Migration

- bernomor berurutan;
- jangan edit migration yang sudah dijalankan bersama/production;
- schema migration dijalankan dengan prosedur aman sebelum code yang membutuhkannya;
- perubahan breaking dilakukan bertahap.

## Pre-Production Checklist

- satu akun admin production dibuat;
- signup publik disabled/tidak tersedia;
- bank BCA 87654321 terverifikasi oleh pemilik bisnis;
- nama pemilik rekening sudah diisi;
- nomor WhatsApp admin 6282261060675 diuji;
- provider WhatsApp production credential aktif;
- storage private policy diuji;
- RLS diuji dengan anon + authenticated;
- `APP_URL` benar;
- security headers sesuai third-party;
- sitemap/robots/metadata benar;
- admin & booking noindex;
- backup/recovery dipahami.

## Deploy

1. backup/restore point bila perubahan data signifikan;
2. deploy migration aman;
3. deploy aplikasi;
4. smoke test publik;
5. smoke test admin;
6. test booking kecil di environment yang sesuai;
7. cek notification/log/monitoring.

## Smoke Test Production

- Home terbuka;
- semua navigation bekerja;
- package detail bekerja;
- booking draft dibuat;
- instruksi BCA benar;
- form validation bekerja;
- admin login;
- admin bookings list;
- WhatsApp integration health.

Hindari melakukan transfer uang nyata hanya untuk smoke test bila tidak diperlukan; gunakan prosedur UAT bisnis yang disepakati.

## Monitoring

Pantau:

- error rate;
- booking submission failures;
- upload failures;
- WhatsApp failures;
- login failures abnormal;
- query latency;
- route latency;
- storage usage.

## Rollback

Siapkan:

- rollback aplikasi;
- forward-fix migration untuk schema yang sudah masuk production;
- recovery data jika migration kritis bermasalah.

Jangan mengandalkan edit manual migration lama sebagai rollback.
