'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, Search, X, Save, Edit, Trash, ArrowLeft, ArrowRight, MoreHorizontal, MapPin } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import clsx from 'clsx';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';

type CabangItem = {
    kode_cabang: string;
    nama_cabang: string;
    alamat_cabang: string;
    telepon_cabang: string;
    lokasi_cabang: string;
    radius_cabang: number;
    kode_up3: string | null;
    created_at?: string;
    updated_at?: string;
};

function MasterCabangPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<CabangItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State (Client-side)
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<CabangItem>({
        kode_cabang: '',
        nama_cabang: '',
        alamat_cabang: '',
        telepon_cabang: '',
        lokasi_cabang: '',
        radius_cabang: 30,
        kode_up3: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get('/master/cabang');
            if (Array.isArray(response)) {
                setData(response);
            } else if (response.data && Array.isArray(response.data)) {
                setData(response.data);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch cabang", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter & Pagination Logic
    const filteredData = useMemo(() => {
        return data.filter(item =>
            item.nama_cabang.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.kode_cabang.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.alamat_cabang.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [filteredData, currentPage, perPage]);

    const totalPages = Math.ceil(filteredData.length / perPage);

    // Handlers
    const handleOpenCreate = () => {
        setErrorMsg('');
        setModalMode('create');
        setFormData({
            kode_cabang: '',
            nama_cabang: '',
            alamat_cabang: '',
            telepon_cabang: '',
            lokasi_cabang: '',
            radius_cabang: 30,
            kode_up3: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: CabangItem) => {
        setErrorMsg('');
        setModalMode('edit');
        setFormData({ ...item });
        setEditingId(item.kode_cabang);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        // Basic validation
        if (!formData.kode_cabang.trim() || !formData.nama_cabang.trim() || !formData.lokasi_cabang.trim()) {
            setErrorMsg('Harap isi kolom kode, nama, dan titik koordinat.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (modalMode === 'create') {
                await apiClient.post('/master/cabang', formData);
            } else {
                await apiClient.put(`/master/cabang/${editingId}`, formData);
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

    const handleDelete = async (kode_cabang: string) => {
        const result = await Swal.fire({
            title: 'Apakah Anda Yakin?',
            text: `Data cabang ${kode_cabang} akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/master/cabang/${kode_cabang}`);
            Swal.fire({
                title: 'Terhapus!',
                text: 'Data cabang berhasil dihapus.',
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
            <PageBreadcrumb pageTitle="Data Cabang" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                        Daftar Cabang
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('cabang') && (
                            <button onClick={handleOpenCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                                <Plus className="h-4 w-4" />
                                <span>Tambah Data</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative col-span-1 md:col-span-2">
                        <input
                            type="text"
                            placeholder="Cari cabang, alamat, kode..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset page on search
                            }}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        />
                        <Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Kode Cabang</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Nama Cabang</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Alamat</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Koordinat</th>
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
                                    <tr key={idx} className="border-b border-stroke dark:border-strokedark">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex rounded bg-gray-100 px-2 py-1 text-sm font-medium text-black dark:bg-meta-4 dark:text-white">
                                                {item.kode_cabang}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <h5 className="font-medium text-black dark:text-white text-sm">{item.nama_cabang}</h5>
                                            <p className="text-xs text-gray-500">{item.telepon_cabang}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm truncate max-w-[200px]">{item.alamat_cabang}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <a href={`https://www.google.com/maps/search/?api=1&query=${item.lokasi_cabang}`} target="_blank" className="flex items-center gap-1 text-sm text-brand-500 hover:underline">
                                                <MapPin className="h-3 w-3" />
                                                {item.lokasi_cabang.split(',').map(c => parseFloat(c).toFixed(4)).join(', ')}
                                            </a>
                                            <p className="text-xs text-gray-500">Radius: {item.radius_cabang}m</p>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {canUpdate('cabang') && (
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:text-brand-500 text-gray-500 dark:text-gray-400">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {canDelete('cabang') && (
                                                    <button onClick={() => handleDelete(item.kode_cabang)} className="hover:text-red-500 text-gray-500 dark:text-gray-400">
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
                {filteredData.length > 0 && (
                    <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stroke pt-4 dark:border-strokedark">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, filteredData.length)} dari {filteredData.length} data
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
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center sticky top-0 bg-white dark:bg-boxdark z-10">
                            <h3 className="text-lg font-bold text-black dark:text-white">
                                {modalMode === 'create' ? 'Tambah Cabang' : 'Edit Cabang'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-5 space-y-4">
                                {errorMsg && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30">
                                        {errorMsg}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Kode Cabang</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500 disabled:bg-gray-100 dark:disabled:bg-black/20"
                                            placeholder="Contoh: HO"
                                            value={formData.kode_cabang}
                                            onChange={e => setFormData({ ...formData, kode_cabang: e.target.value })}
                                            maxLength={3}
                                            disabled={modalMode === 'edit'}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Nama Cabang</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                            placeholder="Contoh: HEAD OFFICE"
                                            value={formData.nama_cabang}
                                            onChange={e => setFormData({ ...formData, nama_cabang: e.target.value })}
                                            maxLength={50}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Alamat Lengkap</label>
                                    <textarea
                                        rows={2}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                        placeholder="Jl. Contoh No. 123, Jakarta Selatan"
                                        value={formData.alamat_cabang}
                                        onChange={e => setFormData({ ...formData, alamat_cabang: e.target.value })}
                                        maxLength={100}
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">No. Telepon</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                            placeholder="021-12345678"
                                            value={formData.telepon_cabang}
                                            onChange={e => setFormData({ ...formData, telepon_cabang: e.target.value })}
                                            maxLength={13}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Kode UP3 (Opsional)</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                            placeholder="PLN UP3..."
                                            value={formData.kode_up3 || ''}
                                            onChange={e => setFormData({ ...formData, kode_up3: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Titik Koordinat (Lat, Long)</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                            placeholder="-6.200000, 106.816666"
                                            value={formData.lokasi_cabang}
                                            onChange={e => setFormData({ ...formData, lokasi_cabang: e.target.value })}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Format: Latitude, Longitude</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Radius Absensi (meter)</label>
                                        <input
                                            type="number"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                            placeholder="30"
                                            value={formData.radius_cabang}
                                            onChange={e => setFormData({ ...formData, radius_cabang: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 bg-gray-50 dark:bg-meta-4/30 flex justify-end gap-3 border-t border-stroke dark:border-strokedark sticky bottom-0 z-10">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-sm font-medium text-black dark:text-white bg-white dark:bg-meta-4 border border-stroke dark:border-strokedark rounded-lg hover:bg-gray-50 dark:hover:bg-opacity-90 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-opacity-90 transition flex items-center shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <span className="animate-spin mr-2 border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Simpan
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
export default withPermission(MasterCabangPage, {
    permissions: ['cabang.index']
});
