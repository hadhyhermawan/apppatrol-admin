# Panduan Refactor Frontend Responsive (Next.js & TailwindCSS)

Dokumen ini berisi panduan dan contoh kode untuk me-refactor *frontend* Web Admin berbasis TailAdmin agar menjadi **Fully Responsive** (Mobile First) tanpa merusak struktur utama.

## 1. Modular Layout System (`components/layout/DefaultLayout.tsx`)
Layout utama mengatur *Sidebar* agar bergeser (*drawer*) di mobile, dan tetap *fixed* di desktop. *Navbar* tetap di atas (*sticky*).

```tsx
// src/components/layout/DefaultLayout.tsx
"use client";
import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-boxdark-2">
      {/* Sidebar Component */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Content Area flex overflow-hidden agar child bisa auto-scroll */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* Header (Sticky Navbar, fixed z-index) */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Main Content dengan auto padding safe-area */}
        <main>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

## 2. Sidebar Responsive Drawer (`components/layout/Sidebar.tsx`)
Translasi sidebar menggunakan `transform` agar muncul layaknya *Drawer* di layar kecil, dan menetap di lebar layar besar (`lg`).

```tsx
// src/components/layout/Sidebar.tsx
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const sidebar = useRef<any>(null);

  // Auto close trigger for mobile tap outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current) return;
      if (!sidebarOpen || sidebar.current.contains(target)) return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full" // Drawer mechanic Trigger
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <Link href="/">
          <h1 className="text-2xl font-bold text-white">K3Guard Admin</h1>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="block lg:hidden text-white"
        >
          {/* Close Icon (Hanya terlihat di Mobile) */}
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Sidebar Menu Scrollable Area */}
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
         {/* Drop menu rendering map components */}
      </div>
    </aside>
  );
};

export default Sidebar;
```

## 3. Dashboard Grid Responsif (`components/dashboard/StatCardGrid.tsx`)
Memanfaatkan Tailwind Grid breakpoints untuk beradaptasi dengan ukuran device (*Mobile-First Approach*):
- Layar Sedang (Tablet): 2 Kolom (`md:grid-cols-2`)
- Layar Besar (Desktop): 4 Kolom (`xl:grid-cols-4`)

```tsx
// src/components/dashboard/StatCardGrid.tsx
import React from "react";
import StatCard from "@/components/ui/StatCard";

const StatCardGrid = () => {
  return (
    {/* Grid dasar = 1 Kolom (Default Mobile). Membesar seiring layar */}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <StatCard title="Hadir" value="340" rate="+2.5%" />
      <StatCard title="Patroli Aktif" value="12" rate="+10%" />
      <StatCard title="Tamu Hari Ini" value="45" rate="-5%" />
      <StatCard title="Isu Keamanan" value="2" rate="0%" />
    </div>
  );
};

export default StatCardGrid;
```

## 4. Tabel Responsif Kebal Overflow (`components/ui/ResponsiveTable.tsx`)
Bungkus elemen tabel HTML native menggunakan `overflow-x-auto` agar bebas di-*geser* di *Mobile*, memastikan layout dashboard utama tetap terkunci strukturnya.

```tsx
// src/components/ui/ResponsiveTable.tsx
import React from "react";

