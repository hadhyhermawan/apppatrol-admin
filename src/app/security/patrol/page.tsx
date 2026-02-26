'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, Search, X, Save, Edit, Trash, ArrowLeft, ArrowRight, ShieldCheck, MapPin, Eye, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import SearchableSelect from '@/components/form/SearchableSelect';
import dynamic from 'next/dynamic';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />
});

type PatrolItem = {
    id: number;
    nik: string;
    tanggal: string;
    kode_jam_kerja: string;
    jam_patrol: string;
    status: string;
    foto_absen: string | null;
    lokasi_absen: string | null;
    created_at?: string;
    updated_at?: string;
    nama_petugas?: string;
    kode_cabang?: string;
    nama_cabang?: string;
};

type KaryawanOption = {
    nik: string;
    nama_karyawan: string;
};

type CabangOption = {
    kode_cabang: string;
    nama_cabang: string;
};

type JamKerjaOption = {
    kode_jam_kerja: string;
    nama_jam_kerja: string;
};

function SecurityPatrolPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const router = useRouter();
    const [data, setData] = useState<PatrolItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [kodeCabangFilter, setKodeCabangFilter] = useState('');
    const [kodeJamKerjaFilter, setKodeJamKerjaFilter] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [karyawanList, setKaryawanList] = useState<KaryawanOption[]>([]);
    const [cabangList, setCabangList] = useState<CabangOption[]>([]);
    const [jamKerjaList, setJamKerjaList] = useState<JamKerjaOption[]>([]);
    const isFirstRender = useRef(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<{
        id: number;
        nik: string;
        tanggal: string;
        kode_jam_kerja: string;
        jam_patrol: string;
        status: string;
        foto_absen: string;
        lokasi_absen: string;
    }>({
        id: 0,
        nik: '',
        tanggal: '',
        kode_jam_kerja: 'S1', // Default shift?
        jam_patrol: '',
        status: 'active',
        foto_absen: '',
        lokasi_absen: ''
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Fetch Karyawan
    const fetchKaryawan = async () => {
        try {
            const response: any = await apiClient.get('/master/karyawan?per_page=10000');
            if (response && response.data && Array.isArray(response.data)) {
                setKaryawanList(response.data);
            } else if (Array.isArray(response)) {
                setKaryawanList(response);
            }
        } catch (error) {
            console.error("Failed to fetch karyawan options", error);
        }
    };

    const fetchCabang = async () => {
        try {
            const response: any = await apiClient.get('/master/cabang/options');
            setCabangList(response);
        } catch (error) {
            console.error("Failed to fetch cabang options", error);
        }
    };

    const fetchJamKerjaOptions = async () => {
        try {
            const response: any = await apiClient.get('/master/jam-kerja-options');
            setJamKerjaList(response);
        } catch (error) {
            console.error("Failed to fetch jam kerja options", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/security/patrol?';
            if (searchTerm) url += `search=${searchTerm}&`;
            if (dateStart) url += `date_start=${dateStart}&`;
            if (dateEnd) url += `date_end=${dateEnd}&`;
            if (kodeCabangFilter) url += `kode_cabang=${kodeCabangFilter}&`;
            if (kodeJamKerjaFilter) url += `kode_jam_kerja=${kodeJamKerjaFilter}&`;

            const response: any = await apiClient.get(url);
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch patrol data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKaryawan();
        fetchCabang();
        fetchJamKerjaOptions();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, dateStart, dateEnd, kodeCabangFilter, kodeJamKerjaFilter]);

    // Pagination Logic
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return data.slice(start, start + perPage);
    }, [data, currentPage, perPage]);

    const totalPages = Math.ceil(data.length / perPage);

    // Handlers
    const handleOpenCreate = () => {
        setErrorMsg('');
        setModalMode('create');
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 8); // HH:MM:SS

        setFormData({
            id: 0,
            nik: '',
            tanggal: dateStr,
            kode_jam_kerja: 'S1',
            jam_patrol: timeStr,
            status: 'active',
            foto_absen: '',
            lokasi_absen: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: PatrolItem) => {
        setErrorMsg('');
        setModalMode('edit');
        setFormData({
            id: item.id,
            nik: item.nik,
            tanggal: item.tanggal,
            kode_jam_kerja: item.kode_jam_kerja,
            jam_patrol: item.jam_patrol,
            status: item.status,
            foto_absen: item.foto_absen || '',
            lokasi_absen: item.lokasi_absen || ''
        });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.nik || !formData.tanggal || !formData.jam_patrol) {
            setErrorMsg('Harap isi Petugas, Tanggal, dan Jam Patroli.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                foto_absen: formData.foto_absen || null,
                lokasi_absen: formData.lokasi_absen || null
            };

            if (modalMode === 'create') {
                await apiClient.post('/security/patrol', payload);
            } else {
                await apiClient.put(`/security/patrol/${editingId}`, payload);
            }
            setIsModalOpen(false);
            fetchData();
            Swal.fire({
                title: 'Berhasil!',
                text: modalMode === 'create' ? 'Data berhasil disimpan.' : 'Data berhasil diperbarui.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail || 'Terjadi kesalahan saat menyimpan.';
            setErrorMsg(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Apakah Anda Yakin?',
            text: `Data patroli ini akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/security/patrol/${id}`);
            Swal.fire({
                title: 'Terhapus!',
                text: 'Data berhasil dihapus.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            fetchData();
        } catch (error: any) {
            console.error(error);
            Swal.fire('Gagal!', error.response?.data?.detail || "Gagal menghapus data.", 'error');
        }
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Tugas Patroli" />

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
                        Monitoring Patroli
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('giatpatrol') && (
                            <button onClick={handleOpenCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                                <Plus className="h-4 w-4" />
                                <span>Tambah Data</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-6">
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
                        <SearchableSelect
                            options={cabangList.map(cab => ({ value: cab.kode_cabang, label: cab.nama_cabang }))}
                            value={kodeCabangFilter}
                            onChange={(val) => {
                                setKodeCabangFilter(val);
                                setCurrentPage(1);
                            }}
                            placeholder="Semua Cabang"
                        />
                    </div>
                    <div>
                        <SearchableSelect
                            options={jamKerjaList.map(jk => ({ value: jk.kode_jam_kerja, label: jk.nama_jam_kerja }))}
                            value={kodeJamKerjaFilter}
                            onChange={(val) => {
                                setKodeJamKerjaFilter(val);
                                setCurrentPage(1);
                            }}
                            placeholder="Semua Shift"
                        />
                    </div>
                    <div>
                        <DatePicker
                            id="date-start"
                            placeholder="Dari Tanggal"
                            defaultDate={dateStart}
                            onChange={(dates: Date[], dateStr: string) => setDateStart(dateStr)}
                        />
                    </div>
                    <div>
                        <DatePicker
                            id="date-end"
                            placeholder="Sampai Tanggal"
                            defaultDate={dateEnd}
                            onChange={(dates: Date[], dateStr: string) => setDateEnd(dateStr)}
                        />
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Petugas</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Waktu Patroli</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Lokasi & Shift</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Foto Absen</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex bg-blue-100 h-10 w-10 min-w-10 items-center justify-center rounded-full text-blue-600">
                                                    <ShieldCheck size={20} />
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-black dark:text-white text-sm">{item.nama_petugas || item.nik}</h5>
                                                    <p className="text-xs text-brand-500 font-medium">{item.nama_cabang || item.kode_cabang || '-'}</p>
                                                    <p className="text-xs text-gray-500">NIK: {item.nik}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-black dark:text-white">{item.tanggal}</span>
                                                <span className="text-gray-500 text-xs">Jam: {item.jam_patrol}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="flex flex-col gap-1">
                                                {item.lokasi_absen && (
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <MapPin size={12} className="text-red-500" />
                                                        <a
                                                            href={`https://maps.google.com/?q=${item.lokasi_absen}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-500 hover:underline truncate max-w-[150px]"
                                                        >
                                                            Lokasi Maps
                                                        </a>
                                                    </div>
                                                )}
                                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded w-fit">Shift: {item.kode_jam_kerja}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.status === 'complete'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {item.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {item.foto_absen ? (
                                                <div className="flex justify-center">
                                                    <img
                                                        src={item.foto_absen}
                                                        alt="Foto Absen"
                                                        className="h-10 w-10 rounded-full border-2 border-white dark:border-boxdark object-cover cursor-pointer hover:opacity-80 transition shadow-sm bg-gray-200"
                                                        onClick={() => setPreviewImage(item.foto_absen || null)}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex justify-center text-gray-400">
                                                    <User className="h-6 w-6 opacity-30" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {canUpdate('giatpatrol') && (
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:text-yellow-500 text-gray-500 dark:text-gray-400" title="Edit">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => router.push(`/security/patrol/${item.id}`)} className="hover:text-blue-500 text-gray-500 dark:text-gray-400" title="Detail">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {canDelete('giatpatrol') && (
                                                    <button onClick={() => handleDelete(item.id)} className="hover:text-red-500 text-gray-500 dark:text-gray-400" title="Hapus">
                                                        <Trash className="h-4 w-4" />
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
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-white dark:bg-boxdark">
                            <h3 className="text-lg font-bold text-black dark:text-white">
                                {modalMode === 'create' ? 'Tambah Sesi Patroli' : 'Edit Sesi Patroli'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-5 space-y-4">
                                {errorMsg && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                                        {errorMsg}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Petugas <span className="text-red-500">*</span></label>
                                    <SearchableSelect
                                        options={karyawanList.map(k => ({ value: k.nik, label: k.nama_karyawan }))}
                                        value={formData.nik}
                                        onChange={(val) => setFormData({ ...formData, nik: val })}
                                        placeholder="Pilih Petugas"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Tanggal</label>
                                        <DatePicker
                                            id="form-tanggal"
                                            placeholder="Pilih Tanggal"
                                            defaultDate={formData.tanggal}
                                            onChange={(dates: Date[], dateStr: string) => setFormData({ ...formData, tanggal: dateStr })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Jam Patroli</label>
                                        <DatePicker
                                            id="form-jam-patrol"
                                            mode="time"
                                            enableTime
                                            dateFormat="H:i"
                                            placeholder="Pilih Jam"
                                            defaultDate={formData.jam_patrol}
                                            onChange={(dates, str) => setFormData({ ...formData, jam_patrol: str })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Kode Jam Kerja / Shift</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.kode_jam_kerja}
                                            onChange={e => setFormData({ ...formData, kode_jam_kerja: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Status</label>
                                        <select
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="active">Active</option>
                                            <option value="complete">Complete</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Lokasi Absen (Lat,Long)</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                        placeholder="-6.123456, 106.123456"
                                        value={formData.lokasi_absen}
                                        onChange={e => setFormData({ ...formData, lokasi_absen: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 dark:bg-meta-4/30 flex justify-end gap-3 border-t border-stroke dark:border-strokedark">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-black bg-white border border-stroke rounded-lg hover:bg-gray-50">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-opacity-90 flex items-center">
                                    {isSubmitting ? 'Menyimpan...' : <><Save className="w-4 h-4 mr-2" /> Simpan</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

// Protect page with permission
export default withPermission(SecurityPatrolPage, {
    permissions: ['giatpatrol.index']
});
