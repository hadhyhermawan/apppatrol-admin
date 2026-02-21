'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Search, Calendar, MapPin, ArrowLeft, ArrowRight, RefreshCw, User, Filter, Eye, Edit, Trash, X, Save, Loader2, Clock, AlertTriangle } from 'lucide-react';
import Swal from 'sweetalert2';
import clsx from 'clsx';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Image from 'next/image';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import dynamic from 'next/dynamic';
import SearchableSelect from '@/components/form/SearchableSelect';
import Link from 'next/link';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />,
});

type PresensiItem = {
    id: number;
    nik: string;
    nama_karyawan: string;
    nama_dept: string;
    nama_jam_kerja: string;
    jam_in: string;
    jam_out: string;
    foto_in: string | null;
    foto_out: string | null;
    lokasi_in: string | null;
    lokasi_out: string | null;
    status_kehadiran: string;
    kode_jam_kerja: string | null;
    tanggal: string | null;
};

type JamKerjaOption = { kode: string; nama: string; jam_masuk: string | null; jam_pulang: string | null };
type OptionItem = { code: string; name: string };
type MasterOptions = { departemen: OptionItem[] };

const STATUS_OPTIONS = [
    { value: 'H', label: 'Hadir' },
    { value: 'I', label: 'Izin' },
    { value: 'S', label: 'Sakit' },
    { value: 'A', label: 'Alpha' },
];

function PresensiPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<PresensiItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [dateFilter, setDateFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [options, setOptions] = useState<MasterOptions>({ departemen: [] });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [perPage] = useState(20);
    const [totalItems, setTotalItems] = useState(0);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Edit Modal
    const [editItem, setEditItem] = useState<PresensiItem | null>(null);
    const [editForm, setEditForm] = useState({ jam_in: '', jam_out: '', status: '', kode_jam_kerja: '' });
    const [jamKerjaOptions, setJamKerjaOptions] = useState<JamKerjaOption[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        apiClient.get('/master/options').then((res: any) => {
            setOptions({ departemen: res?.departemen || [] });
        }).catch(() => { });

        apiClient.get('/monitoring/jam-kerja-options').then((res: any) => {
            setJamKerjaOptions(res?.data || []);
        }).catch(() => { });
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `/monitoring/presensi?page=${currentPage}&per_page=${perPage}`;
            if (dateFilter) url += `&date=${dateFilter}`;
            if (filterDept) url += `&dept_code=${filterDept}`;
            if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;

            const response: any = await apiClient.get(url);
            if (response.status) {
                setData(response.data);
                if (response.meta) {
                    setTotalPages(response.meta.total_pages);
                    setTotalItems(response.meta.total_items);
                }
            } else {
                setData([]);
            }
        } catch (error) {
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 800);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => { fetchData(); }, [dateFilter, currentPage, filterDept, debouncedSearch]);
    useEffect(() => { setCurrentPage(1); }, [dateFilter, filterDept, debouncedSearch]);

    // ─── Edit handlers ─────────────────────────────────────────────────────────
    const openEdit = (item: PresensiItem) => {
        setEditItem(item);
        setEditForm({
            jam_in: item.jam_in === '-' ? '' : (item.jam_in?.substring(0, 5) ?? ''),
            jam_out: item.jam_out === '-' ? '' : (item.jam_out?.substring(0, 5) ?? ''),
            status: item.status_kehadiran ?? 'H',
            kode_jam_kerja: item.kode_jam_kerja ?? '',
        });
    };

    const handleSaveEdit = async () => {
        if (!editItem) return;
        setSaving(true);
        try {
            await apiClient.put(`/monitoring/presensi/${editItem.id}`, {
                jam_in: editForm.jam_in || '-',
                jam_out: editForm.jam_out || '-',
                status: editForm.status,
                kode_jam_kerja: editForm.kode_jam_kerja || null,
            });
            Swal.fire({ icon: 'success', title: 'Berhasil diupdate', timer: 1500, showConfirmButton: false });
            setEditItem(null);
            fetchData();
        } catch (e: any) {
            Swal.fire('Gagal!', e?.response?.data?.detail ?? e?.message ?? 'Gagal menyimpan perubahan.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ─── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Apakah Anda Yakin?',
            text: 'Data presensi ini akan dihapus permanen!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/monitoring/presensi/${id}`);
            Swal.fire({ title: 'Terhapus!', icon: 'success', timer: 1500, showConfirmButton: false });
            fetchData();
        } catch (error: any) {
            Swal.fire('Gagal!', error.response?.data?.detail || 'Gagal menghapus data.', 'error');
        }
    };

    // ─── Helpers ───────────────────────────────────────────────────────────────
    const getStatusBadge = (status: string) => {
        const s = status ? status.toUpperCase().trim() : '';
        const map: Record<string, { cls: string; label: string }> = {
            'H': { cls: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400', label: 'Hadir' },
            'HADIR': { cls: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400', label: 'Hadir' },
            'I': { cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', label: 'Izin' },
            'IZIN': { cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', label: 'Izin' },
            'S': { cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400', label: 'Sakit' },
            'SAKIT': { cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400', label: 'Sakit' },
            'A': { cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', label: 'Alpha' },
            'ALPHA': { cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', label: 'Alpha' },
            'TA': { cls: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400', label: 'Tdk Absen Pulang' },
            'TL': { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', label: 'Terlambat' },
            'CT': { cls: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400', label: 'Cuti' },
            'DL': { cls: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400', label: 'Dinas Luar' },
            'LB': { cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400', label: 'Lembur' },
        };
        const found = map[s];
        const cls = found?.cls ?? 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400';
        const label = found?.label ?? (status || '-');
        return (
            <span
                title={`Status: ${label} (${status})`}
                className={clsx('inline-flex rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap', cls)}
            >
                {label}
            </span>
        );
    };


    const getMapsUrl = (coords: string | null) => coords ? `https://www.google.com/maps?q=${coords}` : '#';

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Monitoring Presensi" />

            {/* ─── Preview Image ───────────────────────────────────────────── */}
            {previewImage && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewImage(null)}>
                    <img src={previewImage} alt="Preview" className="max-h-[90vh] max-w-full rounded-lg shadow-2xl object-contain" />
                    <button className="absolute top-5 right-5 text-white bg-black/50 rounded-full p-2 hover:bg-white/20 transition" onClick={() => setPreviewImage(null)}>
                        <X className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* ─── Edit Modal ───────────────────────────────────────────────── */}
            {editItem && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Edit size={18} className="text-blue-500" /> Edit Presensi
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {editItem.nama_karyawan} &bull; {editItem.tanggal}
                                </p>
                            </div>
                            <button onClick={() => setEditItem(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4">
                            {/* Shift */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift / Jam Kerja</label>
                                <select
                                    value={editForm.kode_jam_kerja}
                                    onChange={e => setEditForm(f => ({ ...f, kode_jam_kerja: e.target.value }))}
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="">— Pilih Shift —</option>
                                    {jamKerjaOptions.map(j => (
                                        <option key={j.kode} value={j.kode}>
                                            {j.nama} {j.jam_masuk && j.jam_pulang ? `(${j.jam_masuk.substring(0, 5)} – ${j.jam_pulang.substring(0, 5)})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Jam Masuk */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                                    <Clock size={14} className="text-green-500" /> Jam Masuk
                                </label>
                                <input
                                    type="text"
                                    value={editForm.jam_in}
                                    onChange={e => {
                                        let v = e.target.value.replace(/[^0-9:]/g, '');
                                        if (v.length === 2 && !v.includes(':') && editForm.jam_in.length === 1) v = v + ':';
                                        if (v.length > 5) v = v.slice(0, 5);
                                        setEditForm(f => ({ ...f, jam_in: v }));
                                    }}
                                    placeholder="HH:MM  (contoh: 08:00)"
                                    maxLength={5}
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Jam Pulang */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                                    <Clock size={14} className="text-blue-500" /> Jam Pulang
                                </label>
                                <input
                                    type="text"
                                    value={editForm.jam_out}
                                    onChange={e => {
                                        let v = e.target.value.replace(/[^0-9:]/g, '');
                                        if (v.length === 2 && !v.includes(':') && editForm.jam_out.length === 1) v = v + ':';
                                        if (v.length > 5) v = v.slice(0, 5);
                                        setEditForm(f => ({ ...f, jam_out: v }));
                                    }}
                                    placeholder="HH:MM  (contoh: 17:00)"
                                    maxLength={5}
                                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">Kosongkan jika belum pulang</p>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status Kehadiran</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {STATUS_OPTIONS.map(s => (
                                        <button
                                            key={s.value}
                                            onClick={() => setEditForm(f => ({ ...f, status: s.value }))}
                                            className={clsx(
                                                'py-2 rounded-xl text-sm font-medium border-2 transition-all',
                                                editForm.status === s.value
                                                    ? s.value === 'H' ? 'bg-green-500 border-green-500 text-white'
                                                        : s.value === 'I' ? 'bg-blue-500 border-blue-500 text-white'
                                                            : s.value === 'S' ? 'bg-yellow-500 border-yellow-500 text-white'
                                                                : 'bg-red-500 border-red-500 text-white'
                                                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400'
                                            )}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setEditItem(null)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {saving ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</> : <><Save size={15} /> Simpan</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Main Card ─────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">Daftar Presensi</h2>
                    <button onClick={fetchData} className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white shadow-sm transition">
                        <RefreshCw className="h-4 w-4" /> <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative col-span-1 md:col-span-2">
                        <input
                            type="text"
                            placeholder="Cari karyawan..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        />
                        <Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                    </div>
                    <DatePicker
                        id="date-filter"
                        placeholder="Filter Tanggal"
                        defaultDate={dateFilter}
                        onChange={(dates: Date[], dateStr: string) => setDateFilter(dateStr)}
                    />
                    <SearchableSelect
                        options={[{ value: '', label: 'Semua Departemen' }, ...options.departemen.map(o => ({ value: o.code, label: o.name }))]}
                        value={filterDept}
                        onChange={val => setFilterDept(val)}
                        placeholder="Semua Departemen"
                    />
                </div>

                {/* Table */}
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Karyawan</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Shift</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Jam Masuk</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Jam Pulang</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white text-center">Bukti Foto</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td></tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={item.id} className={clsx(
                                        'border-b border-stroke dark:border-strokedark transition-colors',
                                        item.jam_out === '-' || !item.jam_out
                                            ? 'bg-amber-50/60 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                            : 'hover:bg-gray-50 dark:hover:bg-meta-4/10'
                                    )}>
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 text-brand-500 bg-brand-50 rounded-full flex items-center justify-center font-bold text-sm">
                                                    {item.nama_karyawan?.substring(0, 2).toUpperCase() ?? '??'}
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-black dark:text-white text-sm">{item.nama_karyawan}</h5>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <span>{item.nik}</span>
                                                        <span>•</span>
                                                        <span>{item.nama_dept}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-block rounded bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-black dark:bg-meta-4 dark:text-white">
                                                {item.nama_jam_kerja}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-black dark:text-white text-sm font-medium">{item.jam_in}</span>
                                                {item.lokasi_in && (
                                                    <a href={getMapsUrl(item.lokasi_in)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-500 hover:underline">
                                                        <MapPin className="h-3 w-3" /> Lokasi
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {item.jam_out === '-' || !item.jam_out ? (
                                                <div className="flex flex-col gap-1.5">
                                                    <span
                                                        title="Karyawan ini belum melakukan absen pulang"
                                                        className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 w-fit"
                                                    >
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                        </span>
                                                        Belum Pulang
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium text-black dark:text-white">
                                                        {item.jam_out}
                                                    </span>
                                                    {item.lokasi_out && (
                                                        <a href={getMapsUrl(item.lokasi_out)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-500 hover:underline">
                                                            <MapPin className="h-3 w-3" /> Lokasi
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center -space-x-2">
                                                {item.foto_in && (
                                                    <div className="h-10 w-10 rounded-full border-2 border-white dark:border-boxdark overflow-hidden bg-gray-200">
                                                        <Image src={item.foto_in} alt="In" width={40} height={40} className="h-full w-full object-cover cursor-pointer hover:opacity-80 transition" unoptimized onError={(e: any) => e.target.style.display = 'none'} onClick={() => setPreviewImage(item.foto_in)} />
                                                    </div>
                                                )}
                                                {item.foto_out && (
                                                    <div className="h-10 w-10 rounded-full border-2 border-white dark:border-boxdark overflow-hidden bg-gray-200">
                                                        <Image src={item.foto_out} alt="Out" width={40} height={40} className="h-full w-full object-cover cursor-pointer hover:opacity-80 transition" unoptimized onError={(e: any) => e.target.style.display = 'none'} onClick={() => setPreviewImage(item.foto_out)} />
                                                    </div>
                                                )}
                                                {!item.foto_in && !item.foto_out && <span className="text-xs text-gray-500">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">{getStatusBadge(item.status_kehadiran)}</td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link href={`/presensi/${item.id}`} title="Detail" className="hover:text-blue-500 text-blue-400">
                                                    <Eye className="h-5 w-5" />
                                                </Link>
                                                {canUpdate('presensi') && (
                                                    <button onClick={() => openEdit(item)} title="Edit" className="hover:text-yellow-500 text-yellow-400 transition">
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                )}
                                                {canDelete('presensi') && (
                                                    <button onClick={() => handleDelete(item.id)} title="Hapus" className="hover:text-red-500 text-red-500 transition">
                                                        <Trash className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stroke pt-4 dark:border-strokedark">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Menampilkan <span className="font-medium text-black dark:text-white">{data.length > 0 ? (currentPage - 1) * perPage + 1 : 0}</span> - <span className="font-medium text-black dark:text-white">{Math.min(currentPage * perPage, totalItems)}</span> dari <span className="font-medium text-black dark:text-white">{totalItems}</span> data
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading} className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4">
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <span className="flex h-8 items-center px-3 text-sm text-gray-600 dark:text-gray-400">
                            {currentPage} / {totalPages}
                        </span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || loading} className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4">
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

export default withPermission(PresensiPage, { permissions: ['presensi.index'] });