const ResponsiveTable = ({ data }: { data: any[] }) => {
  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Data Patroli Terbaru
      </h4>

      {/* Sisi Kunci Tabel Responsif: max-w-full & overflow-x-auto */}
      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto min-w-max">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                Karyawan
              </th>
              <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                Waktu
              </th>
              <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                Lokasi
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, key) => (
              <tr key={key}>
                <td className="border-b border-[#eee] px-4 py-5 pl-9 dark:border-strokedark xl:pl-11">
                  <h5 className="font-medium text-black dark:text-white">{item.nama}</h5>
                </td>
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <p className="text-black dark:text-white text-sm md:text-md">{item.waktu}</p>
                </td>
                <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                  <p className="text-black dark:text-white text-sm md:text-md">{item.lokasi}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResponsiveTable;
```

## 5. Layout Aplikasi Modul Chat Admin (`components/responsive/ChatLayout.tsx`)
Digunakan untuk komunikasi mirip *WhatsApp Web*.
- **Mobile (<768px):** Berubah dinamis (Awal masuk ke List Chat, Saat ditekan masuk ke Fullscreen Ruang Obrolan tanpa List di sisi pinggir).
- **Desktop (>768px):** Layar Terbelah (Kiri Tipe List Berbaris, Kanan Ruang Obrolan) via `.md:flex` / `.xl:grid`.

```tsx
// src/components/responsive/ChatLayout.tsx
"use client";
import React, { useState } from "react";

const ChatLayout = () => {
  // Logic pengunci view di hp: false = List Chat View, number = Main Room Chat View
  const [activeChat, setActiveChat] = useState<number | null>(null);

  return (
    <div className="flex h-[calc(100vh-120px)] w-full overflow-hidden rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      
      {/* Kolom Daftar Chat (Kiri) */}
      <div 
        className={`w-full border-r border-stroke dark:border-strokedark md:w-1/3 xl:w-1/4 ${
          activeChat !== null ? 'hidden md:block' : 'block' // Di hidden kalo di hape udah milih chat (supaya full room)
        }`}
      >
        <div className="border-b border-stroke p-4 dark:border-strokedark">
          <input 
            type="text" 
            placeholder="Cari Regu..." 
            className="w-full rounded border-[1.5px] border-stroke px-4 py-2 font-normal focus:border-primary focus:outline-none dark:border-strokedark dark:bg-form-input" 
          />
        </div>
        <div className="h-full overflow-y-auto p-4">
          <div 
            onClick={() => setActiveChat(1)}
            className="cursor-pointer rounded p-3 hover:bg-gray-2 dark:hover:bg-meta-4"
          >
            <h5 className="font-semibold text-black dark:text-white">Regu Alpha (Darurat)</h5>
            <p className="truncate text-sm text-gray-500">Pos gerbang utama aman.</p>
          </div>
        </div>
      </div>

      {/* Jendela Obrolan Utama (Kanan) */}
      <div 
        className={`flex h-full w-full flex-col md:w-2/3 xl:w-3/4 ${
          activeChat === null ? 'hidden md:flex' : 'flex' // Kebalikan logika (Kalo belom milih, HP gak nampilin layar ini)
        }`}
      >
        {/* Header Nama Obrolan */}
        <div className="flex items-center gap-4 border-b border-stroke p-4 dark:border-strokedark">
          {/* Tombol Back Hanya muncul di ukuran HP (<md) */}
          <button 
            className="block text-black dark:text-white md:hidden hover:opacity-70"
            onClick={() => setActiveChat(null)}
          >
            ← Kembali
          </button>
          <div className="flex-1 font-medium text-black dark:text-white text-lg">
            {activeChat ? "Regu Alpha (Darurat)" : "Pilih Obrolan di Samping"}
          </div>
        </div>

        {/* Kolom Pesan Masuk (Auto Scrolling ke Bawah) */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50 dark:bg-boxdark-2">
           {/* Message Bubble Mapping Component Area */}
        </div>

        {/* Text Input Ketikan - Dikunci Menempel di Bawah (Fixed Footer Flex) */}
        <div className="border-t border-stroke p-4 dark:border-strokedark bg-white dark:bg-boxdark">
           <form className="flex w-full items-center gap-2">
             <input 
                type="text" 
                placeholder="Ketik instruksi/pesan..." 
                className="w-full rounded-md border-[1.5px] border-stroke px-4 py-3 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-form-input"
             />
             <button type="submit" className="flex items-center justify-center rounded-md bg-primary p-3 px-6 font-semibold text-white focus:outline-none hover:bg-opacity-90">
               Kirim
             </button>
           </form>
        </div>
      </div>

    </div>
  );
};

export default ChatLayout;
```

## 6. Real-Time UI Walkie-Talkie Panel Responive Rules
Jika mengembangkan GUI alat Komunikasi Walkie:
1. Tombol `PTT (Push To Talk)` berikan ukuran interaksi wajar HP dengan class `min-h-[80px] w-full max-w-[400px] md:min-h-[120px] mx-auto active:scale-95 duration-100 ease-in-out` agar pas disentuh jempol saat patroli.
2. Sembunyikan elemen dekoratif yang lebar (Grafik Sine-wave suara tidak terlalu dibutuhkan di Mobile View) dengan class helper dekorator `hidden md:block`.

## ✅ Prinsip Pokok *Tailwind Mobile-First*
1. **Aturan Dasar (Tanpa Prefix)**: Set atribut untuk mendesain di HP terlebih dahulu (Misal `flex flex-col w-full p-2`).
2. **Layering ke Layar Lebar**: Gunakan prefix secara bertahap (Tablet `md:flex-row md:w-1/2 p-4`, Laptop `lg:p-6`).
3. **Penyakit Lebar Statis**: Jangan ada `width: 300px` di global. Selalu manfaatkan sifat air *Liquid Grid Layout* Tailwind: `w-full max-w-sm`. Ini sangat aman karena lebarnya akan menciut otomatis tanpa merusak desain form ketika menyentuh dimensi layar terkecil HP lama!
