# Dokumentasi Modul Laporan Presensi Karyawan

Dokumen ini berisi rangkuman fitur, peningkatan desain, dan logika bisnis yang diterapkan pada modul **Cetak Laporan Presensi** (`/reports/presensi/[id]`) di sistem App Patrol Frontend. Modul ini bertanggung jawab untuk menampilkan, mendata, dan men-generate laporan fisik atau PDF kehadiran bulanan/harian dari seorang karyawan tertentu.

## 1. Peningkatan UI/UX untuk Cetak Laporan (Print / PDF)
Untuk memastikan laporan kehadiran terlihat resmi, minimalis, proporsional, serta menghemat penggunaan tinta pada printer (*ink-efficient*), beberapa aturan CSS Media Print (`@media print`) khusus telah diterapkan:
- **Konversi Font Klasik ("Corporate Look"):** Font asli (*Inter / Plus Jakarta Sans*) secara otomatis dikonversi menjadi huruf bertipe Serif murni/umum yang lebih formal seperti `Arial`, `Helvetica`, atau standar sans-serif bawaan bagi browser saat memasuki menu cetak PDF.
- **Kerapatan dan Ukuran Huruf (Density Layout):** 
  - Keseluruhan ukuran tulisan tabel yang dicetak dikecilkan (*override*) menjadi `8pt` (*font-size: 8pt*) agar tidak menumpuk antar-kolom biarpun data sedang penuh, dengan *padding* yang memadat.
  - Teks yang tadinya dominan **Tebal (Bold)** dan *Monospace* (kaku bak mesin tik) pada kolom waktu ("Masuk", "Pulang", "Terlambat") seluruhnya dikembalikan menjadi bobot reguler (*Normal Font*) saat diprint demi merapikan proporsi lembaran.
- **Transparansi Baris "Status" (Tanpa Kotak Warna):** Badge status tebal berlatar seperti "Hadir", "Izin", atau "Alpha" kini dinetralkan dengan warna dasar putih dan teks reguler berwarna agar tetap rapi, mudah dibaca, serta menekan limitasi kartrid cetak (hemat tinta).
- **Foto Masuk/Pulang yang Bisa Dicetak:** Komponen `<img />` yang sebelumnya tersembunyi (*hidden*) dalam layar cetak layar sekarang otomatis dilampirkan berukuran seragam (`h-8 w-8`) bersisian dengan waktu jadwal absennya.
- **Penyesuaian Footer Tanda Tangan:** Waktu/jam pencetakan (*hour:minute*) dihapus secara keseluruhan pada area keterangan tanda tangan *"Dicetak pada:"* dan kini hanya mencatatkan tanggal murninya (Misal: *28 Februari 2026*), agar terlihat rapi tanpa berkesan berlebihan.

## 2. Peningkatan Logika Panel Statistik (Summary Cards)
Pada bagian atas tabel dan preview cetak, terdapat panel berisi total ketidakhadiran, kehadiran, izin/sakit, dsb.
- **Kompatibilitas Nilai Teks:** Data Status yang datang dari Database/API cukup beragam (bisa disingkat '"a"' atau '"alpha"', '"h"' atau '"hadir"'). Karenanya, skrip pencarian kini memanfaatkan *toLowerCase()* serta pengecekan *mapping array* untuk menangkap setiap kombinasi format string agar jumlah hitungannya akurat dan tidak bocor atau *"0"*.
- **Integrasi Panel "TA" Baru:** Ditambahkan satu kartu parameter kelima bernama **TA (Tidak Absen Pulang)** untuk memantau seberapa sering karyawan gagal melakukan check-out absensi di belakang waktu normal.
- **Terjemahan Status "LIBR":** String `"LIBR"` atau `"LB"` yang diturunkan oleh backend—apabila karyawan sedang diletakkan pada jadwal cuti atau hari libur wajib—kini di-mapping langsung ke visual teks transparan abu-abu lembut bernama *"Libur"* supaya tabel tidak menampilkan sekadar teks kaku sistem.

## 3. Alur Sorting / Pengurutan Rekapitulasi Data
Pengumpulan data (`fetchData`) di akhir siklusnya kini memanfaatkan *JavaScript array sort by Time* (Time Epoch Date Chronological Sorting).
- **Hasil:** Susunan matriks data kehadiran akan diputar agar 100% dipaksa terurut alami berdasarkan **Tanggal Terlama hingga Terbaru** (Ascending / *dari 1 awal bulan berujung di tanggal 31*), bukan terbalik dari hari ini ke masa lalu. 

***
*Dokumentasi ini ditulis sebagai referensi berkelanjutan mengenai integrasi cetak laporan kehadiran yang baru secara sistematis dan selaras .*
