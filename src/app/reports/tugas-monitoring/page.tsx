'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Search, ArrowLeft, ArrowRight, ClipboardList, MapPin, Download, Filter, Eye, User, X, CheckCircle, AlertTriangle, Check } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { withPermission } from '@/hoc/withPermission';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import SearchableSelect from '@/components/form/SearchableSelect';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />
});

// TYPES for Personal View
type TaskItem = {
    id: number;
    nik: string;
    kode_dept: string;
    tanggal: string;
    jam_tugas: string | null;
    jam_patrol?: string | null;
    status: string;
    kode_jam_kerja: string | null;
    foto_absen: string | null;
    lokasi_absen: string | null;
    completed_at: string | null;
    nama_petugas: string | null;
};

// TYPES for Regu View
type ReguSlot = {
    jam_ke: number;
    rentang: string;
    mulai: string;
    batas: string;
    terpenuhi: boolean;
    jumlah_event: number;
}

type ReguMember = {
    nik: string;
    nama_karyawan: string;
    kode_dept: string;
    sumber_jadwal: string | null;
    sudah_patroli: boolean;
    jumlah_sesi_patroli: number;
    jam_patrol_terakhir: string | null;
}

type ReguGroup = {
    uid: string;
    kode_cabang: string;
    nama_cabang: string;
    kode_jam_kerja: string;
    nama_jam_kerja: string;
    jam_masuk: string | null;
    jam_pulang: string | null;
    lintashari: boolean;
    total_anggota: number;
    sudah_patroli: number;
    belum_patroli: number;
    jumlah_sesi_patroli: number;
    slot_wajib: number;
    slot_terpenuhi: number;
    slot_kurang: number;
    persen_slot: number;
    status_level: string;
    shift_timing_status: string;
    shift_timing_label: string;
    members: ReguMember[];
    hourly_slots: ReguSlot[];
}

type MonitoringSummary = {
    total_regu_shift: number;
    total_anggota: number;
    total_sudah_patroli: number;
    total_belum_patroli: number;
    total_slot_wajib: number;
    total_slot_terpenuhi: number;
    total_slot_kurang: number;
    persen_slot: number;
}

const UNITS = [
    { code: 'UCS', name: 'Unit Cleaning Service', short: 'UCS' },
    { code: 'UDV', name: 'Unit Driver', short: 'UDV' },
    { code: 'UK3', name: 'Unit K3L dan Keamanan', short: 'UK3' },
];

