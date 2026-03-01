'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, Search, X, Save, Edit, Trash, ArrowLeft, ArrowRight, MoreHorizontal } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import clsx from 'clsx';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';

type VendorItem = {
    id: number;
    nama_vendor: string;
    alamat?: string;
    kontak?: string;
    is_active: number;
    created_at?: string;
};

function MasterVendorPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<VendorItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State (Client-side)
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState({
        nama_vendor: '', alamat: '', kontak: '',
        admin_name: '', admin_username: '', admin_email: '', admin_password: '',
        is_active: true
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get('/vendors');
            // Check response structure
            if (Array.isArray(response)) {
                setData(response);
            } else if (response.data && Array.isArray(response.data)) {
                setData(response.data);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch vendors", error);
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
            item.nama_vendor.toLowerCase().includes(searchTerm.toLowerCase())
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
            nama_vendor: '', alamat: '', kontak: '',
            admin_name: '', admin_username: '', admin_email: '', admin_password: '',
            is_active: true
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: VendorItem) => {
        setErrorMsg('');
        setModalMode('edit');
        setFormData({
            nama_vendor: item.nama_vendor,
            alamat: item.alamat || '',
            kontak: item.kontak || '',
            is_active: item.is_active === 1,
            admin_name: '', admin_username: '', admin_email: '', admin_password: ''
        } as any);
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (modalMode === 'create') {
            if (!formData.nama_vendor.trim() || !formData.admin_username.trim() || !formData.admin_password.trim()) {
                setErrorMsg('Harap isi nama vendor, dan kredensial admin (username/password wajib).');
                return;
            }
        } else {
            if (!formData.nama_vendor.trim()) {
                setErrorMsg('Harap isi nama vendor.');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            if (modalMode === 'create') {
                await apiClient.post('/vendors', formData);
            } else {
                // Ensure we pass back is_active correctly
                const payload = {
                    ...formData,
                    is_active: formData.is_active ? 1 : 0
                };
                await apiClient.put(`/vendors/${editingId}`, payload);
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
            text: `Data vendor tersebut akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/vendors/${id}`);
            Swal.fire({
                title: 'Terhapus!',
                text: 'Data vendor berhasil dihapus.',
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
            <PageBreadcrumb pageTitle="Data Vendor" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                        Daftar Vendor
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('departemen') && (
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
                            placeholder="Cari vendor..."
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
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Nama Vendor</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Kontak</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Alamat</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={idx} className="border-b border-stroke dark:border-strokedark">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <h5 className="font-medium text-brand-500 text-sm">{item.nama_vendor}</h5>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.kontak || '-'}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.alamat || '-'}</p>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {item.is_active === 1 ? (
                                                <span className="inline-flex rounded-full bg-success bg-opacity-10 py-1 px-3 text-sm font-medium text-success">
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-danger bg-opacity-10 py-1 px-3 text-sm font-medium text-danger">
                                                    Nonaktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {canUpdate('vendors') && (
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:text-brand-500 text-gray-500 dark:text-gray-400">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {canDelete('vendors') && (
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

            {/* MODAL (Kept internal for simplicity and matching existing structure) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center">
                            <h3 className="text-lg font-bold text-black dark:text-white">
                                {modalMode === 'create' ? 'Tambah Vendor Baru' : 'Edit Vendor'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                {errorMsg && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30">
                                        {errorMsg}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Nama Vendor</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                        placeholder="Contoh: PT. Keamanan Abadi"
                                        value={formData.nama_vendor}
                                        onChange={e => setFormData({ ...formData, nama_vendor: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Alamat Vendor</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                        placeholder="Alamat kantor..."
                                        value={formData.alamat}
                                        onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Kontak</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                        placeholder="No HP / Email"
                                        value={formData.kontak}
                                        onChange={e => setFormData({ ...formData, kontak: e.target.value })}
                                    />
                                </div>

                                {modalMode === 'create' && (
                                    <>
                                        <hr className="my-4 border-stroke dark:border-strokedark" />
                                        <h4 className="font-semibold text-black dark:text-white">Akun Admin Vendor</h4>
                                        <p className="text-xs text-gray-500 mb-2">Akun pertama kali untuk vendor manager</p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Nama Admin</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm outline-none transition focus:border-brand-500"
                                                    value={formData.admin_name}
                                                    onChange={e => setFormData({ ...formData, admin_name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Email</label>
                                                <input
                                                    type="email"
                                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm outline-none transition focus:border-brand-500"
                                                    value={formData.admin_email}
                                                    onChange={e => setFormData({ ...formData, admin_email: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Username</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm outline-none transition focus:border-brand-500"
                                                    value={formData.admin_username}
                                                    onChange={e => setFormData({ ...formData, admin_username: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Password</label>
                                                <input
                                                    type="password"
                                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm outline-none transition focus:border-brand-500"
                                                    value={formData.admin_password}
                                                    onChange={e => setFormData({ ...formData, admin_password: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {modalMode === 'edit' && (
                                    <>
                                        <hr className="my-4 border-stroke dark:border-strokedark" />
                                        <div className="flex flex-col gap-3">
                                            <label className="block text-sm font-semibold text-black dark:text-white">Status Lisensi Vendor</label>
                                            <label className="relative inline-flex items-center cursor-pointer max-w-max">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={(formData as any).is_active}
                                                    onChange={() => setFormData({ ...formData, is_active: !(formData as any).is_active })}
                                                />
                                                <div className="w-14 h-8 bg-red-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[24px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                                                <span className="ml-3 text-sm font-bold text-gray-900 dark:text-gray-300">
                                                    {(formData as any).is_active ? "Aktif (Lisensi Bekerja)" : "Blokir (Dihentikan)"}
                                                </span>
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Peringatan: Menonaktifkan lisensi vendor akan secara instan **memblokir** seluruh Satpam yang bernaung di bawah Vendor ini dari aplikasi Web maupun Android.
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 bg-gray-50 dark:bg-meta-4/30 flex justify-end gap-3 border-t border-stroke dark:border-strokedark">
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
export default withPermission(MasterVendorPage, {
    permissions: [] // or specific super admin permission if you have one
});
