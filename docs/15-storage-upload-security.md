# Upload Bukti Transfer & Storage Security

## Tujuan

Menerima bukti transfer tanpa mengekspos file customer secara publik.

## Bucket

Gunakan bucket private khusus, misalnya secara konseptual:

`booking-transfer-proofs`

Jangan mencampur dengan gambar konten publik.

## Jenis File

Tetapkan allowlist saat implementasi. Rekomendasi produk:

- JPEG
- PNG
- PDF bila benar-benar dibutuhkan

Ukuran maksimum ditentukan melalui config dan divalidasi sebelum proses mahal.

## Validasi

Server memeriksa:

- ukuran file;
- extension allowlist;
- MIME allowlist;
- signature/magic bytes dasar bila implementasi memungkinkan;
- file tidak kosong;
- jumlah file sesuai batas.

Jangan percaya MIME dari browser saja.

## Nama Object

Jangan menggunakan nama file customer sebagai path mentah.

Pola konsep:

```text
booking-transfer-proofs/{booking_uuid}/{random_uuid}.{safe_ext}
```

## Flow Upload Konsisten

```text
Validate metadata/file
→ upload private object
→ save path in booking
→ if DB save fails, delete uploaded object
```

Ini mengikuti guideline agar file orphan tidak menumpuk.

## Akses Admin

Admin dashboard meminta signed URL server-side dengan expiry singkat setelah `requireAdmin()` berhasil.

Jangan:

- menyimpan signed URL permanen di database;
- mengirim signed URL ke WhatsApp;
- menampilkan storage path raw ke customer.

## Preview

Gunakan preview yang aman. Untuk PDF, hindari renderer berisiko tanpa review. Download dilakukan dengan content disposition/header yang sesuai.

## Retensi

Retensi bukti pembayaran versi pertama adalah **24 bulan setelah booking masuk
status terminal** (`payment_rejected`, `cancelled`, atau `completed`). Bukti milik
booking `waiting_verification` atau `confirmed` tidak boleh dihapus oleh job
retensi. Penghapusan object harus dicatat, sedangkan record booking dan audit
tetap dipertahankan. Pemilik bisnis meninjau kebijakan ini sebelum production
jika memiliki kewajiban akuntansi atau regulasi khusus.
