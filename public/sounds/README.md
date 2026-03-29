# Cry Sound Assets

## 📁 Lokasi File Suara

**Path**: `public/sounds/`

**Nama File**: `cry.mp3` (atau gunakan format lain yang didukung browser)

## 🎵 Spesifikasi File Audio

Untuk file audio cry, Anda dapat menggunakan salah satu format berikut yang didukung React/Browser:

| Format | Extension | Browser Support | Catatan |
|--------|-----------|-----------------|---------|
| MP3    | `.mp3`    | Excellent       | **Rekomendasi** - Kompatibel luas |
| WAV    | `.wav`    | Good            | Ukuran file lebih besar |
| OGG    | `.ogg`    | Good            | Format terbuka, ukuran file sedang |
| M4A    | `.m4a`    | Good            | Format Apple, kompatibel luas |
| WEBM   | `.webm`   | Good            | Format modern, ukuran file kecil |

## 📝 Petunjuk Penempatan File

1. **Buat file audio** dengan nama `cry.mp3` (atau pilih format lain dari tabel di atas)
2. **Letakkan file** di folder `public/sounds/`

Struktur folder seharusnya terlihat seperti ini:
```
nemesis-tears-collector/
├── public/
│   └── sounds/
│       └── cry.mp3  ← File suara diletakkan di sini
├── src/
├── index.html
├── package.json
└── ...
```

## 🔊 Cara Kerja

- **Lokasi suara**: `public/sounds/cry.mp3`
- **Dipicu ketika**: User mengklik wajah nemesis di halaman "Make them cry"
- **Fungsi**: `handleFaceClick()` - Memutar suara menangis otomatis setiap kali wajah diklik
- **Referensi dalam kode**: [App.tsx](../../src/App.tsx#L9)

## 💡 Tips Penggunaan

### Menggunakan Suara Premium
- Cari file audio di platform seperti Freesound.org, Pixabay, atau Pexels
- Pastikan lisensi memungkinkan penggunaan komersial

### Menggunakan Format Berbeda
Jika ingin menggunakan format selain MP3, ubah path di [App.tsx](../../src/App.tsx#L9):

```typescript
// Dari:
<audio ref={cryAudioRef} src="/sounds/cry.mp3" />

// Menjadi (contoh untuk WAV):
<audio ref={cryAudioRef} src="/sounds/cry.wav" />
```

## ⚙️ Cross-Browser Fallback (Opsional)

Untuk support browser yang lebih luas, Anda bisa menambahkan multiple formats:

```typescript
// Di dalam komponen audio element:
<audio ref={cryAudioRef}>
  <source src="/sounds/cry.mp3" type="audio/mpeg" />
  <source src="/sounds/cry.ogg" type="audio/ogg" />
  Your browser does not support the audio element.
</audio>
```

## 🧪 Testing

Setelah menempatkan file suara:

1. Jalankan dev server: `pnpm dev`
2. Buka aplikasi di browser
3. Pilih nemesis
4. Di halaman "Make them cry", **klik wajah nemesis**
5. Suara menangis seharusnya diputar

Jika tidak ada suara yang terdengar:
- Periksa console browser (F12) untuk error messages
- Pastikan file `cry.mp3` berada di lokasi yang benar
- Verifikasi file audio tidak corrupt
- Cek volume browser/sistem tidak di-mute
