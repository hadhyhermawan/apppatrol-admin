'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Plus, Search, Trash2, Edit, RefreshCw, DollarSign, ArrowLeft, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';

type Denda = {
    id: number;
    dari: number;
    sampai: number;
    denda: number;
};

function DendaPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<Denda[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(10);

    // Modal & Form States
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
        dari: 0,
        sampai: 0,
        denda: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res: any = await apiClient.get(`/denda`);
            setData(Array.isArray(res) ? res : []);
        } catch (error) {
            console.error(error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter & Pagination
    const filteredData = useMemo(() => {
        return data.filter(item =>
            item.denda.toString().includes(searchTerm) ||
            item.dari.toString().includes(searchTerm) ||
            item.sampai.toString().includes(searchTerm)
        );
    }, [data, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [filteredData, currentPage, perPage]);

    const totalPages = Math.ceil(filteredData.length / perPage);

    const handleCreate = () => {
        setIsEditing(false);
        setFormData({
            dari: 0,
            sampai: 0,
            denda: 0
        });
        setShowModal(true);
    };

    const handleEdit = (item: Denda) => {
        setFormData({
            dari: item.dari,
            sampai: item.sampai,
            denda: item.denda
        });
        setCurrentId(item.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = (id: number) => {
        Swal.fire({
            title: 'Hapus Data?',
            text: "Aturan denda ini akan dihapus permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/denda/${id}`);
                    Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
                    fetchData();
                } catch (error) {
                    Swal.fire('Gagal!', 'Gagal menghapus data.', 'error');
                }
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentId) {
                await apiClient.put(`/denda/${currentId}`, formData);
            } else {
                await apiClient.post('/denda', formData);
            }

            setShowModal(false);
            Swal.fire('Berhasil', 'Data berhasil disimpan', 'success');
            fetchData();
        } catch (error: any) {
            Swal.fire('Gagal', error.response?.data?.detail || 'Gagal menyimpan data', 'error');
        }
    };

    const formatRupiah = (angka: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Pengaturan Denda Keterlambatan" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-brand-500" />
                        Manajemen Aturan Denda
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {true && ( // Always show for testing or role
                            <button onClick={handleCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                                <Plus className="h-4 w-4" />
                                <span>Tambah Aturan</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari kisaran menit atau nilai denda..."
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
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Keterlambatan (Dari)</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Keterlambatan (Sampai)</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Nominal Denda</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Tidak ada aturan denda.</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.dari} Menit</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.sampai} Menit</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex rounded-full bg-red-100 text-red-800 px-3 py-1 text-xs font-semibold dark:bg-meta-4 dark:text-red-400">
                                                {formatRupiah(item.denda)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(item)} className="hover:text-yellow-500 text-gray-500 dark:text-gray-400" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {true && (
                                                    <button onClick={() => handleDelete(item.id)} className="hover:text-red-500 text-gray-500 dark:text-gray-400" title="Hapus">
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-999999 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl dark:bg-boxdark">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white text-2xl font-bold">✕</button>
                        <h3 className="mb-6 text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                            <DollarSign className="w-6 h-6 text-brand-500" />
                            {isEditing ? 'Edit Aturan Denda' : 'Tambah Aturan Denda'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-6 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-2.5 block text-black dark:text-white font-medium">Dari (Menit)</label>
                                        <input
                                            type="number"
                                            value={formData.dari}
                                            onChange={(e) => setFormData({ ...formData, dari: parseInt(e.target.value) || 0 })}
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4"
                                            required
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2.5 block text-black dark:text-white font-medium">Sampai (Menit)</label>
                                        <input
                                            type="number"
                                            value={formData.sampai}
                                            onChange={(e) => setFormData({ ...formData, sampai: parseInt(e.target.value) || 0 })}
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4"
                                            required
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white font-medium">Nominal Denda (Rp)</label>
                                    <input
                                        type="number"
                                        value={formData.denda}
                                        onChange={(e) => setFormData({ ...formData, denda: parseInt(e.target.value) || 0 })}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4"
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark">
                                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg bg-gray-200 px-6 py-2.5 font-medium text-black hover:bg-gray-300 transition">Batal</button>
                                <button type="submit" className="rounded-lg bg-brand-500 px-6 py-2.5 font-medium text-white hover:bg-opacity-90 transition shadow-sm">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

// Temporary remove permission wrapping for standard access
export default DendaPage;
