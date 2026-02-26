# 📘 AppPatrol Admin Frontend - Official Developer Documentation

**Path:** `/var/www/apppatrol-admin`
**Framework:** Next.js 14/15 (App Router) + TypeScript + TailwindCSS
**Last Updated:** February 2026

Dokumen ini adalah panduan lengkap *(Single Source of Truth)* untuk melakukan pengembangan Web Admin AppPatrol. Panduan ini mencakup daftar lengkap halaman (Routing), tata cara manajemen _Role_ & _Permission_, serta Standar Operasional Prosedur (SOP) cara **Build & Restart** aplikasi secara bersih _(Clean Build)_ untuk mencegah dan mengobati error cache.

---

## 🗺️ 1. Peta Halaman Routing (Pages Directory App Router)

Next.js App Router mendaftarkan routing berdasarkan folder di dalam direktori `src/app/`. Berikut ini adalah daftar halaman dan modul komprehensif yang telah diimplementasikan:

### 🏠 Main & Dashboard
- `/` - Halaman Login (`Login.module.css`).
- `/dashboard` - Dashboard Utama (Statistik & Overview).
- `/profile` - Halaman Profil user yang sedang login.

### 🗃️ Master Data (`/master/*`)
Menangani entri dasar aplikasi yang diperlukan sebelum masuk tahap transaksi.
- `/master/cabang` - Data Cabang Perusahaan.
- `/master/departemen` - Data Departemen.
- `/master/jabatan` - Level / Posisi Jabatan.
- `/master/karyawan` - Master Profil Karyawan (Input NIK, Enroll Wajah, dsb).
- `/master/jamkerja` - Master Jam Kerja standar.
- `/master/jadwal` - Pengaturan Jadwal Shift.
- `/master/cuti` - Tipe-tipe Plafon Cuti.
- `/master/patrolpoint` - Titik Checkpoint Patroli Security (QR/NFC).
- `/master/dept-task-point` - Titik Tugas per departemen spesifik.
- `/master/walkiechannel` - Grup Channel untuk Push-To-Talk Server.

### 🛡️ Operasional Security & Lapangan (`/security/*`)
- `/security/patrol` - Log/Giat Laporan Patroli security.
- `/security/tracking` & `/security/map-tracking` - Live Map Tracking GPS Security aktif.
- `/security/safety` - Laporan Safety Briefing harian.
- `/security/barang` - Pencatatan Keluar Masuk Barang.
- `/security/tamu` - Buku Tamu Digital (Visitor Log).
- `/security/surat` - Register Keluar Masuk Surat.
- `/security/teams` - Manajemen Regu Jaga Keamanan.
- `/security/turlalin` - Pengaturan lalu-lintas kawasan.
- `/security/violations` - Daftar pelanggaran disiplin (misal: face liveness failed, out of location).

### 🚛 Operasional Driver (`/driver/*`)
- `/driver/vehicle` - Master Kendaraan Operasional.
- `/driver/p2h` - Serah terima & Pengecekan Harian Kendaraan (P2H).
- `/driver/tasks` - Penugasan Driver (Surat Jalan).

### 🧹 Operasional Cleaning Service (`/cleaning/*`)
- `/cleaning/tasks` - Titik pengecekan kebersihan / plot area.

### ⏱️ Kehadiran & Perizinan
- `/presensi` - Data absensi harian (Log Masuk / Pulang).
- `/lembur` - Form & approval lembur (Overtime).
- Pendataan Izin:
  - `/izin` (Dashboard / Riwayat umum izin)
  - `/izin-cuti`, `/izin-dinas`, `/izin-sakit`
  - `/pengajuan-izin` (Form Wizard Pengajuan)

### 💰 Payroll & Gaji (`/payroll/*`)
- `/payroll/gaji-pokok` - Setting gaji basis (Basic Salary).
- `/payroll/jenis-tunjangan` - Master Tipe Tunjangan.
- `/payroll/tunjangan` - Mapping Tunjangan bulanan ke Karyawan.
- `/payroll/bpjs-kesehatan` & `/payroll/bpjs-tenagakerja` - Premi asuransi/BPJS.
- `/payroll/penyesuaian-gaji` - Potongan Kasbon / Adjustments.
- `/payroll/slip-gaji` - Generate & Cetak PDF Slip Gaji Karyawan.

### ⚙️ Utilities & Role Management (`/utilities/*`)
Pengaturan tingkat akar (System Level):
- `/utilities/users` - Mengelola Akun User (Username & Password).
- `/utilities/roles` - Membikin Tipe Level Hak Akses (Superadmin, HRD, Komandan).
- `/utilities/permissions` - Master list fungsi sistem (misal: `karyawan.index`, `karyawan.create`).
- `/utilities/role-permission` - Endpoint Matrix Mapping (Mencentang hak akses apa saja yang dimiliki oleh Role X).
- `/utilities/group-permissions` - Pengelompokan view permission.
- `/utilities/logs` - System Audit Trails.
- `/utilities/security-reports` - Notifikasi abuse dan emergency system.
- `/utilities/chat-management` - Manage Room Obrolan internal.
- `/utilities/multi-device` - Setting policy 1 Akun 1 HP.

