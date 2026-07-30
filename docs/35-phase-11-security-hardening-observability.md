# Phase 11 — Security Hardening & Observability

Dokumen ini mencatat implementasi Phase 11 setelah seluruh file di folder `docs/`
dibaca. Scope mencakup hardening browser/server, pencegahan abuse mutation publik,
redaction log, error tracking, upload, supply chain, secret scan, dan review audit
aksi admin.

## Security Headers dan CSP

- Seluruh response memperoleh CSP, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
  `Permissions-Policy`, `Cross-Origin-Opener-Policy`, dan DNS prefetch off.
- HSTS dan `upgrade-insecure-requests` hanya aktif ketika build production memakai
  `APP_URL` HTTPS. `includeSubDomains`/preload belum dipaksakan sebelum kesiapan
  domain production diverifikasi pada Phase 13.
- Route sensitif `/admin/*` dan `/booking/*` memakai nonce request unik dan
  `strict-dynamic`; script inline tanpa nonce ditolak. Route publik mempertahankan
  CSP statis agar ISR/CDN Phase 10 tidak hilang. Trade-off yang terdokumentasi:
  script inline masih diizinkan pada halaman publik yang statis, sedangkan route
  sensitif memakai kebijakan lebih ketat. Style inline tetap diizinkan untuk
  kompatibilitas Next.js/Radix.
- Resource dibatasi ke origin aplikasi, Supabase project yang dikonfigurasi, dan
  image CDN Unsplash yang memang digunakan. Object/embed serta framing diblokir.
- PDF bukti transfer tidak lagi disematkan pada iframe; admin membukanya melalui
  signed URL lima menit pada tab terpisah dengan no-referrer.

## Framework dan Supply Chain

- Next.js dinaikkan terkontrol dari `16.2.7` ke patch `16.2.12`, termasuk
  `eslint-config-next` yang cocok, lalu seluruh regression test dijalankan ulang.
- Override terkunci memakai PostCSS `8.5.25` dan Sharp `0.35.3` karena release
  Next.js tersebut masih membawa rentang transitif yang terkena advisory terbaru.
- `npm audit --omit=dev` setelah upgrade/override melaporkan 0 vulnerability.
- `package-lock.json` tetap menjadi sumber instalasi deterministik.

## Rate Limit dan Payload

Migration `013_security_hardening_observability.sql` menambahkan fixed-window rate
limit persisten server-only:

- pembuatan draft: 20 percobaan per IP per 10 menit;
- submit booking: 10 percobaan per IP per 15 menit;
- submit token yang sama: 5 percobaan per token per 15 menit.

IP dan token tidak disimpan mentah; identifier disimpan sebagai HMAC SHA-256.
RPC hanya dapat dipanggil `service_role`, sedangkan tabel counter memakai RLS,
force RLS, dan tidak memiliki grant anon/authenticated. Rate limit berjalan sebelum
query mahal/upload dan gagal tertutup apabila service tidak tersedia. Server Action
tetap dibatasi 6 MiB; schema Zod membatasi panjang string, array peserta, nominal,
tanggal, token, dan parameter lain.

## Structured Logging dan Monitoring

- Proxy membuat/menormalisasi `x-request-id` UUID dan meneruskannya ke request serta
  response untuk correlation.
- Logger server menghasilkan satu JSON object per event dengan timestamp, level,
  service, environment, event, request ID, action/status/duration/actor aman bila
  relevan.
- Redaction rekursif menghapus key token, password, authorization, cookie, secret,
  email, telepon/WhatsApp, nama customer, sender account, JWT, bearer token, dan
  query secret. Error hanya mencatat nama/digest/kode aman; stack, header request,
  payload customer, dan credential tidak dikirim.
