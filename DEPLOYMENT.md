# AppPatrol Admin - Deployment Guide

## 📋 Overview

| Item | Value |
|------|-------|
| **Framework** | Next.js 16.1.6 |
| **Domain** | https://frontend.k3guard.com |
| **Port** | 3010 |
| **Process Manager** | PM2 |
| **Backend API** | Python FastAPI (Port 8000) |
| **Last Updated** | 2026-02-20 |

---

## 🏗️ Architecture

```
Browser → Nginx (443/80) → Next.js (3010) → Python API (8000) → MySQL
```

### Directory Structure
```
/var/www/apppatrol-admin/
├── src/                    # Source code
│   ├── app/               # Next.js app directory (pages & routes)
│   ├── components/        # Reusable React components
│   ├── contexts/          # React Context (Permissions, etc.)
│   ├── hoc/               # Higher-Order Components (withPermission)
│   └── lib/               # Utilities & API client (apiClient.ts)
├── public/                # Static assets
├── .next/                 # Build output (auto-generated, DO NOT edit)
├── node_modules/          # Dependencies
├── package.json           # Scripts & dependencies
├── next.config.ts         # Next.js configuration
└── .env.local            # Environment variables (DO NOT commit)
```

---

## 🚀 Deployment Steps (Standard Flow)

### 1. Install Dependencies (First time only)
```bash
cd /var/www/apppatrol-admin
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=https://frontend.k3guard.com/api-py
```

### 3. Build for Production

> ⚠️ **PENTING — Baca ini sebelum build!**
>
> Next.js 16 menggunakan **Turbopack** yang membagi proses build menjadi dua fase:
> 1. **Fase 1 — Compile**: Muncul pesan `✓ Compiled successfully` → **BELUM SELESAI**, jangan restart!
> 2. **Fase 2 — Static generation**: Muncul `✓ Generating static pages` → **Ini proses asli build**
>
> Build baru selesai saat muncul **tabel Route (app)** di akhir output.
> Tanda sukses: file `.next/BUILD_ID` terbuat.

```bash
cd /var/www/apppatrol-admin

# Bersihkan build lama
rm -rf .next

# Build (tunggu hingga tabel Route (app) tampil di output)
npm run build

# Verifikasi build berhasil — harus ada file ini:
ls .next/BUILD_ID
# Output: .next/BUILD_ID  ✅ Sukses
# Jika file tidak ada: build belum selesai, ulangi
```

**Contoh output sukses:**
```
✓ Generating static pages (59/59) in 575ms
✓ Finalizing page optimization

Route (app)
┌ ○ /
├ ○ /dashboard
├ ○ /presensi
... (daftar semua route)
└ ○ /utilities/users

EXIT: 0
```

### 4. Fix Permissions (Setelah Build)
```bash
chown -R www-data:www-data /var/www/apppatrol-admin/.next
chmod -R 755 /var/www/apppatrol-admin/.next
```

### 5. Restart PM2
```bash
pm2 restart patrol-frontend

# Verifikasi running:
pm2 logs patrol-frontend --lines 5 --nostream
# Output harus ada: ✓ Ready in Xms
```

---

## 🔄 Update Code (Routine Workflow)

Setiap kali ada perubahan kode frontend:

```bash
cd /var/www/apppatrol-admin

# 1. Build (tunggu sampai tabel Route muncul)
npm run build

# 2. Cek BUILD_ID ada
ls .next/BUILD_ID

# 3. Fix permissions
chown -R www-data:www-data .next && chmod -R 755 .next

# 4. Restart
pm2 restart patrol-frontend

# 5. Verifikasi
pm2 logs patrol-frontend --lines 5 --nostream | grep "Ready"
```

---

## ⚙️ PM2 Management

### Lihat Status
```bash
pm2 list
pm2 describe patrol-frontend
```

### Logs
```bash
pm2 logs patrol-frontend          # Live tail
pm2 logs patrol-frontend --lines 50 --nostream  # Last 50 lines
pm2 logs patrol-frontend --err    # Error logs saja
```

### Restart / Stop
```bash
pm2 restart patrol-frontend
pm2 stop patrol-frontend
pm2 start patrol-frontend
```

### Setup dari Nol (jika PM2 tidak ada)
```bash
cd /var/www/apppatrol-admin
PORT=3010 pm2 start npm --name patrol-frontend -- start
pm2 save
```

---

## 🐛 Troubleshooting

### ❌ Error: `Could not find a production build in the '.next' directory`

**Penyebab:** Build belum selesai — PM2 di-restart saat build masih di fase compile (Turbopack), sebelum static generation selesai.