### 🛠️ Settings (Pengaturan Umum) (`/settings/*`)
- `/settings/general` - Nama Perusahaan, Logo, dll.
- `/settings/jam-kerja-dept` - Jadwal unik berdasar departemen.
- `/settings/hari-libur` - Kalender Merah / Libur Nasional.
- `/settings/denda` - Aturan pengurangan nominal Gaji base on telat/alfa.
- `/settings/reminder` - Pengaturan notifikasi WA Blast.
- `/settings/privacy` & `/settings/terms` - Kebijakan & S&K.

### 📊 Laporan (Reports) (`/reports/*`)
- `/reports/presensi` - Export Excel Data Presensi Karyawan.
- `/reports/salary` - Export Total Cost Payroll.
- `/reports/performance` - Penilaian Kinerja.

---

## 🔐 2. Sistem Manajemen Role & Permission (Cara Kerjanya)

Aplikasi ini menggunakan konsep **Client-Side Protected Route** yang diautentikasi kembali oleh **FastAPI Backend**.
Semua matrix hak akses dapat diatur di Dashboard via:
**UI Path**: `Utilities > Role & Permission`

### Bagaimana cara kerja kodingannya?
Kita menggunakan **HOC (Higher Order Component)** bernama `withPermission`. HOC ini akan mencegat rendering halaman. Bila User yang login saat ini Roles-nya tidak mencakup "Permission Code" yang diwajibkan di halaman tersebut, sistem akan langsung menendang _(Redirect)_ user ke halaman `/forbidden`.

**Contoh Penerapan di Kodingan Frontend (misal: di file `src/app/master/karyawan/page.tsx`)**:

```typescript
'use client';
import { withPermission } from '@/hoc/withPermission';

function KaryawanPage() {
  return (
    <div>Ini Halaman Master Karyawan</div>
  );
}

// WAJIBKAN AKSES 'karyawan.index'
// Hanya Role yang di-checklist 'karyawan.index' di menu Utilities -> Role yang bisa buka ini.
export default withPermission(KaryawanPage, {
  permissions: ['karyawan.index']
});
```

**SOP Penambahan Fitur/Halaman Baru:**
1. Daftarkan nama Permissions di DB via menu **Utilities > Permissions** (contoh: `menu_baru.index`).
2. Masukkan permission tersebut ke menu **Utilities > Role Permissions**, lalu centang di Role yang berwenang (misal Role HRD).
3. Bungkus halaman React (Frontend) menggunakan `withPermission(NamaPage, { permissions: ['menu_baru.index'] })`.
4. Beri _guard_ (pagar) juga di Sidebar Navigasi agar menunya ikut menghilang jika tidak punya akses.

*Catatan: Jika Role user tersebut adalah "Super Admin", HOC akan otomatis mem-Bypass semua verifikasi dan memberikan akses 100%.*

---

## 🚀 3. SOP Build & Restart (Anti-Error & Zero Corrupted Cache)

### ❓ Kenapa Next.js sering mendadak CSS hilang / Error 500 / Invariant Error?
Next.js secara agresif menyimpan *Cache* ke dalam folder `.next`. Jika terjadi modifikasi, instalasi library `npm`, atau memory leak, direktori `.next` ini bisa "corrupt", mengakibatkan server Nginx mereturn HTTP 500 karena _hash_ file JavaScript di memori berbeda dengan hasil _hash_ di storage lokal.

### ✅ Cara Yang Benar (Hard Reset & Clean Build)
Jika Anda memperbarui kodingan dari Repo / melakukan perubahan, **JANGAN** pernah hanya merestart `pm2`. Ikuti rutinitas (SOP) Hard Reset di bawah ini di dalam server Linux Anda.

Buka terminal SSH dan jalankan:

```bash
# 1. Pindah ke direktori project Next.js
cd /var/www/apppatrol-admin

# 2. HENTIKAN proses node yang sedang berjalan agar tak ada file terkunci
pm2 stop patrol-frontend

# 3. HAPUS cache secara total (Inilah penawar utamanya)
rm -rf .next

# 4. (Opsional, gunakan jika ada perubahan depedencies)
# rm -rf node_modules && npm install

# 5. Bangun ulang aplikasi secara segar ke mode Produksi
npm run build

# PERHATIAN: Tunggu sampai npm run build SELAMAT / MUNCUL MATRIKS TABEL UKURAN FILE.

# 6. WAJIB! Sesuaikan perizinan Nginx File Descriptor agar tidak read-only / error 500
chown -R www-data:www-data .next
chmod -R 755 .next

# 7. Nyalakan dan perbarui Environment secara utuh ke sistem PM2
pm2 start /var/www/ecosystem.config.js --only patrol-frontend --update-env

# 8. Simpan status pm2 agar auto start kalau server Linux reboot mendadak
pm2 save
```

### 🐍 Build & Restart untuk FastAPI (Backend)
Backend Python (FastAPI) **TIDAK PERLU** di-build. Python adalah interpreted language. Namun setiap ada pengubahan `.py`, servis wajib dimatikan lalu direstart agar Cache RAM dikosongkan.

```bash
cd /var/www/appPatrol-python

# Jika ada library pip baru yang ditambahkan di requirement.txt:
# source venv/bin/activate
# pip install -r requirements.txt

# Menghapus cache Bytecode Python lama
find . -type d -name "__pycache__" -exec rm -r {} +

# Restart melalui ecosystem
pm2 restart patrol-backend --update-env
pm2 save
```

---
*Dokumen ini bersifat eksklusif untuk panduan rekayasa antarmuka Admin AppPatrol. Simpan dan patuhi SOP Build agar sistem terus stabil di Tahap Produksi / Production Live.*
