# Kontrak Data Form Pemesanan

## Form yang Diisi Setelah Transfer

### Data pemesan

| Field | Wajib | Validasi minimum |
|---|---:|---|
| Nama lengkap | Ya | 2–100 karakter |
| Nomor WhatsApp | Ya | format nomor valid, normalisasi ke format internasional |
| Email | Ya | email valid |
| Kota domisili | Opsional | max 100 karakter |

### Data perjalanan

| Field | Wajib | Catatan |
|---|---:|---|
| Paket | Ya | dari booking draft, read-only |
| Tanggal keberangkatan | Sesuai paket | harus sesuai opsi yang valid |
| Jumlah traveler | Ya | min/max dari paket |
| Nama peserta | Sesuai kebutuhan | dapat berupa list |
| Catatan khusus | Opsional | max panjang dibatasi |

### Pembayaran

| Field | Wajib | Catatan |
|---|---:|---|
| Bank pengirim | Opsional/Ya sesuai bisnis | text terbatas |
| Nama pemilik rekening pengirim | Ya | membantu verifikasi |
| Nominal transfer | Ya | format angka; dibandingkan dengan total snapshot, bukan dipercaya sebagai harga |
| Waktu transfer | Opsional | tanggal/waktu valid |
| Bukti transfer | Ya | image/PDF sesuai allowlist |

### Consent

- checkbox `Saya memastikan data yang diisi benar.`
- checkbox `Saya memahami pemesanan baru dikonfirmasi setelah admin memverifikasi pembayaran.`
- link ke syarat & ketentuan / kebijakan privasi jika sudah tersedia.

## Data yang Tidak Boleh Diambil dari Client sebagai Sumber Kebenaran

- package price;
- discount final;
- total payable;
- booking status;
- admin confirmation;
- destination/package ownership;
- storage path final;
- notification status.

## Booking Code

Gunakan kode manusiawi terpisah dari primary key, contoh format konseptual:

`TRV-20260729-AB12CD`

Harus unik dan dibuat server-side.

## Draft Token

Gunakan token random berentropi tinggi untuk URL `/booking/[token]`. Simpan hash/token dengan praktik yang sesuai dan berikan expiry.

## Expiry

Draft memiliki masa berlaku **60 menit**. Nilai ini dibaca dari
`BOOKING_DRAFT_TTL_MINUTES` dan tidak ditulis sebagai magic number tersebar.
Harga, promo, serta availability dihitung ulang ketika customer memulai draft
baru setelah expiry.

Jika expired:

`Harga atau ketersediaan paket ini perlu diperbarui. Mulai kembali pemesanan agar kamu mendapatkan informasi terbaru.`

## Error Copy

- Nama kosong: `Masukkan nama lengkap sesuai identitas pemesan.`
- WhatsApp tidak valid: `Masukkan nomor WhatsApp aktif agar kami mudah menghubungimu.`
- File tidak sesuai: `Unggah bukti transfer dalam format yang didukung dan ukuran yang diperbolehkan.`
- Draft expired: `Sesi pemesanan sudah berakhir. Silakan mulai kembali dari halaman paket.`
- Double submit: `Pemesanan ini sudah kami terima. Tidak perlu mengirim ulang.`
