# Pedoman Pengembangan Proyek

Dokumen ini menjadi acuan arsitektur, implementasi, keamanan, kualitas, dan proses pengembangan proyek.

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Prinsip Umum](#prinsip-umum)
- [Arsitektur Next.js](#arsitektur-nextjs)
- [Frontend](#frontend)
- [Aksesibilitas](#aksesibilitas)
- [TypeScript dan Kualitas Kode](#typescript-dan-kualitas-kode)
- [Server Actions dan Route Handlers](#server-actions-dan-route-handlers)
- [Supabase](#supabase)
- [Keamanan Web](#keamanan-web)
- [Performa dan Skalabilitas](#performa-dan-skalabilitas)
- [SEO](#seo)
- [Caching dan Revalidation](#caching-dan-revalidation)
- [Logging, Monitoring, dan Audit](#logging-monitoring-dan-audit)
- [Testing](#testing)
- [Status Antarmuka](#status-antarmuka)
- [Dark Mode dan Tema](#dark-mode-dan-tema)
- [API dan Integrasi Pihak Ketiga](#api-dan-integrasi-pihak-ketiga)
- [Struktur Folder dan Modularitas](#struktur-folder-dan-modularitas)
- [Konvensi Penamaan](#konvensi-penamaan)
- [Git dan Code Review](#git-dan-code-review)
- [CI/CD dan Deployment](#cicd-dan-deployment)
- [Checklist Sebelum Selesai](#checklist-sebelum-selesai)
- [Aturan Penggunaan AI/Coding Agent](#aturan-penggunaan-aicoding-agent)
- [Prioritas Pengambilan Keputusan](#prioritas-pengambilan-keputusan)

## Tech Stack

### Teknologi Utama

- `next` 16.2.12 sebagai framework aplikasi (patch keamanan Phase 11).
- `react` 19.2.4 dan `react-dom` 19.2.4 untuk membangun UI.
- `typescript` untuk type safety.
- `tailwindcss` 4 untuk styling.
- `shadcn`, `radix-ui`, `lucide-react`, dan `@hugeicons/react` untuk komponen UI dan ikon.
- `@supabase/ssr` dan `@supabase/supabase-js` untuk integrasi Supabase.
- `@tanstack/react-query` untuk data fetching dan cache di sisi klien.
- `@tanstack/react-table` untuk tabel data admin.
- `zustand` untuk global state yang ringan.
- `react-hook-form`, `@hookform/resolvers`, dan `zod` untuk form dan validasi.
- `recharts` untuk chart pada dashboard.
- `maplibre-gl` untuk peta.
- `sonner` untuk toast notification.
- `next-themes` dan `@teispace/next-themes` untuk pengelolaan tema.

> Pastikan seluruh UI pada website menggunakan komponen shadcn.

### Variabel Lingkungan

Contoh konfigurasi variabel lingkungan tersedia di `env.example`.

Variabel utama:

- `NEXT_PUBLIC_SUPABASE_URL`: URL project Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon key Supabase untuk klien dan session server biasa.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key untuk operasi admin di sisi server.

### Migrasi SQL Supabase

Gunakan penomoran berurutan untuk file migrasi:

- `src/migrations/001_...`: membuat tabel atau perubahan skema pertama.
- `src/migrations/002_...`: membuat tabel atau perubahan skema berikutnya.
- Lanjutkan dengan pola penomoran yang sama untuk migrasi berikutnya.

### Struktur Folder Proyek

```text
.
|-- docs/
|-- note/
|-- public/
|   |-- flag/
|   `-- logo/
|-- src/
|   |-- actions/
|   |-- app/
|   |   |-- (admin)/
|   |   |-- (auth)/
|   |   |-- (public)/
|   |   |-- _components/
|   |   `-- api/
|   |-- components/
|   |   |-- common/
|   |   `-- ui/
|   |-- configs/
|   |-- constants/
|   |-- hooks/
|   |-- lib/
|   |   `-- supabase/
|   |-- migrations/
|   |-- providers/
|   |-- stores/
|   |-- types/
|   |-- validations/
|   `-- proxy.ts
|-- env.example
|-- next.config.ts
|-- package.json
`-- tsconfig.json
```

File penting di root:

- `package.json`: script dan dependency.
- `next.config.ts`: konfigurasi Next.js.
- `tsconfig.json`: konfigurasi TypeScript dan alias `@/*`.
- `components.json`: konfigurasi Shadcn UI.
- `env.example`: contoh environment variable.
- `.env.local`: environment variable lokal, tidak boleh dibagikan.

### Penjelasan Folder Penting

- `src/app/`: folder App Router. Route menjadi aktif jika memiliki `page.tsx` atau `route.ts`.
- `src/app/(public)/`: route group untuk halaman publik. Nama `(public)` tidak muncul di URL.
- `src/app/(auth)/`: route group untuk halaman login.
- `src/app/(admin)/`: route group untuk dashboard admin. Nama `(admin)` tidak muncul di URL.
- `src/app/api/`: route handler API internal.
- `src/actions/`: Server Actions global, seperti sign out dan storage action.
- `src/components/common/`: komponen reusable yang dekat dengan kebutuhan aplikasi.
- `src/components/ui/`: komponen dasar UI dari Shadcn/Radix.
- `src/configs/`: konfigurasi aplikasi, terutama pembacaan env.
- `src/constants/`: initial state, daftar role, header tabel, dan konstanta domain.
- `src/hooks/`: custom hook.
- `src/lib/supabase/`: client, server client, dan middleware Supabase.
- `src/migrations/`: SQL schema dan trigger untuk Supabase.
- `src/providers/`: provider global React Query dan auth store.
- `src/stores/`: Zustand store untuk auth dan berita.
- `src/types/`: tipe TypeScript domain.
- `src/validations/`: schema validasi Zod.
- `public/`: aset statis yang bisa diakses langsung dari URL.
- `docs/`: catatan dan dokumentasi internal proyek.

## Prinsip Umum

- Utamakan kode yang aman, sederhana, mudah dibaca, mudah diuji, dan mudah dipelihara.
- Gunakan kemampuan bawaan Next.js, React, TypeScript, Supabase, dan library yang sudah tersedia sebelum menambah dependency baru.
- Jangan menambah dependency hanya untuk fungsi kecil yang dapat dibuat dengan aman dan ringkas menggunakan API yang sudah tersedia.
- Hindari over-engineering. Abstraksi dibuat setelah pola penggunaan benar-benar berulang atau memiliki alasan arsitektural yang jelas.
- Semua perubahan harus mempertimbangkan keamanan, aksesibilitas, performa, SEO, observability, dan maintainability sejak awal.
- Hindari perubahan besar yang tidak berkaitan dengan scope pekerjaan aktif.
- Jangan mengubah kontrak API, schema database, struktur URL publik, atau bentuk data yang sudah digunakan tanpa mempertimbangkan backward compatibility dan migration plan.
- Jangan menaruh business logic penting hanya di komponen UI.
- Jangan mempercayai data dari browser, URL, cookie, request body, header, webhook, file upload, atau third-party API tanpa validasi.

## Arsitektur Next.js

### App Router dan Rendering

- Gunakan App Router pada `src/app`.
- Gunakan Server Component sebagai default.
- Tambahkan `'use client'` hanya ketika komponen benar-benar membutuhkan state React, lifecycle/effect, event handler interaktif, browser API, atau library yang hanya dapat berjalan di browser.
- Jaga batas Client Component sekecil mungkin agar JavaScript yang dikirim ke browser tidak membesar tanpa kebutuhan.
- Jangan mengubah seluruh page atau layout menjadi Client Component hanya karena satu bagian kecil membutuhkan interaktivitas; pisahkan bagian tersebut menjadi komponen client tersendiri.
- Data yang dapat diambil di server sebaiknya diambil langsung di Server Component, server utility, atau data-access layer.
- Gunakan `loading.tsx`, `error.tsx`, `not-found.tsx`, dan Suspense secara tepat untuk pengalaman loading/error yang jelas.
- Gunakan route group seperti `(admin)`, `(auth)`, dan `(public)` untuk organisasi route, bukan sebagai mekanisme authorization.
- Jangan mengandalkan layout, menu tersembunyi, redirect client-side, atau route group sebagai kontrol akses keamanan.
- Pilih static rendering, dynamic rendering, cache, dan revalidation sesuai karakter data; jangan memaksa semua halaman menjadi dynamic tanpa alasan.
- Hindari pemanggilan API internal melalui HTTP dari Server Component apabila data/function yang sama dapat dipanggil langsung dari server code.

### Data Access Layer

- Pusatkan query dan aturan akses data yang sensitif pada server-side data-access layer di `src/lib`, `src/actions`, atau modul domain yang sesuai.
- Pisahkan query database dari presentational component.
- Untuk data sensitif, kembalikan hanya field yang diperlukan oleh UI; hindari mengirim seluruh record ke client.
- Hindari `select('*')` untuk data sensitif atau tabel besar. Pilih kolom secara eksplisit ketika memungkinkan.
- Authorization harus dicek sedekat mungkin dengan operasi data atau mutation, bukan hanya pada level halaman.
- Gunakan helper authorization yang reusable untuk aturan role/permission yang digunakan berulang.

## Frontend

### Komponen UI

- Gunakan komponen dari shadcn sebagai fondasi UI website.
- Komponen reusable lintas halaman ditempatkan pada `src/components/common`.
- Komponen primitive/generik shadcn ditempatkan pada `src/components/ui`.
- Komponen yang hanya digunakan oleh satu route dapat ditempatkan dekat route tersebut, misalnya di folder `_components`.
- Hindari membuat ulang button, dialog, dropdown, input, tooltip, sheet, tabs, table primitive, atau komponen dasar lain apabila versi shadcn/Radix sudah tersedia.
- Gunakan `lucide-react` atau `@hugeicons/react` secara konsisten. Jangan mencampur gaya ikon tanpa alasan desain.
- Setiap komponen harus mempunyai tanggung jawab yang jelas dan tidak terlalu besar.
- Pecah komponen ketika logic, markup, atau state sudah sulit dibaca atau memiliki bagian reusable yang jelas.
- Hindari prop drilling yang panjang; pilih composition, context lokal, atau state store hanya ketika memang diperlukan.

### Navigasi

- Pastikan navigasi internal menggunakan client-side navigation atau client-side routing.
- Gunakan `next/link` untuk navigasi internal berbasis link.
- Gunakan router dari Next.js hanya untuk navigasi imperatif yang memang diperlukan setelah action tertentu.
- Jangan menggunakan `window.location` untuk navigasi internal kecuali benar-benar membutuhkan full page reload.
- Pertahankan state yang layak dibagikan/bookmark seperti pencarian, filter, sorting, pagination, tab penting, atau rentang tanggal di URL apabila relevan.
- Validasi semua query parameter dan route parameter sebelum digunakan.
- Redirect yang menerima target dari user harus menggunakan allowlist/path internal untuk mencegah open redirect.

### Responsive Design

- Gunakan pendekatan mobile-first.
- Pastikan UI dapat digunakan minimal pada mobile kecil, tablet, laptop, dan desktop lebar.
- Hindari lebar fixed yang menyebabkan horizontal scroll pada mobile.
- Table admin harus memiliki strategi responsive yang jelas, misalnya horizontal scroll, column visibility, atau layout alternatif.
- Pastikan dialog, sheet, dropdown, tooltip, popover, dan menu tetap dapat digunakan pada layar kecil.
- Gunakan spacing, typography, dan breakpoint secara konsisten.

### Form

- Gunakan `react-hook-form` untuk form kompleks atau form yang membutuhkan state/validation client yang terstruktur.
- Gunakan `zod` sebagai schema validasi bersama bila memungkinkan.
- Validasi client digunakan untuk UX, tetapi validasi server tetap wajib untuk data yang akan diproses/disimpan.
- Tampilkan error pada field yang relevan dan sediakan pesan error yang dapat dipahami pengguna.
- Disable atau beri loading state pada submit untuk mencegah submit ganda.
- Mutation yang tidak idempotent harus dilindungi dari eksekusi ganda pada UI dan server bila relevan.
- Jangan memasukkan data sensitif ke query string.
- Jangan menampilkan nilai secret, token, credential, atau data internal dalam error form.

### State Management

- Gunakan state lokal React untuk state yang hanya dibutuhkan oleh satu komponen/subtree kecil.
- Gunakan URL state untuk filter, sort, search, pagination, dan state navigasi yang perlu dapat dibagikan atau dipulihkan.
- Gunakan `@tanstack/react-query` untuk server state di client yang membutuhkan cache, refetch, mutation, invalidation, polling, atau optimistic update.
- Gunakan Zustand hanya untuk global client state yang benar-benar lintas komponen dan tidak cocok sebagai server state atau URL state.
- Jangan menduplikasi data server yang sama ke React Query dan Zustand tanpa alasan kuat.
- Hindari menyimpan data sensitif di `localStorage` atau `sessionStorage`.

### Data Fetching Client

- Jangan melakukan client-side fetch apabila data dapat dirender di server dengan lebih sederhana dan aman.
- Gunakan React Query pada halaman interaktif yang memang membutuhkan client cache/refetch.
- Tentukan query key secara konsisten dan stabil.
- Setelah mutation, invalidasi atau update cache yang relevan saja.
- Tangani loading, empty, error, stale, dan success state secara eksplisit.
- Batalkan atau abaikan request lama pada fitur search/filter yang cepat berubah bila diperlukan untuk mencegah race condition.
- Gunakan debounce pada input pencarian sesuai aturan yang sudah ada, tetapi jangan menambahkan debounce pada aksi yang perlu respons langsung tanpa alasan.

### Gambar, Font, dan Asset

- Gunakan `next/image` untuk gambar yang mendapat manfaat dari optimasi Next.js.
- Tentukan dimensi/aspect ratio agar mengurangi layout shift.
- Gunakan `alt` yang deskriptif untuk gambar bermakna dan `alt=""` untuk gambar dekoratif.
- Validasi remote image host pada konfigurasi Next.js; jangan membuka pola host terlalu luas tanpa kebutuhan.
- Gunakan `next/font` bila sesuai agar font loading lebih optimal.
- Optimalkan file gambar sebelum dimasukkan ke `public` bila ukuran file besar.
- Jangan menyimpan file rahasia atau source file sensitif di folder `public`.

### Tabel dan Dashboard

- Gunakan `@tanstack/react-table` untuk tabel kompleks seperti sorting, filtering, selection, pagination, atau column visibility.
- Untuk dataset besar, gunakan pagination/filtering/sorting server-side daripada mengirim seluruh data ke browser.
- Jangan render ribuan row sekaligus tanpa pagination atau virtualization bila memang diperlukan.
- Chart harus memiliki label, tooltip, unit, legend, empty state, dan konteks periode data yang jelas.
- Jangan hanya mengandalkan warna untuk menyampaikan status atau kategori.

### Map

- Inisialisasi `maplibre-gl` hanya di client component.
- Lazy-load peta apabila bukan konten utama di atas fold.
- Batasi jumlah marker/feature yang dirender sekaligus dan gunakan clustering bila volume data besar.
- Jangan mengekspos API key privat melalui konfigurasi map client.
- Validasi data koordinat sebelum dirender.

## Aksesibilitas

- Targetkan praktik WCAG 2.2 level AA untuk fitur utama.
- Gunakan elemen HTML semantik sebelum menambahkan role ARIA.
- Semua kontrol interaktif harus dapat digunakan dengan keyboard.
- Pastikan focus state terlihat jelas.
- Dialog, dropdown, popover, tabs, accordion, tooltip, dan menu harus menggunakan primitive Radix/shadcn yang mempertahankan perilaku aksesibel.
- Form input harus memiliki label yang terhubung dengan benar.
- Error form harus dapat diketahui pengguna screen reader bila relevan.
- Jangan menggunakan placeholder sebagai pengganti label utama.
- Pastikan kontras teks dan kontrol memadai pada light mode dan dark mode.
- Hormati `prefers-reduced-motion` untuk animasi yang tidak esensial.
- Hindari animasi yang mengganggu atau terlalu lama.
- Gunakan heading hierarchy (`h1` sampai `h6`) secara logis.
- Sediakan nama aksesibel untuk icon-only button menggunakan label yang sesuai.

## TypeScript dan Kualitas Kode

- Aktifkan dan pertahankan konfigurasi TypeScript yang ketat sesuai kemampuan project.
- Hindari `any`. Gunakan type spesifik, generic, `unknown`, atau schema parsing sesuai konteks.
- Jangan menggunakan type assertion untuk menutupi data yang belum divalidasi.
- Parse data eksternal sebelum dianggap memiliki type internal yang valid.
- Gunakan naming yang deskriptif dan konsisten.
- Hindari magic number/string; pindahkan ke constant/config apabila memiliki arti domain.
- Jangan membuat duplicate type untuk shape data yang sama tanpa alasan.
- Type khusus domain ditempatkan pada `src/types` atau dekat domain terkait apabila hanya digunakan lokal.
- Schema Zod ditempatkan pada `src/validations` atau dekat fitur jika hanya digunakan fitur tersebut.
- Jangan mengabaikan error TypeScript atau lint dengan komentar disable global tanpa alasan terdokumentasi.
- Hapus import, variable, function, dan dependency yang tidak digunakan.

## Server Actions dan Route Handlers

- Perlakukan Server Actions dan Route Handlers sebagai endpoint publik dari sudut pandang keamanan.
- Setiap action/handler yang membutuhkan login wajib memverifikasi session di server.
- Setiap action/handler sensitif wajib memverifikasi authorization/role/ownership di server.
- Jangan mengandalkan disabled button atau menu tersembunyi sebagai authorization.
- Validasi `FormData`, JSON body, path params, query params, dan header yang digunakan menggunakan schema yang jelas.
- Gunakan status HTTP yang sesuai pada Route Handler.
- Jangan mengembalikan stack trace, SQL error mentah, credential, token, atau detail infrastruktur kepada client.
- Gunakan response error yang konsisten dan aman.
- Terapkan rate limit pada endpoint yang rentan abuse, misalnya login, signup, password reset, search mahal, upload, webhook, public mutation, dan endpoint yang memicu third-party API.
- Terapkan timeout atau batas kerja untuk operasi eksternal yang berpotensi menggantung.
- Pastikan webhook memverifikasi signature/secret dari provider sebelum memproses payload.
- Pertimbangkan idempotency key untuk endpoint pembayaran, webhook, atau mutation penting yang berisiko dieksekusi ulang.

## Supabase

### Client Supabase

- Pisahkan helper Supabase untuk browser dan server pada `src/lib/supabase`.
- Browser hanya boleh menggunakan key yang memang aman untuk client seperti anon/publishable key.
- `SUPABASE_SERVICE_ROLE_KEY` tidak boleh pernah dikirim ke client bundle, browser, log publik, analytics, atau response API.
- Jangan menamai module service-role dengan pola yang berpotensi di-import oleh Client Component.
- Gunakan service role hanya untuk operasi backend/admin yang benar-benar membutuhkan bypass RLS.

### Row Level Security

- Aktifkan RLS pada semua tabel yang berada di schema yang diekspos ke Supabase Data API, terutama `public`.
- Buat policy eksplisit untuk operasi `SELECT`, `INSERT`, `UPDATE`, dan `DELETE` sesuai kebutuhan.
- Gunakan prinsip least privilege: user hanya boleh membaca/mengubah row yang memang menjadi haknya.
- Untuk data multi-tenant, setiap query dan policy harus mempertimbangkan `tenant_id`, `organization_id`, atau ownership yang sesuai.
- Jangan hanya mengandalkan filter query aplikasi untuk membatasi row; RLS harus menjadi lapisan pertahanan database.
- Uji policy dengan role `anon` dan `authenticated`, bukan hanya dari SQL editor/admin.
- Tambahkan index pada kolom yang sering dipakai policy RLS atau filter besar agar authorization tidak menimbulkan query lambat.
- View yang mengekspos data harus ditinjau apakah mengikuti RLS; gunakan konfigurasi security yang tepat dan jangan mengasumsikan view otomatis aman.

### Database Design

- Semua tabel utama harus memiliki primary key yang jelas.
- Gunakan foreign key untuk menjaga referential integrity.
- Gunakan `NOT NULL`, `UNIQUE`, `CHECK`, enum/domain, atau constraint lain bila aturan bisnis dapat dijaga di database.
- Gunakan timestamp yang konsisten, misalnya `created_at` dan `updated_at`, bila relevan.
- Simpan waktu dalam format/timestamp yang konsisten dan lakukan konversi timezone pada layer presentasi bila diperlukan.
- Hindari data redundant yang mudah tidak sinkron kecuali memang merupakan denormalization yang disengaja dan terdokumentasi.
- Tambahkan index berdasarkan pola query nyata, bukan hanya karena sebuah kolom terlihat penting.
- Hindari index berlebihan karena menambah biaya write dan storage.
- Gunakan pagination pada query list yang dapat tumbuh besar.
- Pilih keyset/cursor pagination untuk dataset sangat besar atau data yang sering berubah apabila offset pagination sudah menjadi bottleneck.
- Hindari N+1 query; gabungkan query atau gunakan relasi/RPC yang terkontrol bila lebih efisien.
- Jangan menjalankan operasi destruktif pada migration tanpa rencana migrasi/backfill/backup yang jelas.

### Migration

- Pertahankan pola penomoran migration yang sudah ditentukan: `001_...`, `002_...`, dan seterusnya.
- Setiap perubahan schema produksi harus dibuat melalui migration yang dapat direview dan dilacak di Git.
- Jangan mengedit migration yang sudah pernah dijalankan di environment bersama/production; buat migration baru.
- Nama migration harus menjelaskan perubahan, misalnya `003_add_orders_status_index.sql`.
- Pisahkan perubahan schema besar menjadi tahap aman bila membutuhkan backfill data.
- Untuk perubahan kolom besar: tambah struktur baru, backfill, pindahkan pembacaan/penulisan, lalu hapus struktur lama pada migration terpisah bila diperlukan.
- Migration harus mempertimbangkan lock table dan dampak pada traffic production.

### Storage

- Terapkan policy akses untuk bucket/file Supabase Storage sesuai ownership dan role.
- Jangan membuat bucket public untuk data private hanya demi kemudahan implementasi.
- Gunakan signed URL dengan masa berlaku terbatas untuk file private apabila diperlukan.
- Validasi tipe file, ukuran, ekstensi, dan konten dasar pada upload.
- Jangan mempercayai MIME type yang dikirim browser sebagai satu-satunya validasi.
- Gunakan nama object yang aman dan tidak bergantung pada nama file user secara mentah.
- Hindari eksekusi/serving file user dengan content type yang dapat membuka risiko script injection.

## Keamanan Web

### Secret dan Environment Variable

- File `.env.local` tidak boleh masuk Git.
- `env.example` hanya berisi nama variable dan contoh nilai yang tidak sensitif.
- Variable dengan prefix `NEXT_PUBLIC_` dianggap dapat terekspos ke browser dan tidak boleh berisi secret.
- Secret production harus disimpan pada secret manager/environment platform deployment.
- Rotasi key/token apabila ada kemungkinan bocor.
- Jangan menulis secret ke log, toast, error UI, analytics, monitoring breadcrumb, atau exception metadata.
- Jangan mengekspos `process.env` secara menyeluruh ke client.

### Authentication dan Session

- Verifikasi session pada server untuk halaman/action/handler yang membutuhkan autentikasi.
- Bedakan authentication (siapa user) dan authorization (apa yang boleh dilakukan user).
- Untuk operasi sensitif, cek authorization berdasarkan data terbaru di server/database.
- Jangan mempercayai role, user id, tenant id, harga, status transaksi, atau permission yang dikirim dari client tanpa verifikasi server.
- Cookie session yang dikelola aplikasi harus menggunakan pengaturan aman seperti `HttpOnly`, `Secure` pada production, dan `SameSite` yang sesuai dengan alur aplikasi.
- Jangan menyimpan access token sensitif di `localStorage` apabila dapat menggunakan mekanisme session/cookie yang lebih aman.
- Terapkan proteksi brute-force/rate limit pada login dan flow auth sensitif.
- Aktifkan CAPTCHA/bot protection jika abuse nyata atau risiko signup/login tinggi.
- Pertimbangkan MFA untuk role admin atau operasi kritikal.

### Authorization

- Gunakan deny-by-default untuk resource sensitif.
- Selalu cek ownership/tenant membership/role pada server sebelum read atau mutation sensitif.
- Hindari authorization hanya berdasarkan route seperti `/admin`; data dan action tetap harus melakukan pemeriksaan sendiri.
- Jangan mengambil `user_id` target dari client untuk operasi "milik saya" apabila ID tersebut dapat ditentukan dari session server.
- Untuk admin action, log actor, target, waktu, dan hasil secara aman bila audit trail diperlukan.

### Validasi Input

- Validasi semua input tidak tepercaya di server, termasuk body, form, query string, route param, cookie yang dibaca, header tertentu, webhook, dan data third-party.
- Utamakan allowlist untuk enum, sort field, filter field, redirect path, file type, dan parameter yang memiliki pilihan terbatas.
- Terapkan validasi sintaks dan semantik, misalnya tanggal valid serta `start_date <= end_date`.
- Batasi panjang string, ukuran array, angka minimum/maksimum, dan kedalaman object untuk mencegah input berlebihan.
- Normalisasi input hanya jika aturan normalisasi jelas dan tidak mengubah arti data tanpa disadari.
- Jangan membangun SQL mentah dengan interpolasi string dari input user.

### XSS dan Content Injection

- Hindari `dangerouslySetInnerHTML`.
- Bila HTML dari user/third-party harus dirender, sanitasi menggunakan library yang memang dirancang untuk sanitasi HTML dan gunakan allowlist tag/attribute.
- Jangan memasukkan input user langsung ke script, style, HTML attribute berbahaya, atau URL tanpa encoding/validasi sesuai konteks.
- Tinjau semua renderer Markdown/HTML agar tidak mengizinkan script atau URL berbahaya.
- Gunakan Content Security Policy sebagai lapisan pertahanan tambahan, bukan sebagai pengganti sanitasi dan output encoding.

### CSRF

- Mutation yang menggunakan cookie/session harus mempertimbangkan risiko CSRF.
- Gunakan `SameSite` cookie yang sesuai, verifikasi origin/host pada endpoint sensitif bila diperlukan, dan gunakan mekanisme anti-CSRF untuk flow yang membutuhkannya.
- Jangan membuat mutation penting melalui request `GET`.

### SSRF dan External URL

- Jangan melakukan fetch server-side ke URL arbitrer dari user tanpa pembatasan.
- Untuk fitur import URL/webhook callback/image proxy, gunakan allowlist host/protocol bila memungkinkan.
- Tolak protocol non-HTTP(S) yang tidak diperlukan.
- Blok akses ke localhost, metadata service, dan private network apabila endpoint memang menerima URL eksternal dari user.
- Terapkan timeout dan batas response size pada request ke third-party.

### File Upload

- Batasi ukuran file sebelum diproses.
- Gunakan allowlist extension/MIME yang benar-benar dibutuhkan.
- Jangan percaya nama file asli sebagai path penyimpanan.
- Gunakan identifier random/UUID untuk object storage bila relevan.
- Scan file untuk malware apabila jenis aplikasi dan tingkat risiko membutuhkannya.
- Gambar/file user yang ditampilkan kembali harus menggunakan content type dan header yang aman.
- Setelah file berhasil di upload ke supabase storage, link file tersebut wajib di set di database yang sesuai. Jika gagal mengupload file ke database, maka hapus file tersebut dari supabase storage agar tidak terjadi penumpukan file sampah pada storage.

### Security Headers

- Konfigurasikan security headers melalui `next.config.ts`, proxy, atau layer deployment sesuai kebutuhan aplikasi.
- Terapkan Content Security Policy (CSP) yang membatasi sumber script, style, image, font, connect, frame, dan resource lain sesuai kebutuhan nyata.
- Hindari `unsafe-eval` pada production. Minimalkan `unsafe-inline`; gunakan nonce/hash ketika strict CSP diperlukan.
- Gunakan `frame-ancestors` pada CSP untuk mencegah clickjacking; `X-Frame-Options` dapat digunakan sebagai fallback sesuai kebutuhan kompatibilitas.
- Set `X-Content-Type-Options: nosniff`.
- Set `Referrer-Policy` yang sesuai, misalnya kebijakan yang tidak membocorkan full URL lintas origin.
- Batasi browser capability yang tidak digunakan melalui `Permissions-Policy`.
- Aktifkan HSTS hanya pada production HTTPS dan setelah memastikan seluruh domain/subdomain yang dicakup memang siap HTTPS.
- Jangan menyalin konfigurasi security header secara buta; sesuaikan dengan third-party script, analytics, map, Supabase, image host, dan kebutuhan aplikasi.

### CORS

- Jangan menggunakan `Access-Control-Allow-Origin: *` pada endpoint private/authenticated kecuali memang aman dan disengaja.
- Gunakan allowlist origin untuk API yang perlu diakses cross-origin.
- Batasi method dan header yang diizinkan.
- Jangan mengaktifkan credentialed CORS dengan origin wildcard.

### Rate Limiting dan Abuse Prevention

- Terapkan rate limit berdasarkan kombinasi yang sesuai seperti user id, API key, IP, route, atau tenant.
- Jangan mengandalkan IP saja untuk semua kasus karena NAT/proxy dapat membuat banyak user berbagi IP.
- Endpoint mahal harus memiliki batas payload, pagination, timeout, dan rate limit.
- Gunakan backoff/retry yang terkontrol saat memanggil third-party agar tidak menimbulkan retry storm.

### Error Handling dan Information Disclosure

- Pesan error ke user harus jelas tetapi tidak membocorkan detail internal.
- Log internal boleh lebih detail, tetapi tetap harus menghapus/redact secret dan PII yang tidak diperlukan.
- Jangan mengembalikan stack trace production kepada client.
- Bedakan error validasi, unauthorized (`401`), forbidden (`403`), not found (`404`), conflict (`409`), rate limit (`429`), dan server error (`5xx`) secara tepat pada API.
- Jangan membocorkan apakah email/account tertentu terdaftar pada flow sensitif jika hal itu memudahkan user enumeration.

### Dependency dan Supply Chain

- Commit lockfile dan gunakan instalasi dependency yang deterministic pada CI.
- Review dependency baru: reputasi package, maintenance, permission/behavior, bundle impact, dan necessity.
- Update dependency secara berkala, terutama patch keamanan.
- Tinjau advisory keamanan dependency pada CI atau proses maintenance.
- Jangan menjalankan script package yang tidak dipercaya tanpa memahami dampaknya.
- Jangan menyalin kode dari internet/AI ke project tanpa review keamanan dan lisensi yang sesuai.

## Performa dan Skalabilitas

- Antisipasi peningkatan jumlah pengunjung dan volume data sejak tahap perancangan.
- Ukur sebelum melakukan optimasi kompleks.
- Hindari mengirim data yang tidak digunakan ke browser.
- Gunakan pagination/infinite query untuk list besar.
- Gunakan index database untuk query yang benar-benar sering digunakan dan terukur lambat.
- Hindari N+1 query pada server dan database.
- Gunakan caching/revalidation untuk data yang tidak harus selalu real-time.
- Jangan cache response yang berisi data private lintas user secara global.
- Pastikan cache key mempertimbangkan user/tenant/parameter apabila cache berisi data scoped.
- Gunakan dynamic import/lazy loading untuk library client yang berat dan tidak langsung dibutuhkan.
- Lazy-load chart, map, editor, atau modul besar jika berada di bawah fold atau hanya muncul pada kondisi tertentu.
- Hindari hydration dan re-render berlebihan.
- Gunakan memoization hanya ketika ada kebutuhan yang terukur; jangan menambahkan `useMemo`/`useCallback` ke semua fungsi secara otomatis.
- Gunakan CDN/object storage untuk asset statis/file besar.
- Batasi ukuran upload dan download.
- Gunakan queue/background job untuk pekerjaan berat yang tidak harus selesai di request utama, apabila infrastruktur project memang mendukungnya.
- Tetapkan batas concurrency pada task yang memanggil layanan eksternal dalam jumlah besar.

## SEO

- Gunakan Metadata API Next.js untuk metadata statis maupun dinamis.
- Gunakan title dan meta description yang unik untuk setiap halaman.
- Sediakan Open Graph (OG) image yang sesuai.
- Sediakan sitemap yang hanya memuat URL canonical dan boleh diindeks.
- Konfigurasikan `robots.txt`.
- Gunakan canonical URL bila diperlukan.
- Tambahkan teks alternatif (`alt`) pada gambar.
- Gunakan internal link yang deskriptif.
- Pastikan tampilan responsif pada perangkat mobile.
- Audit Core Web Vitals.
- Integrasikan situs dengan Google Search Console.
- Periksa penggunaan `index` dan `noindex` pada setiap halaman.
- Pastikan hanya ada satu `h1` utama yang logis per halaman konten, kecuali struktur semantik memiliki alasan lain yang valid.
- Gunakan structured data/JSON-LD hanya ketika sesuai jenis konten dan datanya benar.
- Pastikan halaman private, auth, admin, preview, atau data sensitif tidak terindeks mesin pencari.
- Hindari duplicate content dari kombinasi query parameter/filter yang tidak perlu diindeks.
- Pastikan status `404`, redirect, canonical, dan metadata tidak menghasilkan soft-404 atau loop redirect.
- Hindari teks internal link generik yang berulang seperti "klik di sini".
- Pastikan konten utama dapat dirender dan dipahami tanpa bergantung pada JavaScript client yang tidak perlu.
- Optimalkan Largest Contentful Paint, Interaction to Next Paint, dan Cumulative Layout Shift.

## Caching dan Revalidation

- Tentukan secara eksplisit apakah data bersifat static, cacheable, user-specific, atau real-time.
- Jangan cache data user-specific menggunakan cache shared/global tanpa key dan scope yang benar.
- Setelah mutation, lakukan revalidation/invalidation hanya pada resource yang terdampak.
- Hindari invalidasi terlalu luas yang membuat seluruh aplikasi kehilangan manfaat cache.
- Dokumentasikan strategi cache untuk halaman/dashboard dengan traffic tinggi atau data mahal.
- Jangan mengandalkan cache sebagai authorization layer.

## Logging, Monitoring, dan Audit

- Gunakan structured logging untuk event server penting.
- Log harus memiliki konteks yang cukup seperti request id/correlation id, route/action, status, durasi, dan actor id non-sensitif bila relevan.
- Jangan log password, access token, refresh token, cookie session mentah, service role key, API secret, atau data kartu pembayaran.
- Redact PII yang tidak diperlukan.
- Tangkap exception production menggunakan monitoring/error tracking apabila tersedia.
- Bedakan expected error (validation/not-found) dan unexpected error agar alert tidak penuh noise.
- Monitor error rate, latency, database query lambat, rate limit, auth failure abnormal, dan resource usage.
- Untuk aksi admin/kritis, pertimbangkan audit log append-only yang mencatat actor, action, target, timestamp, dan metadata aman.

## Testing

- Setiap perubahan logic penting harus memiliki pengujian yang proporsional dengan risikonya.
- Prioritaskan unit test untuk utility/business rule, integration test untuk data/auth/API, dan end-to-end test untuk user flow kritikal.
- Flow kritikal minimal mencakup login/logout, authorization admin, mutation penting, validation error, dan akses resource antar-user/tenant apabila relevan.
- Test authorization tidak hanya happy path; uji juga unauthenticated, forbidden role, ownership salah, tenant berbeda, dan input manipulatif.
- Test RLS menggunakan role/session yang menyerupai aplikasi nyata.
- Hindari test yang terlalu bergantung pada implementation detail komponen UI.
- Jangan menggunakan data production nyata pada test lokal/CI.
- Seed test data harus deterministik dan tidak mengandung credential nyata.

## Status Antarmuka

- Setiap operasi async yang terlihat user harus memiliki loading state yang masuk akal.
- Setiap list/table/chart harus memiliki empty state.
- Error state harus memberikan langkah yang dapat dilakukan user bila memungkinkan, misalnya retry atau kembali.
- Jangan menggunakan toast sebagai satu-satunya tempat untuk error field form yang perlu diperbaiki pengguna.
- Gunakan toast `sonner` untuk feedback global singkat seperti mutation berhasil/gagal, bukan untuk informasi permanen yang penting.
- Hindari toast bertumpuk berlebihan pada bulk operation.

## Dark Mode dan Tema

- Gunakan provider theme yang sudah dipilih project secara konsisten; hindari dua sistem theme yang saling bertabrakan pada satu subtree.
- Semua komponen baru harus diuji pada light dan dark mode.
- Jangan hardcode warna yang merusak semantic token/theme kecuali diperlukan oleh brand/data visualization.
- Pastikan chart, map overlay, focus state, border, muted text, dan error/success state tetap terbaca pada kedua mode.

## API dan Integrasi Pihak Ketiga

- Bungkus integrasi third-party pada module khusus agar mudah diganti, diuji, dan dimonitor.
- Secret third-party hanya digunakan server-side kecuali provider secara eksplisit menyediakan public client key.
- Validasi response dari third-party sebelum digunakan sebagai data tepercaya.
- Terapkan timeout dan error mapping.
- Retry hanya untuk error yang aman di-retry dan gunakan exponential backoff/jitter bila diperlukan.
- Jangan retry mutation non-idempotent secara otomatis tanpa idempotency strategy.
- Tetapkan batas payload/response dan pagination pada integrasi yang dapat menghasilkan data besar.
- Dokumentasikan quota/rate limit provider yang mempengaruhi fitur utama.

## Struktur Folder dan Modularitas

- Pertahankan struktur folder existing sebagai baseline.
- Jangan membuat folder generic seperti `utils2`, `helpers-new`, `misc`, atau `temp`.
- Kode yang hanya digunakan satu feature sebaiknya berada dekat feature tersebut.
- Kode lintas feature yang stabil dipindahkan ke folder shared seperti `components/common`, `lib`, `hooks`, `types`, atau `validations` sesuai tanggung jawab.
- Hindari circular dependency.
- Jangan mengimpor module server-only dari Client Component.
- Pisahkan constant konfigurasi dari secret environment.
- Gunakan alias import project yang konsisten sesuai `tsconfig.json`.

## Konvensi Penamaan

- Component React: `PascalCase`.
- Hook: diawali `use`.
- Function/variable: `camelCase`.
- Constant global: gunakan gaya yang konsisten; `UPPER_SNAKE_CASE` untuk konstanta benar-benar statis bila sesuai.
- File route Next.js mengikuti konvensi framework seperti `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, dan `route.ts`.
- Nama database menggunakan pola yang konsisten, disarankan `snake_case`.
- Nama migration harus singkat namun mendeskripsikan perubahan.
- Boolean sebaiknya memiliki prefix bermakna seperti `is`, `has`, `can`, atau `should`.

## Git dan Code Review

- Jangan commit `.env.local`, credential, token, dump database sensitif, atau file generated besar yang tidak perlu.
- Commit harus fokus pada perubahan yang berkaitan.
- Jangan mencampur refactor besar dengan bugfix kecil tanpa alasan.
- PR/perubahan besar harus menjelaskan tujuan, dampak database/API, risiko, dan cara pengujian.
- Review perubahan migration, authentication, authorization, payment, upload, dan admin action dengan perhatian ekstra.
- Jangan menonaktifkan lint/typecheck/test hanya untuk membuat CI hijau.

## CI/CD dan Deployment

- Pipeline minimum harus menjalankan install deterministic, lint, typecheck, test yang tersedia, dan build production.
- Deployment production hanya menggunakan environment variable production dari platform deployment, bukan file secret lokal.
- Pisahkan environment development, preview/staging, dan production apabila project sudah membutuhkan workflow tersebut.
- Pastikan migration dijalankan dengan urutan dan prosedur yang aman sebelum kode yang bergantung pada schema baru aktif.
- Hindari deployment yang membutuhkan perubahan schema breaking dalam satu langkah jika dapat dilakukan secara bertahap.
- Gunakan HTTPS di production.
- Pastikan source map/log/monitoring production tidak mengekspos source/secret secara publik.
- Siapkan rollback strategy untuk perubahan aplikasi dan recovery strategy untuk perubahan data yang kritis.

## Checklist Sebelum Selesai

Perubahan dianggap selesai apabila poin yang relevan sudah diperiksa:

- Kebutuhan fitur terpenuhi tanpa menghapus behavior existing yang tidak termasuk scope.
- TypeScript tidak memiliki error baru.
- Lint tidak memiliki error baru.
- Build production berhasil.
- Validasi client dan server sudah sesuai kebutuhan.
- Authentication dan authorization diperiksa pada server.
- RLS/policy database ditinjau bila ada akses tabel baru atau perubahan akses.
- Tidak ada secret yang bocor ke client/log/repository.
- Loading, empty, error, dan success state tersedia bila relevan.
- Tampilan diuji pada mobile dan desktop.
- Light/dark mode diperiksa bila UI berubah.
- Keyboard/focus/label/alt/accessibility dasar diperiksa.
- SEO metadata/indexing diperiksa bila route public berubah.
- Query database memiliki pagination/index yang wajar bila berpotensi besar.
- Tidak ada duplicate fetch atau duplicate state yang tidak perlu.
- Test yang relevan ditambahkan/diperbarui dan lulus.
- Migration baru aman, berurutan, dan tidak mengedit migration production lama.
- Dependency baru benar-benar diperlukan dan telah direview.
- Dokumentasi/env.example diperbarui bila ada konfigurasi baru.

## Aturan Penggunaan AI/Coding Agent

- AI harus membaca struktur dan pola kode existing sebelum membuat implementasi baru.
- AI tidak boleh menghapus requirement, validation, policy, test, atau security control existing hanya untuk menyederhanakan implementasi.
- AI harus memilih library yang sudah ada di `package.json` sebelum mengusulkan dependency baru.
- AI tidak boleh membuat API key, token, password, secret, atau credential palsu yang terlihat seperti credential nyata di source code.
- AI harus menganggap semua input client tidak tepercaya.
- AI harus mempertahankan Server Component sebagai default dan tidak menambahkan `'use client'` tanpa kebutuhan.
- AI harus menggunakan shadcn untuk komponen UI sesuai aturan project.
- AI harus menghindari `any`, `@ts-ignore`, lint disable, dan type assertion yang tidak aman sebagai jalan pintas.
- AI harus memperbarui schema validation, type, test, dan dokumentasi ketika kontrak data berubah.
- AI harus membuat migration baru untuk perubahan database dan tidak memodifikasi migration yang sudah digunakan bersama/production.
- AI harus menjelaskan trade-off apabila perubahan berdampak pada security, data migration, caching, SEO, atau backward compatibility.
- AI tidak boleh menganggap fitur selesai hanya karena UI terlihat benar; flow error, permission, loading, dan data edge case juga harus diperiksa.

## Prioritas Pengambilan Keputusan

Jika terdapat konflik implementasi, gunakan urutan prioritas berikut:

1. Keamanan dan integritas data.
2. Kebenaran business logic.
3. Privasi dan authorization.
4. Reliability dan observability.
5. Accessibility.
6. Performance dan scalability.
7. Maintainability dan kesederhanaan kode.
8. Konsistensi UI/UX.
9. Kecepatan implementasi.
