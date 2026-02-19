# Master Karyawan & User Management Feature
**Date Updated**: 2026-02-19
**Status**: Implemented

## 1. Overview
Fitur Master Karyawan digunakan untuk mengelola data data karyawan, termasuk profil, dokumen, jadwal kerja, dan akun pengguna (User Login). Fitur ini telah diselaraskan dengan logika sistem lama (Laravel) untuk memastikan konsistensi data dan pengalaman pengguna.

## 2. Tambah Karyawan (Create Employee)
Proses penambahan karyawan baru dilakukan melalui form wizard (`KaryawanForm.tsx`).

### Logika Password (Login Android)
- **Input Password**: Telah dihapus dari Form UI.
- **Default Password**: Secara otomatis diatur menggunakan **NIK** karyawan tersebut.
- **Hashing**: Password disimpan dalam bentuk Hashed (Bcrypt) di database.
- **Tujuan**: Password ini digunakan untuk login ke Aplikasi Mobile Android (Patrol App).

### Data Wajib
- NIK (Nomor Induk Karyawan)
- Nama Lengkap
- Lokasi Penempatan (Cabang, Departemen, Jabatan)
- Status Karyawan & Tanggal Masuk

### Validasi & Input Dinamis (Berdasarkan Departemen)
Formulir secara otomatis menyesuaikan field yang ditampilkan berdasarkan pilihan **Departemen** (`kode_dept`):

1. **Unit Driver (UDV)**
   - **Nomor SIM**: Wajib diisi (Required).
   - **Foto SIM**: Muncul di tab File & Dokumen.

2. **Unit K3L & Keamanan (UK3 - Security)**
   - **Nomor Kartu Anggota (KTA)**: Wajib diisi (Required).
   - **Masa Aktif KTA**: Muncul dan perlu diisi.
   - **Foto KTA**: Muncul di tab File & Dokumen.

3. **Departemen Lain (UCS, FIN, HRD, dll)**
   - Field Nomor SIM, KTA, dan upload file terkait **DISEMBUNYIKAN**.
   - Pengguna hanya perlu mengisi data standar.

**Validasi**: Sistem akan mencegah penyimpanan jika data wajib khas departemen (misal SIM untuk Driver) kosong.

## 3. Manajemen Akun Pengguna (User Management)
Fitur ini digunakan untuk membuat atau menghapus akun login Web Dashboard (dan akses sistem lainnya yang memerlukan entry di tabel `users`).

### Indikator Status Akun
Pada tabel daftar karyawan, kolom **Aksi** memiliki indikator ikon dinamis:
- <span style="color:red">🔴 **Icon User Plus (Merah)**</span>: Menandakan karyawan **BELUM** memiliki akun pengguna.
- <span style="color:green">🟢 **Icon User Centang (Hijau)**</span>: Menandakan karyawan **SUDAH** memiliki akun pengguna aktif.

### Fungsi Tombol (Action)
1. **Buat Akun (Create User)**
   - Klik ikon <span style="color:red">Merah</span>.
   - Sistem akan membuat akun baru di tabel `users` dan menghubungkannya via `users_karyawan`.
   - **Username**: NIK
   - **Email**: `[NIK]@k3guard.com` (Format: NIK tanpa titik)
   - **Password Default**: **NIK** (Hashed)
   - **Role**: Default role (sesuai implementasi backend).

2. **Hapus Akun (Delete User)**
   - Klik ikon <span style="color:green">Hijau</span>.
   - Sistem akan menghapus data di tabel `users` dan `users_karyawan`.
   - Karyawan tidak akan bisa login ke Web Dashboard lagi. Data profil karyawan tetap aman.

## 4. Implementasi Teknis (Backend Python)

### Endpoint API
- `POST /api/master/karyawan`: Membuat data karyawan baru (Password Android = NIK).
- `POST /api/master/karyawan/{nik}/create-user`: Membuat akun User Login (Password Web = NIK).
- `DELETE /api/master/karyawan/{nik}/delete-user`: Menghapus akun User Login.
- `GET /api/master/karyawan`: Mengambil list karyawan beserta status `id_user` (via join `users_karyawan`).

### Struktur Database Relasi
- **Karyawan**: Tabel utama data profil (`karyawan`). Tidak memiliki kolom `id_user`.
- **Users**: Tabel akun login (`users`).
- **UserKaryawan**: Tabel penghubung (`users_karyawan`).
  - `nik` -> FK ke `karyawan`
  - `id_user` -> FK ke `users`

## 5. Notes
- Perubahan password default menjadi NIK diterapkan untuk memudahkan onboarding user baru.
- Pastikan NIK yang diinput unik dan valid.
