# Arsitektur & Tech Stack

Dokumen ini menurunkan `project-guidelines.md` menjadi keputusan arsitektur spesifik untuk website travel.

## Tech Stack Wajib

- Next.js `16.2.7` — App Router
- React / React DOM `19.2.4`
- TypeScript
- Tailwind CSS `4`
- shadcn + Radix UI
- lucide-react / @hugeicons/react
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- TanStack React Query
- TanStack React Table
- Zustand hanya untuk global client state yang benar-benar perlu
- react-hook-form + zod
- Recharts untuk chart admin bila dibutuhkan
- maplibre-gl bila peta destinasi digunakan
- Sonner untuk feedback global singkat
- next-themes untuk tema

## Prinsip Arsitektur

### Server Component sebagai default

Halaman publik sebaiknya dirender sebagai Server Component. Client Component hanya digunakan untuk:

- form booking interaktif;
- upload progress;
- filter/search yang memerlukan state client;
- dialog, sheet, atau interaksi browser tertentu;
- maplibre-gl.

### Data access server-side

Business logic penting tidak diletakkan di komponen UI. Query, authorization, pricing, booking creation, status transition, upload, dan WhatsApp notification dipusatkan pada server layer.

### Tidak melakukan internal HTTP yang tidak perlu

Server Component memanggil data-access layer secara langsung, bukan memanggil endpoint internal melalui HTTP bila function yang sama tersedia pada server.

## Struktur Route yang Disarankan

```text
src/app/
├── (public)/
│   ├── page.tsx
│   ├── blog/
│   ├── activities/
│   ├── destination/
│   ├── trip-types/
│   ├── trips/[slug]/
│   └── booking/[token]/
├── (auth)/
│   └── admin/login/
├── (admin)/
│   └── admin/
│       ├── page.tsx
│       ├── bookings/
│       ├── trips/
│       ├── destinations/
│       ├── activities/
│       ├── trip-types/
│       ├── blog/
│       ├── promotions/
│       ├── home/
│       └── settings/
└── api/
    └── integrations/
```

Ini hanya rancangan dokumentasi, bukan instruksi untuk membuat source sekarang.

## Supabase

### Database

- tabel public content dengan RLS;
- tabel booking private;
- tabel audit dan notification delivery;
- migration bernomor `001_...`, `002_...`, dan seterusnya.

### Storage

Bucket bukti transfer harus private. Signed URL hanya dibuat untuk admin yang sudah terautentikasi.

## Rendering & Cache

| Data | Strategi |
|---|---|
| Home/public content | cache + revalidation sesuai frekuensi update |
| Blog list/detail | cache/revalidation setelah publish/update |
| Destination/Activities/Trip Types | cache/revalidation |
| Paket travel | cache/revalidation, tetapi availability/harga kritis diverifikasi server ketika booking |
| Booking admin | dynamic/private, jangan shared cache |
| Booking detail publik via token | dynamic, token-scoped, noindex |

Setelah admin mengubah konten, invalidasi hanya resource/page terkait.

## Form

- react-hook-form untuk UX client;
- zod shared schema bila memungkinkan;
- validasi server tetap wajib;
- submit button disabled/loading saat proses;
- double-submit dicegah dengan idempotency/booking token.

## Dashboard Table

Gunakan TanStack Table untuk daftar booking dan konten kompleks. Filtering, sorting, dan pagination dataset yang bertumbuh dilakukan server-side.

## Security Baseline

- semua input browser tidak tepercaya;
- service role key hanya server;
- admin session + authorization dicek di server;
- endpoint publik booking/upload memiliki rate limit dan payload limit;
- CSP, nosniff, referrer policy, frame protection, dan security headers disesuaikan kebutuhan integrasi;
- admin/auth/private route `noindex`.

## Dependency Policy

Jangan menambah library baru untuk fungsi yang dapat ditangani aman dengan dependency existing. Untuk integrasi WhatsApp, buat abstraction server-side agar provider dapat diganti tanpa mengubah domain booking.
