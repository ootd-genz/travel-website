# Supabase Migrations

Migration proyek mengikuti konvensi `src/migrations/NNN_nama.sql` yang ditetapkan
di `docs/project-guidelines.md`.

Urutan Phase 2:

1. `001_create_content_schema.sql`
2. `002_create_booking_schema.sql`
3. `003_enable_rls_and_private_storage.sql`
4. `004_seed_business_settings.sql`

Lanjutan:

5. `005_create_admin_auth_security.sql` — rate limit dan audit autentikasi admin.
6. `006_create_admin_cms_foundations.sql` — audit mutation CMS dan bucket media publik yang hanya dapat ditulis server.
7. `007_expose_public_site_settings.sql` — RPC read-only untuk branding, kontak publik, dan footer.
8. `008_add_booking_departure_snapshot.sql` — snapshot immutable untuk opsi keberangkatan yang dipilih saat draft dibuat.

9. `009_submit_booking_atomically.sql` — RPC service-role-only untuk submit
   booking, peserta, dan event secara atomik dengan row lock serta anti-submit
   ganda.
10. `010_admin_booking_management.sql` — RPC active-admin-only untuk transisi
    status booking dan catatan admin secara atomik bersama audit event.
11. `011_whatsapp_notification_delivery.sql` — RPC service-role-only untuk
    claim/finalize delivery WhatsApp secara idempotent, lease request aktif,
    batas tiga percobaan, dan backoff terkontrol.
12. `012_add_promotion_codes.sql` — kode promo privat, periode aktif, pembatasan
    visibilitas publik, dan snapshot kode promo immutable pada booking.
13. `013_security_hardening_observability.sql` — rate limit persisten untuk
    mutation booking publik, RPC audit admin tervalidasi, audit akses bukti
    transfer, dan trigger append-only untuk event audit kritis.

## Cara menerapkan

- Terapkan migration satu per satu sesuai nomor pada environment yang dituju.
- Gunakan Supabase SQL Editor atau koneksi Postgres terkontrol dengan role pemilik
  migration. Jangan menjalankan SQL ini dari browser atau dengan anon key.
- Jangan mengubah migration yang sudah pernah diterapkan pada shared/staging/
  production. Buat file bernomor berikutnya untuk perubahan baru.
- Setelah migration diterapkan, jalankan pgTAP test
  `supabase/tests/database/phase_2_schema_and_rls.test.sql` pada database test yang
  bersih. Test membuat fixture di dalam transaction dan selalu melakukan rollback.

## Membuat admin pertama (Phase 3)

Migration tidak membuat akun Auth atau menaruh credential di source. Setelah akun
admin dibuat secara terkontrol pada Supabase Auth, masukkan UUID-nya dengan role
server/SQL owner:

Gunakan script provisioning agar pembuatan user Auth dan allowlist dilakukan sebagai
satu prosedur dengan cleanup bila insert database gagal:

```powershell
$env:ADMIN_SETUP_EMAIL = "admin@example.com"
$env:ADMIN_SETUP_PASSWORD = Read-Host "Password admin" -MaskInput
$env:ADMIN_SETUP_DISPLAY_NAME = "Admin Travel"
npm run setup:admin
Remove-Item Env:ADMIN_SETUP_EMAIL, Env:ADMIN_SETUP_PASSWORD, Env:ADMIN_SETUP_DISPLAY_NAME
```

Credential setup tidak ditulis ke `.env.local`, source, atau dokumentasi. Script
menolak membuat akun bila sudah ada admin aktif.

Unique partial index memastikan hanya satu row `is_active = true`.