function LaporanTugasPage() {
    const [selectedUnit, setSelectedUnit] = useState('UCS');
    const [viewMode, setViewMode] = useState<'personal' | 'regu'>('personal'); // Default 'personal'

    // Data States
    const [data, setData] = useState<TaskItem[]>([]); // For Personal View
    const [groups, setGroups] = useState<ReguGroup[]>([]); // For Regu View
    const [summary, setSummary] = useState<MonitoringSummary | null>(null); // For Regu View

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateStart, setDateStart] = useState<string>(new Date().toISOString().slice(0, 10)); // Default to today
    const [dateEnd, setDateEnd] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Filters for Regu View
    const [cabangOptions, setCabangOptions] = useState<{ kode_cabang: string; nama_cabang: string }[]>([]);
    const [selectedCabang, setSelectedCabang] = useState('');

    // Pagination State (Personal View)
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const fetchCabang = async () => {
        try {
            const res: any = await apiClient.get('/master/cabang');
            if (Array.isArray(res)) setCabangOptions(res);
        } catch (e) {
            console.error("Failed fetch cabang", e);
        }
    };

    useEffect(() => {
        if (selectedUnit === 'UK3' && viewMode === 'regu') {
            fetchCabang();
        }
    }, [selectedUnit, viewMode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (selectedUnit === 'UK3') {
                if (viewMode === 'regu') {
                    // Fetch Monitoring Regu
                    let url = `/monitoring-regu?tanggal=${dateStart || new Date().toISOString().slice(0, 10)}`;
                    if (selectedCabang) url += `&kode_cabang=${selectedCabang}`;

                    const response: any = await apiClient.get(url);
                    if (response && response.regu_groups) {
                        setGroups(response.regu_groups);
                        setSummary(response.summary);
                    } else {
                        setGroups([]);
                        setSummary(null);
                    }
                } else {
                    // Fetch Personal Patrol Data
                    let url = '/security/patrol?';
                    if (searchTerm) url += `search=${searchTerm}&`;
                    if (dateStart) url += `date_start=${dateStart}&`;
                    if (dateEnd) url += `date_end=${dateEnd}`;

                    const response: any = await apiClient.get(url);
                    if (Array.isArray(response)) {
                        setData(response);
                    } else {
                        setData([]);
                    }
                }
            } else {
                // UCS / UDV - Fetch Tasks
                let url = `/security/tasks?kode_dept=${selectedUnit}&`;
                if (searchTerm) url += `search=${searchTerm}&`;
                if (dateStart) url += `date_start=${dateStart}&`;
                if (dateEnd) url += `date_end=${dateEnd}`;

                const response: any = await apiClient.get(url);
                if (Array.isArray(response)) {
                    setData(response);
                } else {
                    setData([]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
            setData([]);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setCurrentPage(1);
    }, [selectedUnit, viewMode]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, dateStart, dateEnd, selectedCabang]);

    // Pagination Logic
    const paginatedData = useMemo(() => {
        if (viewMode === 'regu') return [];
        const start = (currentPage - 1) * perPage;
        return data.slice(start, start + perPage);
    }, [data, currentPage, perPage, viewMode]);

    const totalPages = Math.ceil(data.length / perPage);

    const getMapsUrl = (coords: string | null) => {
        if (!coords) return '#';
        return `https://www.google.com/maps?q=${coords}`;
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Laporan Tugas Monitoring" />

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

                {/* Unit Tabs */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                        {UNITS.map((unit) => (
                            <button
                                key={unit.code}
                                onClick={() => {
                                    setSelectedUnit(unit.code);
                                    if (unit.code !== 'UK3') setViewMode('personal');
                                }}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                                    selectedUnit === unit.code
                                        ? "bg-brand-500 text-white shadow-md"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-meta-4 dark:text-gray-300 dark:hover:bg-opacity-80"
                                )}
                            >
                                <span>{unit.name} ({unit.short})</span>
                            </button>
                        ))}
                    </div>

                    {selectedUnit === 'UK3' && (
                        <div className="flex bg-gray-100 dark:bg-meta-4 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('personal')}
                                className={clsx(
                                    "px-4 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm",
                                    viewMode === 'personal'
                                        ? "bg-white dark:bg-boxdark text-black dark:text-white"
                                        : "text-gray-500 hover:text-black dark:hover:text-white"
                                )}
                            >
                                Personal
                            </button>
                            <button
                                onClick={() => setViewMode('regu')}
                                className={clsx(
                                    "px-4 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm",
                                    viewMode === 'regu'
                                        ? "bg-white dark:bg-boxdark text-black dark:text-white"
                                        : "text-gray-500 hover:text-black dark:hover:text-white"
                                )}
                            >
                                Per Regu
                            </button>
                        </div>
                    )}
                </div>

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-brand-500" />
                        Laporan - {UNITS.find(u => u.code === selectedUnit)?.name}
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Export / Print</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    {viewMode === 'personal' ? (
                        <>
                            <div className="relative col-span-2">
                                <input
                                    type="text"
                                    placeholder="Cari NIK atau Nama Petugas..."
                                    value={searchTerm}
                                    onChange={e => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                                />
                                <Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                                <DatePicker
                                    id="filter-date-start"
                                    placeholder="Dari Tanggal"
                                    defaultDate={dateStart}
                                    onChange={(dates: Date[], str: string) => setDateStart(str)}
                                />
                            </div>
                            <div>
                                <DatePicker
                                    id="filter-date-end"
                                    placeholder="Sampai Tanggal"
                                    defaultDate={dateEnd}
                                    onChange={(dates: Date[], str: string) => setDateEnd(str)}
                                />
                            </div>
                        </>
                    ) : (
                        // Regu Filters
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tanggal</label>
                                <DatePicker
                                    id="filter-date-regu"
                                    placeholder="Pilih Tanggal"
                                    defaultDate={dateStart}
                                    onChange={(dates: Date[], str: string) => setDateStart(str)}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Cabang</label>
                                <SearchableSelect
                                    value={selectedCabang}
                                    onChange={setSelectedCabang}
                                    options={[
                                        { value: '', label: 'Semua Cabang' },
                                        ...cabangOptions.map(opt => ({ value: opt.kode_cabang, label: opt.nama_cabang }))
                                    ]}
                                    placeholder="Pilih Cabang..."
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Content View */}
                {viewMode === 'personal' ? (
                    <>
                        <div className="max-w-full overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                        <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                        <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Petugas</th>
                                        <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Waktu Tugas</th>
                                        <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Lokasi & Shift</th>
                                        <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                        <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Foto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                                    ) : paginatedData.length === 0 ? (
                                        <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td></tr>
                                    ) : (
                                        paginatedData.map((item, idx) => (
                                            <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                                <td className="px-4 py-4 text-center">
                                                    <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex bg-gray-100 h-10 w-10 min-w-10 items-center justify-center rounded-full text-gray-600 dark:bg-meta-4 dark:text-gray-400">
                                                            <User size={20} />
                                                        </div>
                                                        <div>
                                                            <h5 className="font-semibold text-black dark:text-white text-sm">{item.nama_petugas || item.nik}</h5>
                                                            <p className="text-xs text-gray-500">NIK: {item.nik}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium text-black dark:text-white">{new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                        <span className="text-gray-500 text-xs">Jam: {item.jam_tugas || item.jam_patrol || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm">
                                                    <div className="flex flex-col gap-1">
                                                        {item.lokasi_absen && (
                                                            <div className="flex items-center gap-1 text-xs">
                                                                <MapPin size={12} className="text-red-500" />
                                                                <a
                                                                    href={getMapsUrl(item.lokasi_absen)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-500 hover:underline truncate max-w-[150px]"
                                                                >
                                                                    Lokasi Maps
                                                                </a>
                                                            </div>
                                                        )}
                                                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded w-fit dark:bg-meta-4">Shift: {item.kode_jam_kerja || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={clsx(
                                                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                                                        item.status === 'complete' || item.status === 'active'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    )}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {item.foto_absen ? (
                                                        <div className="flex justify-center">
                                                            <img
                                                                src={item.foto_absen}
                                                                alt="Foto Absen"
                                                                className="h-10 w-10 rounded-full border-2 border-white dark:border-boxdark object-cover cursor-pointer hover:opacity-80 transition shadow-sm bg-gray-200"
                                                                onClick={() => setPreviewImage(item.foto_absen)}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-center text-gray-400">
                                                            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                                <ClipboardList className="h-5 w-5 opacity-30" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {data.length > 0 && (
                            <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stroke pt-4 dark:border-strokedark">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, data.length)} dari {data.length} data
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    // REGU VIEW CONTENT
                    <div className="space-y-6">
                        {/* Summary Stats */}
                        {summary && (
                            <div className="flex flex-wrap gap-4 justify-between bg-gray-50 dark:bg-meta-4 p-4 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <User className="text-brand-500" size={20} />
                                    <div>
                                        <p className="text-xs text-gray-500">Total Anggota</p>
                                        <p className="font-bold">{summary.total_anggota}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="text-success" size={20} />
                                    <div>
                                        <p className="text-xs text-gray-500">Sudah Patroli</p>
                                        <p className="font-bold text-success">{summary.total_sudah_patroli}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="text-danger" size={20} />
                                    <div>
                                        <p className="text-xs text-gray-500">Belum Patroli</p>
                                        <p className="font-bold text-danger">{summary.total_belum_patroli}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="radial-progress text-brand-500 text-xs font-bold" style={{ "--value": summary.persen_slot } as any}>
                                        {summary.persen_slot}%
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Kepatuhan</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Grid Groups */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {groups.map((group) => (
                                <div key={group.uid} className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark flex flex-col overflow-hidden">
                                    {/* Header */}
                                    <div className={`px-4 py-3 border-b border-stroke dark:border-strokedark flex justify-between items-center ${group.status_level === 'aman' ? 'bg-success/5 dark:bg-success/10' : 'bg-danger/5 dark:bg-danger/10'}`}>
                                        <div>
                                            <h3 className="font-bold text-black dark:text-white flex items-center gap-2">
                                                {group.nama_jam_kerja || group.kode_jam_kerja}
                                                {group.status_level === 'aman' ? (
                                                    <span className="bg-success text-white text-[10px] px-2 py-0.5 rounded-full">Aman</span>
                                                ) : (
                                                    <span className="bg-danger text-white text-[10px] px-2 py-0.5 rounded-full">Perlu Tindak</span>
                                                )}
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                {group.nama_cabang} • {group.jam_masuk?.substring(0, 5)} - {group.jam_pulang?.substring(0, 5)} • {group.shift_timing_label}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-black dark:text-white">{group.persen_slot}%</div>
                                            <div className="text-[10px] text-gray-500">Kepatuhan Slot</div>
                                        </div>
                                    </div>

                                    {/* Monitor Slots */}
                                    <div className="px-4 py-3 border-b border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/30">
                                        <div className="flex flex-wrap gap-1">
                                            {group.hourly_slots.map((slot) => (
                                                <div
                                                    key={slot.jam_ke}
                                                    title={`Jam ke-${slot.jam_ke}: ${slot.rentang} (${slot.jumlah_event} kegiatan)`}
                                                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold cursor-help transition hover:scale-110 ${slot.terpenuhi
                                                        ? 'bg-success text-white'
                                                        : group.shift_timing_status === 'sudah_berlalu' || (group.shift_timing_status === 'sedang_berlangsung' && slot.jam_ke === 1)
                                                            ? 'bg-danger text-white'
                                                            : 'bg-gray-200 dark:bg-meta-4 text-gray-400'
                                                        }`}
                                                >
                                                    {slot.jam_ke}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Member List */}
                                    <div className="p-0 overflow-y-auto max-h-[300px]">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-meta-4">
                                                <tr>
                                                    <th className="px-4 py-2">Anggota</th>
                                                    <th className="px-4 py-2 text-center">Patroli</th>
                                                    <th className="px-4 py-2 text-right">Terakhir</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {group.members.map((member) => (
                                                    <tr key={member.nik} className="border-b border-stroke dark:border-strokedark last:border-0 hover:bg-gray-50 dark:hover:bg-meta-4/20 transition">
                                                        <td className="px-4 py-2">
                                                            <div className="font-semibold text-black dark:text-white truncate max-w-[150px]" title={member.nama_karyawan}>
                                                                {member.nama_karyawan}
                                                            </div>
                                                            <div className="text-xs text-gray-500">{member.nik}</div>
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <div className="flex flex-col items-center">
                                                                {member.sudah_patroli ? (
                                                                    <span className="text-success flex items-center gap-1 text-xs font-medium bg-success/10 px-2 py-0.5 rounded-full">
                                                                        <Check size={12} strokeWidth={3} /> {member.jumlah_sesi_patroli} Sesi
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-danger flex items-center gap-1 text-xs font-medium bg-danger/10 px-2 py-0.5 rounded-full">
                                                                        <X size={12} strokeWidth={3} /> Belum
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-mono text-xs">
                                                            {member.jam_patrol_terakhir ? (
                                                                <span className="text-black dark:text-white">{member.jam_patrol_terakhir.substring(0, 5)}</span>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {groups.length === 0 && !loading && (
                            <div className="text-center py-12 text-gray-500 bg-white dark:bg-boxdark rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                <p>Tidak ada jadwal regu aktif untuk filter yang dipilih.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

export default withPermission(LaporanTugasPage, {
    permissions: ['monitoringpatrol.index']
});
