'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, Search, X, Save, Edit, Trash, ArrowLeft, ArrowRight, ClipboardList, MapPin } from 'lucide-react';
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

type TaskItem = {
    id: number;
    nik: string;
    kode_dept: string;
    tanggal: string;
    jam_tugas: string;
    status: string;
    kode_jam_kerja: string | null;
    foto_absen: string | null;
    lokasi_absen: string | null;
    completed_at: string | null;
    nama_petugas: string | null;
};

type KaryawanOption = {
    nik: string;
    nama_karyawan: string;
};

function CleaningTasksPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    // Hardcoded Dept Code for Cleaning/UCS
    const KODE_DEPT = 'UCS';

    const [data, setData] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [karyawanList, setKaryawanList] = useState<KaryawanOption[]>([]);

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
        jam_tugas: string;
        status: string;
        kode_jam_kerja: string;
        lokasi_absen: string;
    }>({
        id: 0,
        nik: '',
        tanggal: '',
        jam_tugas: '',
        status: 'active',
        kode_jam_kerja: '',
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

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `/security/tasks?kode_dept=${KODE_DEPT}&`;
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
            console.error("Failed to fetch tasks data", error);
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
        }, 500);
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
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 8);

        setFormData({
            id: 0,
            nik: '',
            tanggal: dateStr,
            jam_tugas: timeStr,
            status: 'active',
            kode_jam_kerja: 'S1',
            lokasi_absen: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: TaskItem) => {
        setErrorMsg('');
        setModalMode('edit');
        setFormData({
            id: item.id,
            nik: item.nik,
            tanggal: item.tanggal,
            jam_tugas: item.jam_tugas,
            status: item.status,
            kode_jam_kerja: item.kode_jam_kerja || '',
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

        if (!formData.nik || !formData.tanggal || !formData.jam_tugas) {
            setErrorMsg('Harap isi Petugas, Tanggal, dan Jam Tugas.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                kode_dept: KODE_DEPT,
                foto_absen: null, // Basic crud doesn't handle file upload yet
                lokasi_absen: formData.lokasi_absen || null
            };

            if (modalMode === 'create') {
                await apiClient.post('/security/tasks', payload);
            } else {
                await apiClient.put(`/security/tasks/${editingId}`, payload);
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
            text: `Data tugas ini akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/security/tasks/${id}`);
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
            <PageBreadcrumb pageTitle="Tugas Cleaning" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                        Monitoring Tugas Cleaning (UCS)
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('cleaning') && (
                            <button onClick={handleOpenCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                                <Plus className="h-4 w-4" />
                                <span>Tambah Tugas</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
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
                            onChange={(dates, str) => setDateStart(str)}
                        />
                    </div>
                    <div>
                        <DatePicker
                            id="filter-date-end"
                            placeholder="Sampai Tanggal"
                            defaultDate={dateEnd}
                            onChange={(dates, str) => setDateEnd(str)}
                        />
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Petugas</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Waktu Tugas</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Lokasi & Shift</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
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
                                                <div className="flex bg-cyan-100 h-10 w-10 min-w-10 items-center justify-center rounded-full text-cyan-600">
                                                    <ClipboardList size={20} />
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-black dark:text-white text-sm">{item.nama_petugas || item.nik}</h5>
                                                    <p className="text-xs text-gray-500">NIK: {item.nik}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-black dark:text-white">{item.tanggal}</span>
                                                <span className="text-gray-500 text-xs">Jam: {item.jam_tugas}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="flex flex-col gap-1">
                                                {item.lokasi_absen && (
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <MapPin size={12} className="text-red-500" />
                                                        <span className="truncate max-w-[150px]">{item.lokasi_absen}</span>
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
                                            <div className="flex items-center justify-center gap-2">
                                                {canUpdate('cleaning') && (
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:text-yellow-500 text-gray-500 dark:text-gray-400">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {canDelete('cleaning') && (
                                                    <button onClick={() => handleDelete(item.id)} className="hover:text-red-500 text-gray-500 dark:text-gray-400">
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
                                {modalMode === 'create' ? 'Tambah Tugas Cleaning' : 'Edit Tugas Cleaning'}
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
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Petugas (UCS) <span className="text-red-500">*</span></label>
                                    <SearchableSelect
                                        options={karyawanList.map(k => ({ value: k.nik, label: `${k.nama_karyawan} (${k.nik})` }))}
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
                                            onChange={(dates, str) => setFormData({ ...formData, tanggal: str })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Jam Tugas</label>
                                        <DatePicker
                                            id="form-jam"
                                            mode="time"
                                            enableTime
                                            dateFormat="H:i"
                                            placeholder="Pilih Jam"
                                            defaultDate={formData.jam_tugas}
                                            onChange={(dates, str) => setFormData({ ...formData, jam_tugas: str })}
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
export default withPermission(CleaningTasksPage, {
    permissions: ['cleaning.index']
});
