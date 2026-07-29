# Phase 4 — Admin CMS Core

Dokumen ini mencatat implementasi CMS admin berdasarkan seluruh requirement di
folder `docs/`, terutama PRD dashboard, workflow konten, model data, authorization,
upload media, revalidation, dan acceptance criteria.

## Implementasi

- Shell admin responsif dengan sidebar desktop dan Sheet Radix/shadcn pada mobile.
- Dashboard ringkas untuk total paket, paket published, destinasi, dan artikel.
- List, pencarian terbatas 100 row, create, edit, publish/draft/archive, serta delete
  terkonfirmasi untuk:
  - Paket Travel;
  - Destination;
  - Activities;
  - Trip Types;
  - Blog;
  - Promotions.
- Editor khusus Home untuk hero, CTA internal, visibilitas delapan section, status
  publikasi, dan CRUD USP.
- Editor Site Settings untuk branding, kontak, footer, social link, rekening BCA,
  nama pemilik rekening, dan nomor WhatsApp admin. Credential provider tetap tidak
  dapat diedit dari dashboard.
- Form panjang dipisah menjadi card Informasi Utama, Harga, Relasi, Media, Detail
  Perjalanan, Kurasi Home, dan SEO.
- Loading, empty, error, success, pending-submit, dan destructive confirmation state.

## Server, Authorization, dan Integritas Data

- Semua read dan mutation kembali memanggil `requireAdmin()`; proteksi layout tidak
  dijadikan satu-satunya authorization.
- Input `FormData`, route ID, status, harga, peserta, coordinate, periode promo,
  social URL, CTA internal, dan relasi divalidasi menggunakan Zod di server.
- Status `published` mengisi `published_at`; draft/archive tidak dapat terbaca oleh
  policy public Phase 2.
- Relasi paket, artikel, dan promo disinkronkan melalui junction table yang sudah
  memiliki foreign key dan composite primary key.
- Delete permanen memakai confirmation gate `HAPUS`; foreign key database menolak
  penghapusan yang merusak relasi atau history, sehingga admin diarahkan memakai
  archive.
- Mutation memicu revalidation spesifik untuk list/detail publik, Home, serta route
  admin yang terdampak.

## Media Konten

Migration `006_create_admin_cms_foundations.sql` menambahkan bucket
`content-media` yang:

- public-read untuk asset website yang memang dipublikasikan;
- maksimum 5 MiB;
- hanya menerima JPEG, PNG, dan WebP;
- tidak memberikan policy upload/update/delete kepada anon atau authenticated;
- hanya ditulis server-side dengan service role setelah `requireAdmin()`.

Server memeriksa ukuran, MIME allowlist, dan signature dasar file; object key memakai
UUID acak dan tidak memakai nama file customer. Upload baru dibersihkan bila database
mutation gagal sebelum row tersimpan, media lama dibersihkan setelah update sukses,
dan media record yang benar-benar dihapus juga dibersihkan. Bucket ini terpisah dari
bucket private `booking-transfer-proofs`.

## Audit CMS

Migration `006` juga menambahkan `content_change_events` yang append-only untuk
create, update, delete, publish, dan archive. RLS memastikan hanya admin aktif yang
dapat membaca/menulis event serta `actor_id` harus sama dengan `auth.uid()`. Metadata
audit tidak menyimpan secret.

## QA Lokal

Hasil pada 29 Juli 2026:

| Pemeriksaan | Hasil |
|---|---|
| `npm run lint` | Lulus tanpa warning |
| `npm run typecheck` | Lulus |
| `npm run test:phase2:static` | Lulus |
| `npm run test:phase3:static` | Lulus |
| `npm run test:phase4:static` | Lulus — route, auth, validation, media, relasi, publish, audit |
| `npm run build` | Lulus — 22 route admin Phase 4 terdeteksi sebagai dynamic/private |
| `npm audit --omit=dev` | 3 advisory high pada Next.js 16.2.7 serta PostCSS/Sharp transitif |

Static test Phase 4 juga menjalankan schema Zod aktual untuk menolak sale price di
atas base price, paket tanpa destinasi, coordinate parsial, promo invalid, CTA Home
eksternal, dan business settings invalid.

Perbaikan audit otomatis tidak dijalankan karena `npm audit fix --force` akan
menaikkan Next.js ke 16.2.12, sedangkan seluruh dokumentasi proyek masih mengunci
versi wajib 16.2.7. Upgrade patch perlu keputusan versi terkontrol dan pengulangan
regression test; temuan ini diteruskan ke Phase 11 Security Hardening.

## Aktivasi Runtime Supabase

Implementasi lokal selesai. Runtime CRUD/upload pada remote tetap mengikuti blocker
Phase 3 yang sudah terdokumentasi:

1. apply migration `005_create_admin_auth_security.sql`;
2. apply migration `006_create_admin_cms_foundations.sql`;
3. provision satu admin menggunakan `npm run setup:admin` dengan credential milik
   pemilik project;
4. ulangi integration QA CRUD, upload, publish/unpublish, signed public media read,
   anon write denial, relasi, dan audit pada staging.

Tidak ada credential admin atau database yang dibuat, dicetak, atau disimpan di
repository selama Phase 4.
