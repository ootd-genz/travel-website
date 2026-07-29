# Single Admin Auth, Authorization & RLS

## Model Auth

- hanya satu akun admin;
- akun dibuat manual/terkontrol di Supabase Auth;
- **tidak ada public signup**;
- login menggunakan Supabase Auth;
- logout menghapus session dengan benar;
- MFA direkomendasikan untuk admin bila tersedia.

## Authorization

Route `/admin` bukan kontrol keamanan utama. Setiap server action/data access sensitif wajib memanggil helper konseptual `requireAdmin()` yang:

1. membaca session di server;
2. memastikan user authenticated;
3. memastikan `auth_user_id` ada di `admin_users` aktif;
4. menolak selain admin.

## RLS Strategy

### Public content

Anon boleh `SELECT` hanya row published/active yang memang publik.

### Admin content mutation

Hanya authenticated admin yang boleh insert/update/delete sesuai policy dan server authorization.

### Booking

Public tidak diberi kemampuan bebas membaca table booking.

Pilihan aman untuk v1:

- booking mutation dilakukan melalui server action/route handler tervalidasi;
- service role hanya dipakai pada server module khusus bila diperlukan;
- browser tidak pernah menerima service role key;
- endpoint public memiliki rate limit, payload limit, validation, dan idempotency.

Admin membaca booking melalui server/authenticated access yang memverifikasi admin.

## Storage Policy

Transfer proof private dan hanya admin berizin yang dapat memperoleh signed URL singkat.

## Login Security

- rate limit login;
- pesan gagal login tidak membocorkan detail sensitif;
- cookie session secure di production;
- noindex pada login/admin;
- tidak menyimpan token di localStorage bila mekanisme SSR session sudah tersedia.

## Booking Endpoint Security

- Zod server validation;
- rate limit per kombinasi IP/token/session context yang sesuai;
- draft token random;
- anti double submit;
- server-side total calculation;
- file validation;
- no stack trace ke client;
- logging dengan PII minimal/redacted.

## Security Headers

Rancang CSP berdasarkan resource nyata. Minimum pertimbangan:

- `frame-ancestors` / X-Frame-Options fallback;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy`;
- `Permissions-Policy`;
- HSTS hanya production HTTPS setelah siap;
- jangan mengaktifkan unsafe source tanpa kebutuhan.

## PII

Jangan log:

- bukti transfer;
- access token;
- raw session cookie;
- service role key;
- full sensitive payload tanpa kebutuhan.

Nomor WhatsApp/email pada log operasional sebaiknya disamarkan bila konteks tidak membutuhkan nilai penuh.

## Audit Admin

Action penting seperti konfirmasi pembayaran mencatat actor, target booking, timestamp, hasil, dan alasan jika ada.

## Prioritas

Sesuai guideline: keamanan dan integritas data mengalahkan kecepatan implementasi atau kemudahan UI.
