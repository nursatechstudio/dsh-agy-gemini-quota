<div align="center">

# 📊 dsh-agy-gemini-quota

**DeepSeek Harness × Google Antigravity — Real-time Gemini & Claude Quota Monitor**

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node version](https://img.shields.io/badge/node-%3E%3D20-green.svg)](package.json)
[![DSH](https://img.shields.io/badge/DSH-plugin-orange.svg)](https://github.com/nursatechstudio/dsh-agy-gemini-quota)
[![Listed on dsh-plugin.org](https://dsh-plugin.org/badges/listed.svg)](https://dsh-plugin.org/plugins/nursatechstudio/dsh-agy-gemini-quota)
[![GitHub stars](https://img.shields.io/github/stars/nursatechstudio/dsh-agy-gemini-quota?style=social)](https://github.com/nursatechstudio/dsh-agy-gemini-quota)

🌐 **Bahasa**: [English](README.md) · [Bahasa Indonesia](README.id.md)

---

</div>

Plugin DeepSeek Harness untuk memonitor kuota Antigravity Gemini dan Claude secara realtime langsung di submenu Settings `agy-quota`.

## ✨ Fitur

- **Kuota Gemini Realtime**: Menampilkan batas kuota mingguan (Weekly) dan 5 jam (5-Hour rolling) lengkap dengan progress bar, persentase, dan hitung mundur reset.
- **Kuota Claude & 3P**: Melacak kuota model pihak ketiga (Claude Opus/Sonnet/GPT).
- **Berbagai Metode Autentikasi**:
  1. **Deteksi Otomatis IDE**: Membaca kredensial OAuth langsung dari state lokal SQLite Antigravity IDE.
  2. **Login Google**: Satu klik login OAuth langsung dari halaman pengaturan.
  3. **File Lingkungan / .env**: Mendukung `AGY_REFRESH_TOKEN` atau `AGY_ACCESS_TOKEN`.
  4. **Token Manual**: Masukkan refresh token (`1//...`) atau access token (`ya29...`) via modal UI.
- **Submenu Pengaturan**: Terintegrasi langsung di sidebar Pengaturan DSH pada menu `agy-quota`.

## 📦 Instalasi

### 1. Instal via CLI DSH

Dari NPM (disarankan untuk DSH Plugin Hub):
```bash
dsh plugin --profile web add dsh-plugin-agy-quota
```

Dari GitHub:
```bash
dsh plugin --profile web add github:nursatechstudio/dsh-agy-gemini-quota
```

Atau dari direktori lokal (pengembangan):
```bash
dsh plugin --profile web add ./path/to/dsh-agy-gemini-quota
```

### 2. Verifikasi Instalasi

Periksa layer bundle profile:
```bash
dsh --profile web --dump-config
```

### 3. Hapus Plugin

```bash
dsh plugin --profile web remove dsh-plugin-agy-quota
```

## ⚙️ Konfigurasi (Opsional)

Jika dijalankan pada server/headless atau tanpa Antigravity IDE di komputer yang sama:

```bash
cp .env.example .env
```

Atur `AGY_REFRESH_TOKEN` atau `AGY_ACCESS_TOKEN` pada file `.env`:
```env
AGY_REFRESH_TOKEN=1//...
```

*Catatan: Jangan pernah melakukan commit file `.env` atau kredensial rahasia ke Git.*

## 📄 Lisensi

[MIT](LICENSE)
