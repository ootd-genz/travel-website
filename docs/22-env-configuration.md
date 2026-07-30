# Environment & Configuration Requirements

Ini daftar **nama konfigurasi**, bukan credential nyata.

## Supabase

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` server-only.

## App URL

```text
APP_URL=https://your-production-domain.example
```

Dipakai untuk link dashboard pada notifikasi WhatsApp.

## WhatsApp Provider

Nama persis mengikuti provider yang dipilih. Contoh konseptual:

```text
WHATSAPP_PROVIDER=meta_cloud_api
WHATSAPP_API_BASE_URL=
WHATSAPP_GRAPH_API_VERSION=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ADMIN_NUMBER=6282261060675
WHATSAPP_TEMPLATE_NAME=booking_waiting_verification
WHATSAPP_TEMPLATE_LANGUAGE=id
```

Access token tidak boleh `NEXT_PUBLIC_*`.
Versi Graph API harus dipin eksplisit (format `vN.N`) dan diperbarui secara
terkontrol sebelum versi tersebut dihentikan Meta.
Template harus dibuat/disetujui di WhatsApp Manager dengan tujuh parameter body
berurutan: nama customer, paket, kode booking, tanggal keberangkatan, jumlah
traveler, total transfer, dan deep link admin.

## Business Defaults

Dapat disimpan di database settings karena bukan secret:

```text
BANK_NAME=BCA
BANK_ACCOUNT_NUMBER=87654321
BANK_ACCOUNT_HOLDER=[WAJIB DIISI PEMILIK BISNIS]
```

Rekomendasi: bank/nomor/nama rekening dikelola melalui `site_settings` agar admin dapat memperbarui tanpa deploy, tetapi perubahan harus memiliki validasi dan audit sederhana.

## Upload Limits

Contoh nama config:

```text
TRANSFER_PROOF_MAX_BYTES=
TRANSFER_PROOF_ALLOWED_TYPES=
```

Nilai final ditetapkan saat implementation dan dicantumkan di `env.example` bila berasal dari environment.

## Draft Booking

```text
BOOKING_DRAFT_TTL_MINUTES=60
```

## Observability

```text
OBSERVABILITY_SERVICE_NAME=travel-website
OBSERVABILITY_LOG_LEVEL=info
OBSERVABILITY_ERROR_WEBHOOK_URL=
```

Webhook bersifat opsional, wajib berupa HTTPS, dan hanya menerima payload error
yang sudah direduksi/redact. Jika kosong, structured log JSON tetap ditulis ke log
server/platform.

## Security

Secret production disimpan pada secret manager/environment deployment, bukan Git.

Jangan pernah menulis nilai credential nyata ke:

- `env.example`;
- source code;
- docs publik;
- client bundle;
- logs;
- toast/error UI.
