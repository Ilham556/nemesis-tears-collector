# Supabase Database Setup Guide

## Langkah-langkah Setup:

### 1. Buka Supabase Dashboard
- Kunjungi https://supabase.com dan login dengan akun Anda
- Pilih project: `nemesis-tears-collector` (atau project yang Anda gunakan)

### 2. Buka SQL Editor
- Di sidebar kiri, klik **"SQL Editor"**
- Klik **"New Query"**

### 3. Copy & Paste SQL Script
- Copy semua kode dari file `supabase-setup.sql` 
- Paste ke SQL Editor di Supabase
- Klik **"Run"** atau tekan `Ctrl+Enter`

### 4. Verifikasi Setup
Setelah berhasil, Anda seharusnya melihat:
- ✅ Database: `stats` table dengan kolom `id`, `total_tears`, `updated_at`
- ✅ Database: `tears` table dengan kolom `id`, `user_session_id`, `nemesis_id`, `score`, `created_at`
- ✅ Function: `increment_tears()` 
- ✅ RLS policies sudah enabled untuk anonymous access

### 5. Periksa di Table Editor
Di sidebar, klik **"Table Editor"** dan verifikasi:
- `stats` table ada dan sudah terisi dengan row (id=1, total_tears=0)
- `tears` table ada (meski kosong)

### 6. Jalankan Aplikasi
Kembali ke aplikasi React dan refresh halaman. Error seharusnya hilang!

## Troubleshooting

### Error: "new row violates row-level security policy"
→ Pastikan RLS policies sudah didefinisikan dengan benar (lihat bagian `ROW LEVEL SECURITY` di SQL)

### Error: "Table does not exist"
→ Pastikan SQL query sudah dijalankan tanpa error

### Error: "Function does not exist"
→ Pastikan fungsi `increment_tears()` sudah dibuat dengan benar

---

## File Credentials

Pastikan `.env.local` sudah berisi:
```
VITE_SUPABASE_URL=https://eftbrijzlsjkjqanozbi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
