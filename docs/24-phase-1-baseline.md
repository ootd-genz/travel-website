# Phase 1 — Project Setup & Baseline

Dokumen ini mencatat baseline aplikasi yang selesai dibangun untuk Phase 1.

## Implementasi

- Next.js `16.2.7` App Router dengan React dan React DOM `19.2.4`.
- TypeScript strict dan alias import `@/*`.
- Tailwind CSS 4 dengan semantic color tokens untuk light/dark theme.
- Konfigurasi shadcn dan primitive awal `Button` serta `Card`.
- Provider global untuk `next-themes`, TanStack React Query, dan Sonner.
- Route groups `(public)`, `(auth)`, dan `(admin)`.
- Shell publik responsif dengan lima menu yang sudah dikunci pada Phase 0.
- Baseline halaman `/`, `/blog`, `/activities`, `/destination`, dan `/trip-types`.
- Baseline `/admin/login` dan `/admin` dengan metadata `noindex`.
- Root loading, error, dan not-found state.
- Supabase SSR helper untuk browser, server, service role server-only, dan session proxy.
- Validasi environment menggunakan Zod dengan parsing saat konfigurasi dipakai.
- `env.example` berisi nama konfigurasi dan placeholder non-secret.
- Script `lint`, `typecheck`, `build`, dan agregat `check`.

## Batas Phase 1

- Route `/admin` belum melakukan authorization. Proteksi admin dikerjakan pada Phase 3 dan aplikasi tidak boleh dipublikasikan sebagai production sebelum itu.
- Belum ada migration, RLS, atau storage bucket. Scope tersebut dimulai pada Phase 2.
- Halaman konten masih berupa baseline; implementasi penuh dilakukan pada Phase 5.
- Belum ada booking atau WhatsApp runtime integration.
- Deployment sengaja tidak dilakukan karena roadmap menempatkannya pada Phase 13.

## Validasi

Hasil pada 29 Juli 2026:

| Pemeriksaan | Hasil |
|---|---|
| `npm run lint` | Lulus |
| `npm run typecheck` | Lulus |
| `npm run build` | Lulus |
| Next.js production routes | 8 route berhasil diprerender |
| Secret pattern pada source/config | Tidak ditemukan credential nyata |

Production build berhasil tanpa membutuhkan credential Supabase karena helper
baru membaca dan memvalidasi environment ketika koneksi benar-benar digunakan.
Nilai environment wajib tersedia sebelum fitur Supabase diaktifkan.

## Catatan Requirement

Dua blocker Phase 0 masih harus diberikan pemilik bisnis sebelum production:

- nama resmi pemilik rekening BCA;
- domain production untuk `APP_URL`.
