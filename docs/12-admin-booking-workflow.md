# Workflow Pengelolaan Booking oleh Admin

## Pemesanan Baru

Saat submit customer sukses:

- status menjadi `waiting_verification`;
- booking muncul paling atas;
- dashboard counter bertambah;
- WhatsApp dikirim ke admin;
- record notification delivery dibuat.

## Verifikasi

Admin membuka detail dari dashboard/WhatsApp.

Checklist:

1. Cocokkan nama pemesan.
2. Cocokkan nama rekening pengirim bila tersedia.
3. Cocokkan nominal transfer dengan `calculated_total` snapshot.
4. Periksa bukti transfer.
5. Periksa paket/tanggal/jumlah traveler.
6. Catat masalah bila ada.

## Konfirmasi

Action: `Konfirmasi Pembayaran`

Hasil:

- status `confirmed`;
- `confirmed_at` terisi;
- `confirmed_by` admin actor;
- booking event tercatat;
- action idempotent: klik ulang tidak membuat event ganda yang salah.

## Tolak Bukti

Action: `Tolak Bukti Pembayaran`

Admin wajib memilih/menulis alasan, misalnya:

- nominal tidak sesuai;
- bukti tidak jelas;
- transfer belum ditemukan;
- data perlu diperbaiki.

Status: `payment_rejected`.

Jangan hapus bukti transfer lama; simpan sebagai bagian audit/history sesuai kebijakan retensi.

## Cancel

Action dibatasi pada status yang masuk akal. Admin menulis alasan pembatalan.

## Completed

Setelah layanan perjalanan selesai, admin dapat `Tandai Selesai` agar reporting lebih bersih.

## Status Transition

```text
draft
  ├─→ waiting_verification
  │     ├─→ confirmed ─→ completed
  │     ├─→ payment_rejected
  │     └─→ cancelled
  └─→ expired
```

Aturan transisi harus ditegakkan server-side, bukan hanya disable button.

## Riwayat

Setiap perubahan status mencatat:

- booking_id;
- status sebelum;
- status sesudah;
- actor_type (`system` / `admin`);
- actor_id bila admin;
- alasan/catatan aman;
- timestamp.

## Hapus Booking

Tidak disarankan menyediakan delete permanen di UI v1. Data booking penting untuk audit dan operasional. Gunakan archive/retention policy jika diperlukan di masa depan.
