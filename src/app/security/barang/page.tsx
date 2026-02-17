'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, Search, X, Save, Edit, Trash, ArrowLeft, ArrowRight, Package, Calendar } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';

type BarangItem = {
    id_barang: number;
    jenis_barang: string;
    dari: string;
    untuk: string;
    kode_cabang: string | null;
    penerima: string | null;
    image: string | null;
    foto_keluar: string | null;
    created_at?: string;
    updated_at?: string;
};

type CabangOption = { code: string; name: string };

function SecurityBarangPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<BarangItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    const [cabangOptions, setCabangOptions] = useState<CabangOption[]>([]);

    // Pagination State (Client-side initially)
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<{
        id_barang: number;
        jenis_barang: string;
        dari: string;
        untuk: string;
        kode_cabang: string;
        penerima: string;
        image: string;
        foto_keluar: string;
    }>({
        id_barang: 0,
        jenis_barang: '',
        dari: '',
        untuk: '',
        kode_cabang: '',
        penerima: '',
        image: '',
        foto_keluar: ''
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchOptions = async () => {
        try {
            const resOpts: any = await apiClient.get('/master/options');
            if (resOpts && resOpts.cabang) {
                setCabangOptions(resOpts.cabang);
            }
        } catch (error) {
            console.error("Failed to fetch options", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/security/barang?';
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
            console.error("Failed to fetch barang data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOptions();
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
        setFormData({
            id_barang: 0,
            jenis_barang: '',
            dari: '',
            untuk: '',
            kode_cabang: '',
            penerima: '',
            image: '',
            foto_keluar: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: BarangItem) => {
        setErrorMsg('');
        setModalMode('edit');
        setFormData({
            id_barang: item.id_barang,
            jenis_barang: item.jenis_barang,
            dari: item.dari,
            untuk: item.untuk,
            kode_cabang: item.kode_cabang || '',
            penerima: item.penerima || '',
            image: item.image || '',
            foto_keluar: item.foto_keluar || ''
        });
        setEditingId(item.id_barang);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.jenis_barang || !formData.dari || !formData.untuk) {
            setErrorMsg('Harap isi Jenis, Dari, dan Untuk.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                kode_cabang: formData.kode_cabang || null,
                penerima: formData.penerima || null,
                image: formData.image || null,
                foto_keluar: formData.foto_keluar || null
            };

            if (modalMode === 'create') {
                await apiClient.post('/security/barang', payload);
            } else {
                await apiClient.put(`/security/barang/${editingId}`, payload);
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
            text: `Data log barang ini akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/security/barang/${id}`);
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
            <PageBreadcrumb pageTitle="Log Book Barang" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                        Daftar Log Barang
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('barang') && (
                            <button onClick={handleOpenCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                            <Plus className="h-4 w-4" />
                            <span>Tambah Data</span>
                        </button>
                        )}
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="relative col-span-2">
                        <input
                            type="text"
                            placeholder="Cari jenis, dari, atau untuk..."
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
                        <input
                            type="datetime-local"
                            value={dateStart}
                            onChange={e => setDateStart(e.target.value)}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500 text-sm"
                        />
                    </div>
                    <div>
                        <input
                            type="datetime-local"
                            value={dateEnd}
                            onChange={e => setDateEnd(e.target.value)}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500 text-sm"
                        />
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Jenis Barang</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Logistik</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Waktu & Penerima</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Foto</th>
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
                                    <tr key={item.id_barang} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex bg-orange-100 h-10 w-10 min-w-10 items-center justify-center rounded-full text-orange-600">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-black dark:text-white text-sm">{item.jenis_barang}</h5>
                                                    <p className="text-xs text-gray-500">ID: {item.id_barang}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="grid gap-1">
                                                <div className="flex items-center gap-1"><span className="text-gray-500 w-12">Dari</span>: <span className="font-medium">{item.dari}</span></div>
                                                <div className="flex items-center gap-1"><span className="text-gray-500 w-12">Untuk</span>: <span className="font-medium">{item.untuk}</span></div>
                                                {item.kode_cabang && <div className="text-xs text-gray-400 mt-1">Cabang: {item.kode_cabang}</div>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="text-gray-600">
                                                {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}
                                            </div>
                                            {item.penerima && (
                                                <div className="text-xs text-brand-600 font-medium mt-1">
                                                    Penerima: {item.penerima}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center text-sm">
                                            <div className="flex flex-col gap-1 items-center">
                                                {item.image ? (
                                                    <a href={item.image} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs">Msk</a>
                                                ) : null}
                                                {item.foto_keluar ? (
                                                    <a href={item.foto_keluar} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline text-xs">Klr</a>
                                                ) : null}
                                                {!item.image && !item.foto_keluar && <span className="text-xs text-gray-400">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {canUpdate('barang') && (
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:text-yellow-500 text-gray-500 dark:text-gray-400">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                )}
                                                {canDelete('barang') && (
                                                    <button onClick={() => handleDelete(item.id_barang)} className="hover:text-red-500 text-gray-500 dark:text-gray-400">
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
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center sticky top-0 bg-white dark:bg-boxdark z-10">
                            <h3 className="text-lg font-bold text-black dark:text-white">
                                {modalMode === 'create' ? 'Tambah Log Barang' : 'Edit Log Barang'}
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
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Jenis Barang</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                        placeholder="Contoh: Paket Dokumen"
                                        value={formData.jenis_barang}
                                        onChange={e => setFormData({ ...formData, jenis_barang: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Dari</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.dari}
                                            onChange={e => setFormData({ ...formData, dari: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Untuk</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.untuk}
                                            onChange={e => setFormData({ ...formData, untuk: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Penerima</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.penerima}
                                            onChange={e => setFormData({ ...formData, penerima: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Cabang (Opsional)</label>
                                        <select
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.kode_cabang}
                                            onChange={e => setFormData({ ...formData, kode_cabang: e.target.value })}
                                        >
                                            <option value="">Pilih Cabang</option>
                                            {cabangOptions.map(opt => (
                                                <option key={opt.code} value={opt.code}>{opt.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Foto Masuk (URL)</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                        placeholder="https://..."
                                        value={formData.image}
                                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Foto Keluar (URL)</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                        placeholder="https://..."
                                        value={formData.foto_keluar}
                                        onChange={e => setFormData({ ...formData, foto_keluar: e.target.value })}
                                    />
                                </div>

                            </div>

                            <div className="px-6 py-4 bg-gray-50 dark:bg-meta-4/30 flex justify-end gap-3 border-t border-stroke dark:border-strokedark sticky bottom-0 z-10">
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
export default withPermission(SecurityBarangPage, {
    permissions: ['barang.index']
});
