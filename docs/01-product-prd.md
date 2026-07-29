# PRD Utama — Website Travel

## 1. Ringkasan Produk

Website travel ini berfungsi sebagai katalog perjalanan sekaligus sistem pemesanan manual-transfer. Pengunjung dapat menemukan destinasi, aktivitas, jenis perjalanan, artikel, dan paket travel; kemudian melakukan pemesanan dengan transfer ke rekening BCA dan mengunggah bukti transfer. Satu admin mengelola seluruh konten dan pemesanan dari dashboard.

## 2. Sasaran

### Sasaran pengunjung

- cepat memahami apa yang dijual;
- mudah menemukan paket yang sesuai;
- mengetahui harga, benefit, itinerary, dan syarat sebelum memesan;
- menjalani proses pembayaran yang jelas dan meyakinkan;
- mendapat konfirmasi bahwa data pemesanan sudah diterima.

### Sasaran admin

- satu akun dapat mengelola seluruh konten publik;
- pemesanan baru terlihat jelas dan mudah difilter;
- bukti transfer mudah diperiksa;
- status booking dapat diperbarui dengan jejak audit;
- notifikasi WhatsApp mengarahkan langsung ke detail booking yang perlu ditindaklanjuti.

## 3. Target Pengguna

### Pengunjung / calon traveler

Tidak wajib memiliki akun. Fokus pada proses discovery → consideration → booking dengan friction rendah.

### Admin

Satu akun internal. Tidak ada fitur signup, multi-role, invitation, atau manajemen user pada versi awal.

## 4. Scope Versi Pertama

### Publik

- Home
- Blog + detail artikel
- Activities + detail activity
- Destination + detail destination
- Trip Types + detail trip type
- Detail paket travel
- Flow booking + instruksi transfer + form + upload bukti transfer
- Halaman berhasil mengirim pemesanan

### Admin

- Login/logout
- Dashboard ringkas
- Booking management
- Paket travel
- Destination
- Activities
- Trip Types
- Blog
- Deals/Discounts
- Home content/USP
- Branding/footer/business settings

## 5. Di Luar Scope Awal

- akun customer;
- pembayaran gateway otomatis;
- kartu kredit;
- refund otomatis;
- multi-admin / RBAC kompleks;
- marketplace vendor;
- live chat agent;
- aplikasi mobile native.

## 6. Sumber Kebenaran Data

- Konten dan booking: Supabase database.
- Bukti transfer: Supabase Storage private bucket.
- Auth admin: Supabase Auth.
- WhatsApp: integrasi server-side ke provider WhatsApp yang dipilih.
- Harga booking: snapshot server-side pada saat booking draft dibuat.

## 7. Prinsip Konversi

Setiap halaman discovery harus membawa pengunjung semakin dekat ke paket:

```text
Inspirasi → Kategori → Paket → Detail Paket → Pesan → Transfer → Form → Verifikasi Admin
```

CTA utama konsisten:

- `Lihat Paket`
- `Jelajahi Destinasi`
- `Temukan Aktivitas`
- `Pesan Sekarang`
- `Lanjut ke Pembayaran`
- `Kirim Bukti & Pemesanan`

## 8. Indikator Keberhasilan

- rasio pengunjung detail paket → klik Pesan Sekarang;
- rasio booking draft → form berhasil dikirim;
- jumlah booking menunggu verifikasi;
- waktu respons admin terhadap booking baru;
- error rate upload dan form;
- persentase notifikasi WhatsApp berhasil;
- Core Web Vitals dan error production.
- pada form booking, user wajib mengisi nomor whatsapp aktif untuk dihubungi oleh admin.


## 9. Aturan Bisnis Inti

1. Harga yang tampil di tahap transfer harus berasal dari server.
2. Snapshot harga tidak berubah walaupun admin mengubah harga paket setelah draft booking dibuat, kecuali draft kedaluwarsa dan pengunjung memulai ulang.
3. Pengunjung wajib transfer ke:
   - Bank: **BCA**
   - Nomor rekening: **87654321**
   - Nama pemilik rekening: Muhammad Fulan
4. Bukti transfer wajib sebelum pemesanan masuk status `waiting_verification`.
5. Submit valid membuat booking terlihat pada dashboard.
6. Setelah penyimpanan booking sukses, sistem mencoba mengirim notifikasi WhatsApp ke **6282261060675**.
7. Kegagalan WhatsApp tidak boleh menghapus atau menggagalkan booking yang sudah tersimpan.
8. Admin memverifikasi pembayaran secara manual.
