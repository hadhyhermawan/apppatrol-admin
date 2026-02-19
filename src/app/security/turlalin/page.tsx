'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, Search, X, Save, Edit, Trash, ArrowLeft, ArrowRight, User, Eye, Calendar, Clock, Image as ImageIcon } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import Image from 'next/image';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import SearchableSelect from '@/components/form/SearchableSelect'; // Ensure path is correct, previously was ui/SearchableSelect or form/SearchableSelect. In step 3121 it was ui/SearchableSelect. In Presensi read it was components/form/SearchableSelect. I will use ui/SearchableSelect based on step 3121 listing. 
// Wait, Step 3163 (Presensi) used '@/components/form/SearchableSelect'.
// Step 3166 (Turlalin) used '@/components/form/SearchableSelect'.
// Step 3132 (Team) used '@/components/ui/SearchableSelect'.
// I should check which one exists or if both exist. To be safe, I will stick to what Turlalin used: components/form/SearchableSelect?
// Wait, list_dir in 3121 showed `ui/SearchableSelect.tsx`. `form` directory had 25 children.
// If Turlalin imports from `form`, then it must exist there too.
// I'll stick to the existing import in Turlalin: '@/components/form/SearchableSelect'.

import dynamic from 'next/dynamic';
import clsx from 'clsx';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />
});

type TurlalinItem = {
    id: number;
    nomor_polisi: string;
    jam_masuk: string;
    nik: string;
    keterangan: string | null;
    foto: string | null;
    jam_keluar: string | null;
    nik_keluar: string | null;
    foto_keluar: string | null;
    created_at?: string;
    updated_at?: string;
    nama_guard_masuk?: string;
    nama_guard_keluar?: string;
};

type KaryawanOption = {
    nik: string;
    nama_karyawan: string;
};

function SecurityTurlalinPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<TurlalinItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [karyawanList, setKaryawanList] = useState<KaryawanOption[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<{
        id: number;
        nomor_polisi: string;
        jam_masuk: string;
        nik: string;
        keterangan: string;
        foto: string;
        jam_keluar: string;
        nik_keluar: string;
        foto_keluar: string;
    }>({
        id: 0,
        nomor_polisi: '',
        jam_masuk: '',
        nik: '',
        keterangan: '',
        foto: '',
        jam_keluar: '',
        nik_keluar: '',
        foto_keluar: ''
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Fetch Karyawan for dropdown
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

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/security/turlalin?';
            if (searchTerm) url += `search=${searchTerm}&`;
            if (dateStart) url += `date_start=${dateStart}&`;
            if (dateEnd) url += `date_end=${dateEnd}`;

            const response: any = await apiClient.get(url);
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch turlalin data", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKaryawan();
        fetchData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 800);
        return () => clearTimeout(timer);
    }, [searchTerm, dateStart, dateEnd]);

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
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const nowStr = now.toISOString().slice(0, 16);

        setFormData({
            id: 0,
            nomor_polisi: '',
            jam_masuk: nowStr,
            nik: '',
            keterangan: '',
            foto: '',
            jam_keluar: '',
            nik_keluar: '',
            foto_keluar: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: TurlalinItem) => {
        setErrorMsg('');
        setModalMode('edit');
        setFormData({
            id: item.id,
            nomor_polisi: item.nomor_polisi,
            jam_masuk: item.jam_masuk ? new Date(item.jam_masuk).toISOString().slice(0, 16) : '',
            nik: item.nik,
            keterangan: item.keterangan || '',
            foto: item.foto || '',
            jam_keluar: item.jam_keluar ? new Date(item.jam_keluar).toISOString().slice(0, 16) : '',
            nik_keluar: item.nik_keluar || '',
            foto_keluar: item.foto_keluar || ''
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

        if (!formData.nomor_polisi || !formData.jam_masuk || !formData.nik) {
            setErrorMsg('Harap isi Nomor Polisi, Jam Masuk, dan Petugas Masuk.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                jam_keluar: formData.jam_keluar || null,
                nik_keluar: formData.nik_keluar || null,
                foto: formData.foto || null,
                foto_keluar: formData.foto_keluar || null,
                keterangan: formData.keterangan || null
            };

            if (modalMode === 'create') {
                await apiClient.post('/security/turlalin', payload);
            } else {
                await apiClient.put(`/security/turlalin/${editingId}`, payload);
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
            text: `Data ini akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/security/turlalin/${id}`);
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

    const getStatusBadge = (jamKeluar: string | null) => {
        if (jamKeluar) {
            return (
                <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-meta-4 dark:text-gray-400">
                    Selesai / Keluar
                </span>
            );
        }
        return (
            <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                Masih di Lokasi
            </span>
        );
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Pengaturan Lalu Lintas (Turlalin)" />

            {/* PREVIEW IMAGE MODAL */}
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
                        Daftar Turlalin
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('turlalin') && (
                            <button onClick={handleOpenCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                                <Plus className="h-4 w-4" />
                                <span>Tambah Data</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* FILTERS */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari Nomor Polisi..."
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
                            id="date-start"
                            placeholder="Dari Tanggal"
                            defaultDate={dateStart}
                            enableTime
                            dateFormat="Y-m-d H:i"
                            onChange={(dates: Date[], dateStr: string) => setDateStart(dateStr)}
                        />
                    </div>
                    <div>
                        <DatePicker
                            id="date-end"
                            placeholder="Sampai Tanggal"
                            defaultDate={dateEnd}
                            enableTime
                            dateFormat="Y-m-d H:i"
                            onChange={(dates: Date[], dateStr: string) => setDateEnd(dateStr)}
                        />
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Nomor Polisi</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Petugas</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Jam Masuk</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Jam Keluar</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white text-center">Bukti Foto</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-10 w-10 text-brand-500 bg-brand-50 rounded-full flex items-center justify-center font-bold">
                                                    <span className="text-xs">POL</span>
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-black dark:text-white">{item.nomor_polisi}</h5>
                                                    <div className="text-xs text-gray-500 line-clamp-1">{item.keterangan || '-'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm">
                                                <div className="flex items-center gap-1 text-xs mb-1">
                                                    <span className="font-semibold text-gray-600 dark:text-gray-400">In:</span> {item.nama_guard_masuk || item.nik}
                                                </div>
                                                {item.nama_guard_keluar && (
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <span className="font-semibold text-gray-600 dark:text-gray-400">Out:</span> {item.nama_guard_keluar || item.nik_keluar}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1 text-sm font-medium text-black dark:text-white">
                                                {item.jam_masuk ? new Date(item.jam_masuk).toLocaleString('id-ID') : '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1 text-sm font-medium text-black dark:text-white">
                                                {item.jam_keluar ? new Date(item.jam_keluar).toLocaleString('id-ID') : '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center -space-x-2">
                                                {item.foto && (
                                                    <div className="relative h-10 w-10 rounded-full border-2 border-white dark:border-boxdark overflow-hidden bg-gray-200" title="Foto Masuk">
                                                        <Image
                                                            src={item.foto}
                                                            alt="In"
                                                            width={40}
                                                            height={40}
                                                            className="h-full w-full object-cover cursor-pointer hover:opacity-80 transition"
                                                            unoptimized
                                                            onClick={() => setPreviewImage(item.foto)}
                                                            onError={(e: any) => e.target.style.display = 'none'}
                                                        />
                                                    </div>
                                                )}
                                                {item.foto_keluar && (
                                                    <div className="relative h-10 w-10 rounded-full border-2 border-white dark:border-boxdark overflow-hidden bg-gray-200" title="Foto Keluar">
                                                        <Image
                                                            src={item.foto_keluar}
                                                            alt="Out"
                                                            width={40}
                                                            height={40}
                                                            className="h-full w-full object-cover cursor-pointer hover:opacity-80 transition"
                                                            unoptimized
                                                            onClick={() => setPreviewImage(item.foto_keluar)}
                                                            onError={(e: any) => e.target.style.display = 'none'}
                                                        />
                                                    </div>
                                                )}
                                                {!item.foto && !item.foto_keluar && (
                                                    <span className="text-xs text-gray-500">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {getStatusBadge(item.jam_keluar)}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {canUpdate('turlalin') && (
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:text-yellow-500 text-yellow-400">
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                )}
                                                {canDelete('turlalin') && (
                                                    <button onClick={() => handleDelete(item.id)} className="hover:text-red-500 text-red-500">
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
                        Menampilkan <span className="font-medium text-black dark:text-white">{data.length > 0 ? (currentPage - 1) * perPage + 1 : 0}</span> - <span className="font-medium text-black dark:text-white">{Math.min(currentPage * perPage, data.length)}</span> dari <span className="font-medium text-black dark:text-white">{data.length}</span> data
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
            </div>

            {/* MODAL (RETAINED FOR FUNCTIONALITY) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center sticky top-0 bg-white dark:bg-boxdark z-10">
                            <h3 className="text-lg font-bold text-black dark:text-white">
                                {modalMode === 'create' ? 'Tambah Data Turlalin' : 'Edit Data Turlalin'}
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Nomor Polisi</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input text-black dark:text-white"
                                            placeholder="Contoh: B 1234 ABC"
                                            value={formData.nomor_polisi}
                                            onChange={e => setFormData({ ...formData, nomor_polisi: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Jam Masuk</label>
                                        <DatePicker
                                            id="form-jam-masuk"
                                            placeholder="Pilih Waktu"
                                            defaultDate={formData.jam_masuk}
                                            enableTime
                                            dateFormat="Y-m-d H:i"
                                            onChange={(dates: Date[], dateStr: string) => setFormData({ ...formData, jam_masuk: dateStr })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Petugas Masuk</label>
                                    <SearchableSelect
                                        options={karyawanList.map(k => ({ value: k.nik, label: `${k.nama_karyawan} (${k.nik})` }))}
                                        value={formData.nik}
                                        onChange={(val) => setFormData({ ...formData, nik: val })}
                                        placeholder="Pilih Petugas (Karyawan)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Foto Masuk (URL)</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input text-black dark:text-white"
                                        placeholder="https://..."
                                        value={formData.foto}
                                        onChange={e => setFormData({ ...formData, foto: e.target.value })}
                                    />
                                </div>

                                <div className="border-t border-stroke dark:border-strokedark pt-4 mt-2">
                                    <h4 className="font-semibold text-gray-500 mb-3 text-sm uppercase">Data Keluar (Opsional)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-black dark:text-white mb-2">Jam Keluar</label>
                                            <DatePicker
                                                id="form-jam-keluar"
                                                placeholder="Pilih Waktu"
                                                defaultDate={formData.jam_keluar}
                                                enableTime
                                                dateFormat="Y-m-d H:i"
                                                onChange={(dates: Date[], dateStr: string) => setFormData({ ...formData, jam_keluar: dateStr })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-black dark:text-white mb-2">Petugas Keluar</label>
                                            <SearchableSelect
                                                options={karyawanList.map(k => ({ value: k.nik, label: `${k.nama_karyawan} (${k.nik})` }))}
                                                value={formData.nik_keluar}
                                                onChange={(val) => setFormData({ ...formData, nik_keluar: val })}
                                                placeholder="Pilih Petugas"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Foto Keluar (URL)</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input text-black dark:text-white"
                                            placeholder="https://..."
                                            value={formData.foto_keluar}
                                            onChange={e => setFormData({ ...formData, foto_keluar: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Keterangan</label>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input text-black dark:text-white"
                                        placeholder="Keterangan tambahan..."
                                        value={formData.keterangan}
                                        onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                                    ></textarea>
                                </div>

                            </div>

                            <div className="px-6 py-4 bg-gray-50 dark:bg-meta-4/30 flex justify-end gap-3 border-t border-stroke dark:border-strokedark sticky bottom-0 z-10">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-black bg-white border border-stroke rounded-lg hover:bg-gray-50 dark:bg-meta-4 dark:text-white dark:border-strokedark">
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

export default withPermission(SecurityTurlalinPage, { permissions: ['turlalin.index'] });
