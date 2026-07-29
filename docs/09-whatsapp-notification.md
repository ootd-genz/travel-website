# Integrasi Notifikasi WhatsApp Admin

## Tujuan

Setelah booking berhasil disimpan dengan status `waiting_verification`, sistem mengirim notifikasi operasional otomatis ke:

**6282261060675**

Notifikasi hanya membantu admin merespons lebih cepat. Database/dashboard tetap menjadi sumber kebenaran.

## Trigger

Kirim hanya setelah:

1. form lolos validasi server;
2. bukti transfer tersimpan di storage private;
3. booking tersimpan dengan sukses;
4. status booking `waiting_verification`.

## Template Pesan

```text
Pemesanan baru masuk ✈️

Atas nama: {{customer_name}}
sudah memesan: {{package_name}}
Kode booking: {{booking_code}}
Tanggal keberangkatan: {{departure_date}}
Jumlah traveler: {{traveler_count}}
Total transfer: {{formatted_total}}
Status: Menunggu verifikasi pembayaran

Bukti transfer sudah diunggah.
Mohon konfirmasinya melalui dashboard admin.

Kelola pemesanan:
{{APP_URL}}/admin/bookings/{{booking_id}}
```

Versi kalimat yang mengikuti permintaan utama:

`Atas nama {{customer_name}} sudah memesan {{package_name}}. Mohon konfirmasinya melalui dashboard admin.`

## Link Dashboard

Jangan hardcode domain production di source. Gunakan base URL konfigurasi server:

```text
{{APP_URL}}/admin/bookings/{{booking_id}}
```

Link akan meminta login jika session admin belum aktif.

## Integrasi Provider

Provider versi pertama adalah **Meta WhatsApp Cloud API**. Implementasi tetap
harus memiliki module abstraction seperti konsep berikut:

```text
Booking Domain
    ↓
Notification Service
    ↓
WhatsApp Provider Adapter
```

Dengan demikian provider resmi lain dapat digunakan di masa depan tanpa
mengubah booking domain.

## Secret

- access token/API secret hanya environment server-side;
- jangan prefix `NEXT_PUBLIC_`;
- jangan simpan token di database content settings;
- jangan log token atau raw credential.

## Reliability

Simpan record `notification_deliveries`:

- booking_id;
- channel = whatsapp;
- destination_number;
- template/event type;
- provider_message_id bila ada;
- status: pending/sent/failed;
- attempt_count;
- last_error_code yang sudah disanitasi;
- sent_at;
- created_at.

## Kegagalan WhatsApp

Booking **tetap sukses** bila notifikasi gagal.

Admin dashboard harus menampilkan badge misalnya `Notifikasi WA gagal` dan tombol retry yang aman/idempotent.

Retry hanya untuk error yang layak di-retry, dengan backoff terkontrol. Jangan membuat retry loop tanpa batas.

## Idempotency

Satu event booking submit tidak boleh menghasilkan pesan duplikat akibat double submit. Gunakan key unik, misalnya kombinasi:

`booking_id + event_type(waiting_verification)`

## Privacy

Pesan WhatsApp hanya memuat data minimum yang dibutuhkan admin. Jangan menempelkan signed URL bukti transfer di WhatsApp. Admin membuka bukti melalui dashboard setelah login.
