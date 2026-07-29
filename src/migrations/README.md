# Supabase Migrations

Migration proyek mengikuti konvensi `src/migrations/NNN_nama.sql` yang ditetapkan
di `docs/project-guidelines.md`.

Urutan Phase 2:

1. `001_create_content_schema.sql`
2. `002_create_booking_schema.sql`
3. `003_enable_rls_and_private_storage.sql`
4. `004_seed_business_settings.sql`

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
