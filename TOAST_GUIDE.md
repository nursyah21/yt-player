# Toast Notification System

Sistem notifikasi modern untuk menggantikan `alert()`, `confirm()`, dan `prompt()` bawaan browser.

## Fitur

- ✅ **Non-blocking** - Tidak mengganggu interaksi pengguna
- ✅ **Modern Design** - Animasi smooth dengan berbagai tipe warna
- ✅ **Auto-dismiss** - Otomatis hilang setelah durasi tertentu
- ✅ **Mobile Responsive** - Tampilan optimal di semua device
- ✅ **Promise-based** - Mudah digunakan dengan async/await

## Cara Penggunaan

### 1. Toast Notification (Pengganti `alert()`)

```javascript
// Success notification
Helper.showToast('Data berhasil disimpan!', 'success');

// Error notification
Helper.showToast('Terjadi kesalahan saat memproses', 'error');

// Warning notification
Helper.showToast('Periksa kembali input Anda', 'warning');

// Info notification
Helper.showToast('Proses sedang berjalan...', 'info');

// Custom title dan durasi
Helper.showToast('Pesan custom', 'success', 5000, 'Judul Custom');

// Tanpa auto-dismiss (duration = 0)
Helper.showToast('Notifikasi permanen', 'info', 0);
```

### 2. Confirm Dialog (Pengganti `confirm()`)

```javascript
// Basic confirm
const confirmed = await Helper.confirm('Apakah Anda yakin?');
if (confirmed) {
    // User clicked "Ya"
    console.log('Confirmed!');
} else {
    // User clicked "Batal" or closed
    console.log('Cancelled');
}

// Custom title
const result = await Helper.confirm(
    'Data akan dihapus permanen', 
    'Hapus Data'
);
```

### 3. Prompt Dialog (Pengganti `prompt()`)

```javascript
// Basic prompt
const name = await Helper.prompt('Masukkan nama Anda');
if (name) {
    console.log('User entered:', name);
} else {
    console.log('User cancelled or entered empty value');
}

// With default value
const email = await Helper.prompt(
    'Masukkan email Anda',
    'user@example.com'
);

// With custom title
const playlistName = await Helper.prompt(
    'Masukkan nama playlist baru',
    '',
    'Buat Playlist'
);
```

## Tipe Toast

| Type | Warna | Icon | Penggunaan |
|------|-------|------|------------|
| `success` | Hijau | ✓ | Operasi berhasil |
| `error` | Merah | ⚠ | Error atau gagal |
| `warning` | Kuning | ⚠ | Peringatan |
| `info` | Biru | ℹ | Informasi umum |

## Parameter

### `showToast(message, type, duration, title)`

- `message` (string, required) - Pesan yang ditampilkan
- `type` (string, optional) - Tipe toast: 'success', 'error', 'warning', 'info' (default: 'info')
- `duration` (number, optional) - Durasi dalam ms sebelum auto-dismiss (default: 3000, 0 = tidak auto-dismiss)
- `title` (string, optional) - Judul custom (default: sesuai tipe)

### `confirm(message, title)`

- `message` (string, required) - Pesan konfirmasi
- `title` (string, optional) - Judul dialog (default: 'Konfirmasi')
- Returns: `Promise<boolean>` - true jika user klik "Ya", false jika "Batal"

### `prompt(message, defaultValue, title)`

- `message` (string, required) - Pesan prompt
- `defaultValue` (string, optional) - Nilai default input (default: '')
- `title` (string, optional) - Judul dialog (default: 'Input')
- Returns: `Promise<string|null>` - nilai input atau null jika dibatalkan

## Contoh Implementasi

### Sebelum (dengan alert/confirm/prompt):

```javascript
// Alert
alert('Data berhasil disimpan');

// Confirm
if (confirm('Hapus data ini?')) {
    deleteData();
}

// Prompt
const name = prompt('Nama playlist:');
if (name) {
    createPlaylist(name);
}
```

### Sesudah (dengan Toast):

```javascript
// Toast
Helper.showToast('Data berhasil disimpan', 'success');

// Confirm
const confirmed = await Helper.confirm('Hapus data ini?', 'Konfirmasi Hapus');
if (confirmed) {
    deleteData();
}

// Prompt
const name = await Helper.prompt('Masukkan nama playlist', '', 'Buat Playlist');
if (name) {
    createPlaylist(name);
}
```

## Styling

Toast menggunakan CSS yang sudah didefinisikan di `static/css/components.css`. Anda dapat menyesuaikan warna, ukuran, dan animasi sesuai kebutuhan.

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)
