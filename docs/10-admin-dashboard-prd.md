# PRD Dashboard Admin — Single Admin

## Prinsip

Dashboard dibuat untuk **1 akun admin**, sehingga tidak perlu fitur role management, invite user, team permission, atau user list.

Tujuan desain: cepat dipahami, sedikit klik, tidak padat, dan prioritas utama selalu pemesanan baru.

## Navigasi Sidebar

```text
Dashboard
Pemesanan
Paket Travel
Destinasi
Aktivitas
Trip Types
Blog
Promo
Halaman Home
Pengaturan
Keluar
```

Pada mobile, sidebar berubah menjadi Sheet/Drawer shadcn.

## Dashboard Home

### Summary cards

- Menunggu Verifikasi
- Dikonfirmasi
- Total Pemesanan Bulan Ini
- Paket Aktif

### Prioritas utama

Table `Pemesanan Terbaru` dengan maksimal beberapa row dan CTA `Lihat Semua Pemesanan`.

### Opsional

Chart tren booking hanya bila datanya berguna; jangan menambah chart sekadar dekorasi.

## Pemesanan

Table kolom inti:

- Kode Booking
- Nama Pemesan
- Paket
- Tanggal Berangkat
- Total
- Status
- Waktu Masuk
- Aksi `Lihat`

Filter:

- search kode/nama/WhatsApp;
- status;
- range tanggal;
- paket.

Default sort: booking terbaru.

## Detail Pemesanan

Susunan agar admin tidak bingung:

1. Header: booking code + status + waktu masuk
2. Action bar
3. Ringkasan paket dan total
4. Data pemesan
5. Data perjalanan
6. Informasi transfer
7. Preview bukti transfer private
8. Catatan admin
9. Riwayat status/audit
10. Status notifikasi WhatsApp

### Aksi utama

- `Konfirmasi Pembayaran`
- `Tolak Bukti Pembayaran`
- `Batalkan Pemesanan`
- `Tandai Selesai`

Aksi kritis meminta confirmation dialog dan alasan bila relevan.

## Paket Travel

Table + form create/edit. Admin dapat:

- publish/unpublish;
- atur harga;
- relasi destination/activity/trip type;
- itinerary;
- included/excluded;
- mark Popular/Featured;
- SEO.

## Destination / Activities / Trip Types

CRUD sederhana dengan list → create/edit page. Tampilkan jumlah paket terkait agar admin mengerti dampak perubahan.

## Blog

Status Draft/Published/Archived. Preview sebelum publish bila tersedia.

## Promo

Admin dapat membuat promo, periode, nilai diskon, paket target, dan status aktif.
Promo tidak ditumpuk. Jika beberapa promo valid, server memilih diskon nominal
terbesar dengan tie-breaker deterministik sesuai
`00-phase-0-requirement-lock.md`.

## Halaman Home

Kelola tanpa menduplikasi data:

- Hero
- USP
- section visibility
- urutan item curated
- Popular packages dipilih dari Package
- Featured trips dipilih dari Package
- Popular destinations dipilih dari Destination
- Browse activities dipilih dari Activity
- Blog preview dipilih dari Blog post

## Pengaturan

### Branding

- logo;
- nama brand;
- favicon bila didukung;
- kontak.

### Footer

- alamat;
- email;
- nomor telepon/WhatsApp publik;
- social links;
- copyright.

### Pembayaran

Default awal:

- Bank: BCA
- No. Rekening: **87654321**
- Atas Nama: wajib diisi admin sebelum production

### Notifikasi Internal

- WhatsApp admin default: **6282261060675**

API token/provider secret **tidak diedit dari dashboard**; tetap di environment production.

## UI State

Semua list/form memiliki:

- loading;
- empty state;
- error state;
- success feedback;
- confirmation untuk destructive/sensitive action.

Toast Sonner digunakan sebagai feedback singkat, tetapi validation error tetap dekat field.
