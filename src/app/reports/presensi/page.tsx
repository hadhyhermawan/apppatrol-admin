'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Search, Calendar, MapPin, ArrowLeft, ArrowRight, RefreshCw, Download, Printer, X, Eye } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { withPermission } from '@/hoc/withPermission';
import dynamic from 'next/dynamic';
import SearchableSelect from '@/components/form/SearchableSelect';
import clsx from 'clsx';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />
});

type PresensiReportItem = {
    nik: string;
    nama_karyawan: string;
    nama_dept: string;
    nama_cabang: string;
    tanggal: string;
    kode_jam_kerja: string;
    nama_jam_kerja: string;
    jam_masuk_jadwal: string;
    jam_pulang_jadwal: string;
    jam_in: string;
    jam_out: string;
    status: string;
    keterangan: string | null;
    foto_in: string | null;
    foto_out: string | null;
    lokasi_in: string | null;
    lokasi_out: string | null;
    terlambat: string;
    pulang_cepat: string;
};

type OptionItem = { value: string; label: string };

function LaporanPresensiPage() {
    const [data, setData] = useState<PresensiReportItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    // Default to current month range? Or just today?
    // Let's default to today -> today
    const todayStr = new Date().toISOString().split('T')[0];
    const [dateRange, setDateRange] = useState(`${todayStr} to ${todayStr}`);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterCabang, setFilterCabang] = useState('');

    const [deptOptions, setDeptOptions] = useState<OptionItem[]>([]);
    const [cabangOptions, setCabangOptions] = useState<OptionItem[]>([]);

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [rekapData, setRekapData] = useState<any[]>([]);
    const [rekapDates, setRekapDates] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<string>('list');

    // Determine current month range
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(formatDate(firstDay));
    const [endDate, setEndDate] = useState(formatDate(lastDay));

    // Fetch Options
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [deptRes, cabangRes] = await Promise.all([
                    apiClient.get('/master/departemen/options'),
                    apiClient.get('/master/cabang/options')
                ]);

                if (Array.isArray(deptRes)) {
                    setDeptOptions(deptRes.map((d: any) => ({ value: d.kode_dept, label: d.nama_dept })));
                }

                if (Array.isArray(cabangRes)) {
                    setCabangOptions(cabangRes.map((c: any) => ({ value: c.kode_cabang, label: c.nama_cabang })));
                }
            } catch (e) {
                console.error("Failed load options", e);
            }
        };
        fetchOptions();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Parse Date Range
            let start_date = todayStr;
            let end_date = todayStr;

            if (dateRange) {
                if (dateRange.includes(' to ')) {
                    const parts = dateRange.split(' to ');
                    start_date = parts[0];
                    end_date = parts[1];
                } else {
                    start_date = dateRange;
                    end_date = dateRange;
                }
            }

            let url = `/laporan/presensi?start_date=${start_date}&end_date=${end_date}`;
            if (filterCabang) url += `&kode_cabang=${filterCabang}`;
            if (filterDept) url += `&kode_dept=${filterDept}`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

            if (viewMode === 'list') {
                const response: any = await apiClient.get(url);
                if (response.status) {
                    setData(response.data);
                } else {
                    setData([]);
                }
            } else {
                // Rekap URL would be /laporan/rekap-presensi
                url = `/laporan/rekap-presensi?start_date=${start_date}&end_date=${end_date}`;
                if (filterCabang) url += `&kode_cabang=${filterCabang}`;
                if (filterDept) url += `&kode_dept=${filterDept}`;
                if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

                const response: any = await apiClient.get(url);
                if (response.status) {
                    setRekapData(response.data);
                    setRekapDates(response.dates || []);
                } else {
                    setRekapData([]);
                    setRekapDates([]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch laporan", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // Auto fetch when filters change (debounced for search?)
    // For reports, maybe better to have a "Tampilkan" button to avoid heavy queries while typing?
    // But monitoring uses auto-fetch. Let's use auto-fetch for now, but maybe debounce search.
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [dateRange, filterDept, filterCabang, searchTerm, viewMode]);

    const getStatusBadge = (status: string) => {
        const s = status ? status.toLowerCase() : '';
        let badgeClass = "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400";
        let label = status;

        if (s === 'h' || s === 'hadir') {
            badgeClass = "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400";
            label = "Hadir";
        } else if (s === 'i' || s === 'izin') {
            badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
            label = "Izin";
        } else if (s === 's' || s === 'sakit') {
            badgeClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400";
            label = "Sakit";
        } else if (s === 'a' || s === 'alpha') {
            badgeClass = "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
            label = "Alpha";
        } else if (s === 'c' || s === 'cuti') {
            badgeClass = "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400";
            label = "Cuti";
        }

        return (
            <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-medium", badgeClass)}>
                {label}
            </span>
        );
    };

    const getMapsUrl = (coords: string | null) => {
        if (!coords) return '#';
        return `https://www.google.com/maps?q=${coords}`;
    };

    const getImageUrl = (filename: string | null) => {
        if (!filename) return null;
        // In this case, backend returns logic to determine if full url or not.
        // Assuming backend master.get_full_image_url logic is applied or filename is relative.
        // If relative, prepend API_URL/storage? 
        // Actually the backend `laporan.py` returns `presensi.foto_in`. 
        // `presensi.foto_in` in DB is just filename.
        // We probably need to prepend storage URL if it's not full. 
        // Let's assume generic storage path for now or check how `presensi/page.tsx` did it.
        // `presensi/page.tsx` just used `getImageUrl(item.foto_in) || ""` and `getImageUrl` just returned filename.
        // So `Image` component `src` handles it? Or `next.config.js`?
        // Wait, `presensi/page.tsx` line 350: `src={getImageUrl(item.foto_in) || ""}`. 
        // If it's just filename, Next Image needs domain. 
        // Ah, maybe the API response in `presensi/page.tsx` (Laravel) already gives full URL?
        // In Python `laporan.py` I just return `presensi.foto_in`. 
        // I should probably fix Python backend to return full URL or handle it here.
        // Let's handle it here: `/api/storage/uploads/absensi/${filename}`
        if (filename.startsWith('http')) return filename;
        return `/api/storage/uploads/absensi/${filename}`;
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Laporan Presensi" />

            {previewImage && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="max-h-[90vh] max-w-full rounded-lg shadow-2xl object-contain"
                    />
                    <button
                        className="absolute top-5 right-5 text-white bg-black/50 rounded-full p-2 hover:bg-white/20 transition-colors"
                        onClick={() => setPreviewImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                        Laporan Presensi
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {/* 
                        <button className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                            <Printer className="h-4 w-4" />
                            <span className="hidden sm:inline">Cetak</span>
                        </button>
                        */}
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {/* Search Field */}
                    <div className="flex flex-col">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Pencarian
                        </label>
                        <div className="relative h-[42px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Cari Nama / NIK..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="h-full w-full rounded-lg border-[1.5px] border-stroke bg-transparent pl-10 pr-4 text-sm outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            />
                        </div>
                    </div>

                    {/* Cabang Filter */}
                    <div className="flex flex-col">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Cabang
                        </label>
                        <SearchableSelect
                            options={[{ value: "", label: "Semua Cabang" }, ...cabangOptions]}
                            value={filterCabang}
                            onChange={(val) => setFilterCabang(val)}
                            placeholder="Semua Cabang"
                        />
                    </div>

                    {/* Departemen Filter */}
                    <div className="flex flex-col">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Departemen
                        </label>
                        <SearchableSelect
                            options={[{ value: "", label: "Semua Departemen" }, ...deptOptions]}
                            value={filterDept}
                            onChange={(val) => setFilterDept(val)}
                            placeholder="Semua Departemen"
                        />
                    </div>

                    {/* Dari Tanggal */}
                    <div className="flex flex-col">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Dari Tanggal
                        </label>
                        <div>
                            <DatePicker
                                id="date-start"
                                placeholder="Dari Tanggal"
                                defaultDate={startDate}
                                onChange={(dates: Date[], dateStr: string) => setStartDate(dateStr)}
                            />
                        </div>
                    </div>

                    {/* Sampai Tanggal */}
                    <div className="flex flex-col">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Sampai Tanggal
                        </label>
                        <div>
                            <DatePicker
                                id="date-end"
                                placeholder="Sampai Tanggal"
                                defaultDate={endDate}
                                onChange={(dates: Date[], dateStr: string) => setEndDate(dateStr)}
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setViewMode('list')}
                            className={clsx(
                                "py-2 px-4 text-sm font-medium border-b-2 transition-colors",
                                viewMode === 'list'
                                    ? "border-brand-500 text-brand-500"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            )}
                        >
                            List Presensi
                        </button>
                        <button
                            onClick={() => setViewMode('rekap')}
                            className={clsx(
                                "py-2 px-4 text-sm font-medium border-b-2 transition-colors",
                                viewMode === 'rekap'
                                    ? "border-brand-500 text-brand-500"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            )}
                        >
                            Rekap Matriks
                        </button>
                    </div>
                </div>

                {viewMode === 'list' ? (
                    <div className="max-w-full overflow-x-auto">
                        <table className="w-full table-auto min-w-[1200px]">
                            <thead>
                                <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                    <th className="px-4 py-4 font-medium text-black dark:text-white text-center w-[50px]">No</th>
                                    <th className="px-4 py-4 font-medium text-black dark:text-white w-[120px]">Tanggal</th>
                                    <th className="px-4 py-4 font-medium text-black dark:text-white">Karyawan</th>
                                    <th className="px-4 py-4 font-medium text-black dark:text-white">Jadwal</th>
                                    <th className="px-4 py-4 font-medium text-black dark:text-white">Scan Masuk</th>
                                    <th className="px-4 py-4 font-medium text-black dark:text-white">Scan Pulang</th>
                                    <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                    <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Ket</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Memuat data...</td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td>
                                    </tr>
                                ) : (
                                    data.map((item, idx) => (
                                        <tr key={idx} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/10">
                                            <td className="px-4 py-4 text-center">
                                                <p className="text-black dark:text-white text-sm">{idx + 1}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-black dark:text-white text-sm font-medium">{item.tanggal}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-black dark:text-white text-sm">{item.nama_karyawan}</span>
                                                    <span className="text-xs text-brand-500">{item.nik}</span>
                                                    <span className="text-xs text-gray-500">{item.nama_dept} - {item.nama_cabang}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col text-xs">
                                                    <span className="text-black dark:text-white font-medium">{item.nama_jam_kerja || "-"}</span>
                                                    <span className="text-gray-500">{item.jam_masuk_jadwal} - {item.jam_pulang_jadwal}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-black dark:text-white text-sm font-medium">{item.jam_in || "-"}</span>
                                                    {item.jam_in && (
                                                        <div className="flex gap-2">
                                                            {item.lokasi_in && (
                                                                <a href={getMapsUrl(item.lokasi_in)} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5"><MapPin size={10} /> Loc</a>
                                                            )}
                                                            {item.foto_in && (
                                                                <button onClick={() => setPreviewImage(getImageUrl(item.foto_in))} className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
                                                                    <Eye size={10} className="w-3 h-3" /> Foto
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                    {item.terlambat !== "-" && <span className="text-[10px] text-red-500">Telat: {item.terlambat}</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={clsx("text-sm font-medium", item.jam_out ? "text-black dark:text-white" : "text-gray-400")}>{item.jam_out || "-"}</span>
                                                    {item.jam_out && (
                                                        <div className="flex gap-2">
                                                            {item.lokasi_out && (
                                                                <a href={getMapsUrl(item.lokasi_out)} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5"><MapPin size={10} /> Loc</a>
                                                            )}
                                                            {item.foto_out && (
                                                                <button onClick={() => setPreviewImage(getImageUrl(item.foto_out))} className="text-xs text-blue-500 hover:underline flex items-center gap-0.5">
                                                                    <Eye size={10} className="w-3 h-3" /> Foto
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                    {item.pulang_cepat !== "-" && <span className="text-[10px] text-red-500">P.Cepat: {item.pulang_cepat}</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {getStatusBadge(item.status)}
                                            </td>
                                            <td className="px-4 py-4 text-center text-sm">
                                                {item.keterangan || "-"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="max-w-full overflow-x-auto">
                        <table className="w-full table-auto min-w-[2000px] text-xs">
                            <thead>
                                <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                    <th className="px-2 py-2 font-medium text-black dark:text-white border border-gray-200 dark:border-gray-700 w-[50px] sticky left-0 bg-gray-100 dark:bg-gray-800 z-10">No</th>
                                    <th className="px-2 py-2 font-medium text-black dark:text-white border border-gray-200 dark:border-gray-700 w-[200px] sticky left-[50px] bg-gray-100 dark:bg-gray-800 z-10">Karyawan</th>
                                    {rekapDates.map(d => (
                                        <th key={d} className="px-2 py-2 font-medium text-black dark:text-white border border-gray-200 dark:border-gray-700 text-center w-[120px]">
                                            {d.split('-')[2]}
                                        </th>
                                    ))}
                                    <th className="px-2 py-2 font-medium text-black dark:text-white border border-gray-200 dark:border-gray-700 text-center w-[80px] bg-green-50 dark:bg-green-900/20">Hadir</th>
                                    <th className="px-2 py-2 font-medium text-black dark:text-white border border-gray-200 dark:border-gray-700 text-center w-[80px] bg-blue-50 dark:bg-blue-900/20">Izin</th>
                                    <th className="px-2 py-2 font-medium text-black dark:text-white border border-gray-200 dark:border-gray-700 text-center w-[80px] bg-yellow-50 dark:bg-yellow-900/20">Sakit</th>
                                    <th className="px-2 py-2 font-medium text-black dark:text-white border border-gray-200 dark:border-gray-700 text-center w-[80px] bg-red-50 dark:bg-red-900/20">Alpha</th>
                                    <th className="px-2 py-2 font-medium text-black dark:text-white border border-gray-200 dark:border-gray-700 text-center w-[80px]">Telat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={rekapDates.length + 7} className="px-4 py-8 text-center text-gray-500">Memuat data...</td>
                                    </tr>
                                ) : rekapData.length === 0 ? (
                                    <tr>
                                        <td colSpan={rekapDates.length + 7} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td>
                                    </tr>
                                ) : (
                                    rekapData.map((emp, idx) => (
                                        <tr key={emp.nik} className="hover:bg-gray-50 dark:hover:bg-meta-4/10">
                                            <td className="px-2 py-2 border border-gray-200 dark:border-gray-700 text-center sticky left-0 bg-white dark:bg-boxdark">{idx + 1}</td>
                                            <td className="px-2 py-2 border border-gray-200 dark:border-gray-700 sticky left-[50px] bg-white dark:bg-boxdark">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-black dark:text-white">{emp.nama_karyawan}</span>
                                                    <span className="text-[10px] text-gray-500">{emp.nik}</span>
                                                    <span className="text-[10px] text-gray-500">{emp.nama_dept} - {emp.nama_cabang}</span>
                                                </div>
                                            </td>
                                            {rekapDates.map(d => {
                                                const cell = emp.data_tanggal[d];
                                                let bgClass = "";
                                                let textClass = "text-black dark:text-white";
                                                let content = "-";

                                                if (cell) {
                                                    if (cell.status === 'h') {
                                                        content = "H";
                                                        // Check late? The backend 'status' doesn't explicitly say late unless we check logic.
                                                        // But we can rely on simple color for now.
                                                        bgClass = "bg-green-100 dark:bg-green-900/30";
                                                        textClass = "text-green-700 dark:text-green-400";
                                                    } else if (cell.status === 'i') {
                                                        content = "I";
                                                        bgClass = "bg-blue-100 dark:bg-blue-900/30";
                                                        textClass = "text-blue-700 dark:text-blue-400";
                                                    } else if (cell.status === 's') {
                                                        content = "S";
                                                        bgClass = "bg-yellow-100 dark:bg-yellow-900/30";
                                                        textClass = "text-yellow-700 dark:text-yellow-400";
                                                    } else if (cell.status === 'c') {
                                                        content = "C";
                                                        bgClass = "bg-purple-100 dark:bg-purple-900/30";
                                                        textClass = "text-purple-700 dark:text-purple-400";
                                                    } else if (cell.status === 'a') {
                                                        content = "A";
                                                        bgClass = "bg-red-100 dark:bg-red-900/30";
                                                        textClass = "text-red-700 dark:text-red-400";
                                                    }
                                                }

                                                return (
                                                    <td key={d} className={`px-2 py-2 border border-gray-200 dark:border-gray-700 text-center font-bold ${bgClass} ${textClass}`}>
                                                        {content}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-2 py-2 border border-gray-200 dark:border-gray-700 text-center font-bold">{emp.summary.hadir}</td>
                                            <td className="px-2 py-2 border border-gray-200 dark:border-gray-700 text-center font-bold">{emp.summary.izin}</td>
                                            <td className="px-2 py-2 border border-gray-200 dark:border-gray-700 text-center font-bold">{emp.summary.sakit}</td>
                                            <td className="px-2 py-2 border border-gray-200 dark:border-gray-700 text-center font-bold">{emp.summary.alpha}</td>
                                            <td className="px-2 py-2 border border-gray-200 dark:border-gray-700 text-center font-bold text-red-500">{emp.summary.terlambat}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </MainLayout >
    );
}

export default withPermission(LaporanPresensiPage, {
    permissions: ['presensi.index']
});