**Solusi:**
```bash
cd /var/www/apppatrol-admin
rm -rf .next
npm run build
# Tunggu hingga tabel Route (app) muncul dan ada "EXIT: 0"
ls .next/BUILD_ID   # Pastikan file ini ada
chown -R www-data:www-data .next
chmod -R 755 .next
pm2 restart patrol-frontend
```

---

### ❌ Error: `502 Bad Gateway` (dari browser)

**Penyebab:** Next.js tidak running di port 3010.

**Diagnosis:**
```bash
curl -I http://localhost:3010         # Cek Next.js
pm2 list                               # Cek status PM2
tail -30 /var/log/nginx/error.log    # Cek Nginx error
```

**Solusi:**
```bash
pm2 restart patrol-frontend
nginx -t && systemctl reload nginx
```

---

### ❌ Halaman Tidak Update (Browser menampilkan cache lama)

**Solusi:**
1. Hard refresh: `Ctrl + Shift + R`
2. Gunakan incognito mode
3. Verifikasi build: `stat .next/BUILD_ID` → timestamp harus baru

---

### ❌ Build Terlalu Lama / Tidak Selesai

**Build normal memakan waktu 2–5 menit.** Jika lebih dari 10 menit:

```bash
# Cek apakah ada proses build yang hang
ps aux | grep "next build" | grep -v grep

# Kill jika perlu
pkill -f "next build"

# Coba lagi dengan memory lebih
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

### ❌ TypeScript / Compile Error saat Build

```bash
# Cek error spesifik
npm run build 2>&1 | grep -E "Error|error" | head -20

# Cek type errors saja (tanpa build penuh)
npx tsc --noEmit
```

---

### ❌ Port 3010 Already in Use

```bash
lsof -i :3010
kill <PID>
pm2 restart patrol-frontend
```

---

## 📊 Monitoring

```bash
# Real-time monitor semua proses
pm2 monit

# Health check
curl -I https://frontend.k3guard.com

# Test frontend lokal
curl -I http://localhost:3010

# Test backend API
curl -s https://frontend.k3guard.com/api-py/
```

---

## 🆘 Emergency Recovery (Jika semua rusak)

```bash
# 1. Stop PM2
pm2 stop patrol-frontend

# 2. Clean build + reinstall
cd /var/www/apppatrol-admin
rm -rf .next node_modules
npm install

# 3. Rebuild (tunggu sampai selesai!)
npm run build

# Verifikasi
ls .next/BUILD_ID   # Harus ada!

# 4. Fix permissions
chown -R www-data:www-data .next
chmod -R 755 .next

# 5. Restart PM2 (delete + create baru)
pm2 delete patrol-frontend
PORT=3010 pm2 start npm --name patrol-frontend -- start
pm2 save

# 6. Test
curl -I http://localhost:3010         # Harus: 200 OK
curl -I https://frontend.k3guard.com  # Harus: 200 OK
```

---

## 📝 File Penting

| File | Keterangan |
|------|------------|
| `/var/www/apppatrol-admin/.env.local` | Environment variables (API URL, dll) |
| `/var/www/apppatrol-admin/package.json` | Scripts & dependencies |
| `/var/www/apppatrol-admin/next.config.ts` | Konfigurasi Next.js |
| `/etc/nginx/sites-enabled/frontend.k3guard.com` | Konfigurasi Nginx |
| `/root/.pm2/dump.pm2` | PM2 saved processes |
| `/root/.pm2/logs/patrol-frontend-out.log` | Output logs |
| `/root/.pm2/logs/patrol-frontend-error.log` | Error logs |

---

## 🔑 Nginx Configuration (Referensi)

```nginx
server {
    server_name frontend.k3guard.com;

    # Python API proxy
    location /api-py/ {
        rewrite ^/api-py/(.*) /api/$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Next.js frontend
    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
    listen 443 ssl;
    # ... SSL config ...
}
```

Reload Nginx:
```bash
nginx -t && systemctl reload nginx
```

---

## ⚡ Quick Reference Card

```
╔════════════════════════════════════════════╗
║          FRONTEND QUICK COMMANDS           ║
╠════════════════════════════════════════════╣
║ Build:    npm run build                    ║
║           (tunggu tabel Route (app)!)      ║
║ Verify:   ls .next/BUILD_ID               ║
║ Perms:    chown -R www-data .next          ║
║ Restart:  pm2 restart patrol-frontend      ║
║ Logs:     pm2 logs patrol-frontend         ║
║ Check:    curl -I http://localhost:3010    ║
╚════════════════════════════════════════════╝
```
