# Phase 3 — Single Admin Authentication

Dokumen ini mencatat implementasi autentikasi satu admin berdasarkan `roadmap.md`,
`14-auth-security-rls.md`, dan seluruh requirement terkait di folder `docs/`.

## Implementasi

- Login email/password memakai Supabase Auth melalui Server Action.
- Tidak ada route signup, invitation, user list, atau role management.
- `requireAdmin()` memverifikasi user ke server Auth melalui `getUser()`, lalu
  memeriksa `auth_user_id` pada `admin_users` yang masih aktif.
- Layout `/admin/*` memakai `requireAdminPage()` dan data page kembali memanggil
  `requireAdmin()` sebagai defense in depth.
- Proxy menyegarkan cookie session, mengarahkan request tanpa session ke login,
  mempertahankan internal `next` path, serta memasang `private, no-store` dan
  `X-Robots-Tag: noindex, nofollow`.
- User terautentikasi yang bukan admin aktif diarahkan ke `/admin/forbidden` dan
  sesinya dapat diakhiri dengan aman.
- Logout memakai Supabase SSR client, menghapus session cookie lokal, menulis
  audit, lalu kembali ke halaman login.
- Redirect setelah login dibatasi ke path internal `/admin` untuk mencegah open
  redirect.

## Login Rate Limit dan Audit

Migration `005_create_admin_auth_security.sql` menambahkan:

- rate limit persisten fixed-window: maksimum 5 percobaan per 15 menit;
- identifier email + IP disimpan sebagai HMAC SHA-256, bukan nilai mentah;
- RPC consume/reset hanya dapat dipanggil `service_role`;
- audit event untuk login sukses/gagal, rate limited, logout, access denied, dan
  session expired;
- audit hanya menyimpan actor UUID bila tersedia, identifier hash, IP hash,
  reason code terkontrol, dan timestamp;
- admin aktif dapat membaca audit melalui RLS, sedangkan anon/non-admin tidak.

## Provisioning Satu Admin

`npm run setup:admin` membuat user Supabase Auth dengan email terkonfirmasi lalu
memasukkannya ke allowlist `admin_users`. Credential dibaca dari environment
sementara `ADMIN_SETUP_EMAIL`, `ADMIN_SETUP_PASSWORD`, dan
`ADMIN_SETUP_DISPLAY_NAME`; tidak ditulis ke `.env.local` atau source.

Script menolak berjalan bila sudah ada admin aktif. Jika insert allowlist gagal,
user Auth yang baru dibuat dibersihkan agar tidak meninggalkan akun yatim.
Unique partial index Phase 2 tetap menjadi constraint database untuk satu admin
aktif.

## QA Lokal

Hasil pada 29 Juli 2026:

| Pemeriksaan | Hasil |
|---|---|
| `npm run lint` | Lulus |
| `npm run typecheck` | Lulus |
| `npm run test:phase2:static` | Lulus |
| `npm run test:phase3:static` | Lulus |
| `npm run build` | Lulus |
| Request tanpa session ke `/admin?tab=security` | `307` ke `/admin/login?next=%2Fadmin%3Ftab%3Dsecurity` |
| Header route admin/login | `private, no-store` + `noindex, nofollow` |
| Login page production build | `200`, form tersedia, metadata noindex |

## Aktivasi Runtime Supabase

Pemeriksaan read-only menemukan project remote belum memiliki user Auth dan belum
memiliki row `admin_users` aktif. Aktivasi runtime memerlukan dua tindakan yang
tidak boleh menggunakan credential buatan atau disimpan di repo:

1. apply migration `005_create_admin_auth_security.sql` dengan credential database
   Supabase yang sah;
2. jalankan `npm run setup:admin` menggunakan email, password kuat, dan nama admin
   yang dipilih pemilik project.

Setelah itu, QA runtime menguji login benar/salah, lima percobaan rate limit,
authenticated non-admin, session expiry, logout, dan row audit. Production admin
tetap dibuat/dirotasi melalui prosedur terkontrol pada Phase 13.

