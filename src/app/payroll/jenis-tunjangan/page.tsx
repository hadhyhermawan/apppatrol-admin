'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, Search, X, Save, Edit, Trash, ArrowLeft, ArrowRight, Trash2, List } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';

type JenistunjanganItem = {
    kode_jenis_tunjangan: string;
    jenis_tunjangan: string;
};

function PayrollJenisTunjanganPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<JenistunjanganItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<{
        kode_jenis_tunjangan: string;
        jenis_tunjangan: string;
    }>({
        kode_jenis_tunjangan: '',
        jenis_tunjangan: '',
    });
    const [editingKode, setEditingKode] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get('/payroll/jenis-tunjangan');
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch jenis tunjangan", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter(item =>
        item.kode_jenis_tunjangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jenis_tunjangan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
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
            kode_jenis_tunjangan: '',
            jenis_tunjangan: '',
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: JenistunjanganItem) => {
        setErrorMsg('');
        setModalMode('edit');
        setFormData({
            kode_jenis_tunjangan: item.kode_jenis_tunjangan,
            jenis_tunjangan: item.jenis_tunjangan,
        });
        setEditingKode(item.kode_jenis_tunjangan);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.kode_jenis_tunjangan || !formData.jenis_tunjangan) {
            setErrorMsg('Harap isi Kode dan Jenis Tunjangan.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (modalMode === 'create') {
                await apiClient.post('/payroll/jenis-tunjangan', formData);
            } else {
                await apiClient.put(`/payroll/jenis-tunjangan/${editingKode}`, formData);
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

    const handleDelete = async (kode: string) => {
        const result = await Swal.fire({
            title: 'Hapus Data?',
            text: "Data akan dihapus permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/payroll/jenis-tunjangan/${kode}`);
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
            <PageBreadcrumb pageTitle="Jenis Tunjangan" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2 mb-1">
                            <List className="w-6 h-6 text-brand-500" />
                            Daftar Jenis Tunjangan
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Kelola daftar jenis tunjangan yang tersedia
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('jenistunjangan') && (
                            <button onClick={handleOpenCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm whitespace-nowrap">
                                <Plus className="h-4 w-4" />
                                <span>Tambah Baru</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="relative col-span-1 md:col-span-2">
                        <input
                            type="text"
                            placeholder="Cari Kode atau Jenis Tunjangan..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
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
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Kode</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Jenis Tunjangan</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                    {searchTerm ? `Tidak ditemukan data untuk "${searchTerm}"` : 'Tidak ada data ditemukan.'}
                                </td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.kode_jenis_tunjangan} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20 align-top transition-colors">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4 text-black dark:text-white">
                                            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.kode_jenis_tunjangan}</span>
                                        </td>
                                        <td className="px-4 py-4 text-black dark:text-white text-sm">
                                            {item.jenis_tunjangan}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {canUpdate('jenistunjangan') && (
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:text-brand-500 text-gray-500 transition-colors" title="Edit">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {canDelete('jenistunjangan') && (
                                                    <button onClick={() => handleDelete(item.kode_jenis_tunjangan)} className="hover:text-red-500 text-gray-500 transition-colors" title="Hapus">
                                                        <Trash2 className="h-4 w-4" />
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
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4 shrink-0">
                            <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                                <List className="w-5 h-5 text-brand-500" />
                                {modalMode === 'create' ? 'Tambah Jenis Tunjangan' : 'Edit Jenis Tunjangan'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-5">
                                {errorMsg && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                                        {errorMsg}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Kode Jenis Tunjangan</label>
                                    <input
                                        type="text"
                                        maxLength={4}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input text-black dark:text-white"
                                        placeholder="Maks 4 Karakter (e.g., T001)"
                                        value={formData.kode_jenis_tunjangan}
                                        onChange={e => setFormData({ ...formData, kode_jenis_tunjangan: e.target.value })}
                                        disabled={modalMode === 'edit'}
                                    />
                                    {modalMode === 'edit' && <p className="text-xs text-gray-400 mt-1">Kode tidak dapat diubah saat mengedit.</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Jenis Tunjangan</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input text-black dark:text-white"
                                        placeholder="Nama Tunjangan"
                                        value={formData.jenis_tunjangan}
                                        onChange={e => setFormData({ ...formData, jenis_tunjangan: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-stroke dark:border-strokedark flex justify-end gap-3 bg-gray-50 dark:bg-meta-4 shrink-0">
                                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-boxdark dark:text-gray-300 dark:border-strokedark dark:hover:bg-meta-4 transition-colors">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2 transition-colors">
                                    {isSubmitting ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Simpan</span>
                                        </>
                                    )}
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
export default withPermission(PayrollJenisTunjanganPage, {
    permissions: ['jenistunjangan.index']
});