- `src/instrumentation.ts` memakai `onRequestError` untuk menangkap exception server
  tak terduga. Event selalu masuk structured log dan opsional dikirim ke endpoint
  HTTPS `OBSERVABILITY_ERROR_WEBHOOK_URL` dengan timeout tiga detik serta payload
  tereduksi. Expected validation/not-found/rate-limit tetap ditangani tanpa membuat
  alert exception yang berisik.
- Event auth login gagal/rate-limited/sukses/logout dan booking draft/submit kini
  dapat dipantau berdasarkan event name serta request ID tanpa PII mentah.

## Upload Abuse Checks

- Batas 5 MiB, satu file, allowlist JPEG/PNG/PDF, ekstensi, MIME, magic bytes, dan
  object path random tetap dipertahankan.
- JPEG/PNG sekarang harus memiliki struktur dimension header yang valid, maksimum
  12.000 piksel per sisi dan 25 megapiksel untuk mengurangi risiko decompression
  bomb.
- PDF harus memiliki EOF marker dan ditolak bila memuat action aktif berisiko seperti
  JavaScript, Launch, EmbeddedFile, RichMedia, OpenAction, atau Additional Actions.
- MIME mismatch, signature salah, image dimension berlebihan, active PDF, file
  kosong, oversized, upload gagal, DB gagal setelah upload, serta race submit tetap
  mempunyai jalur penolakan/cleanup.

## Secret Scan dan Audit Admin

- `npm run security:scan` memeriksa seluruh file tracked dan unignored, menolak
  private key, JWT, token provider umum, credential server bernilai nyata, file env,
  key/certificate, serta `.insforge/project.json`. Hanya placeholder kosong/non-secret
  di `env.example`/docs yang diterima.
- Audit CMS kini ditulis melalui RPC active-admin tervalidasi; direct insert dari
  authenticated dicabut agar actor tidak dapat dipalsukan.
- Direct insert authenticated ke `booking_events` dicabut. Akses signed URL bukti
  transfer menulis event `transfer_proof_accessed` dengan actor admin.
- Trigger database menolak update/delete langsung pada `admin_auth_events`,
  `content_change_events`, dan `booking_events`, sehingga jejak audit append-only.

## QA

Hasil 30 Juli 2026:

| Pemeriksaan | Hasil |
|---|---|
| `npm run lint` | Lulus |
| `npm run typecheck` | Lulus |
| `npm run test:phase11` | Lulus |
| `npm run security:scan` | Lulus |
| `npm audit --omit=dev` | Lulus — 0 vulnerability |
| Regression test Phase 2–10 | Lulus |
| `npm run build` | Lulus |
| Header/CSP runtime | Lulus pada public, admin redirect, dan booking |

Test Phase 11 memverifikasi security header, nonce CSP private, correlation ID,
redaction, monitoring hook, versi framework aman, rate limit sebelum upload,
hardening audit, image dimension bomb, active PDF, XSS/JSON-LD escaping, tidak
adanya iframe PDF, dan secret scan.

## Aktivasi Runtime

Sebelum staging/production memakai kode ini:

1. terapkan migration `012_add_promotion_codes.sql` bila belum aktif;
2. terapkan `013_security_hardening_observability.sql`;
3. isi `OBSERVABILITY_SERVICE_NAME` dan `OBSERVABILITY_LOG_LEVEL`;
4. isi `OBSERVABILITY_ERROR_WEBHOOK_URL` hanya jika endpoint error tracking HTTPS
   milik environment sudah tersedia; kosong berarti structured platform log tetap
   aktif tanpa outbound delivery;
5. uji limit dengan fixture non-production, auth bypass, upload mismatch/active PDF,
   header CSP, audit proof access, dan alert test pada staging;
6. pantau `booking.*`, `auth.*`, `request.unhandled_error`, dan `whatsapp.*` pada
   platform log/monitor yang dipilih.

Migration 013 wajib aktif sebelum release kode ini karena mutation booking fail
closed dan audit CMS/proof mengandalkan RPC baru tersebut.

