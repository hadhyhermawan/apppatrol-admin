'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import Pagination from '@/components/tables/Pagination';
import { RefreshCw, Search, Users, Edit, Trash2, Plus, X, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import SearchableSelect from '@/components/form/SearchableSelect';
import Swal from 'sweetalert2';

type UserItem = {
    id: number;
    name: string;
    username: string;
    email: string;
    role: string | null;
    created_at: string;
};

function UtilitiesUsersPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const perPage = 25;

    const [roles, setRoles] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState<any>({ name: '', username: '', email: '', password: '', role_id: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchRoles = async () => {
        try {
            const res: any = await apiClient.get('/utilities/roles');
            if (Array.isArray(res)) setRoles(res);
            else if (res && Array.isArray(res.data)) setRoles(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchData = async (currentPage = page) => {
        setLoading(true);
        try {
            let url = `/utilities/users?limit=${perPage}&page=${currentPage}`;
            if (searchTerm) url += `&search=${searchTerm}`;

            const response: any = await apiClient.get(url);
            if (response && response.data && Array.isArray(response.data)) {
                setData(response.data);
                if (response.meta) {
                    setTotalPages(response.meta.total_pages);
                    setTotalItems(response.meta.total_items);
                }
            } else if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (page !== 1 || searchTerm === '') fetchData(page);
    }, [page]);

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        setPage(1);
        const timer = setTimeout(() => {
            fetchData(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSave = async () => {
        if (!modalData.name || !modalData.username || !modalData.email) return;
        if (!isEditing && !modalData.password) return; // Password required on create

        setIsSubmitting(true);
        try {
            if (isEditing) {
                await apiClient.put(`/utilities/users/${modalData.id}`, modalData);
            } else {
                await apiClient.post('/utilities/users', modalData);
            }
            setShowModal(false);
            fetchData(page);
            Swal.fire({
                title: 'Berhasil!',
                text: isEditing ? 'Data berhasil diperbarui.' : 'Data berhasil disimpan.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error: any) {
            Swal.fire('Gagal!', error?.response?.data?.detail || "Terjadi kesalahan saat menyimpan data.", 'error');
            console.error("Save error", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus Data?',
            text: "Data user akan dihapus permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/utilities/users/${id}`);
            Swal.fire({
                title: 'Terhapus!',
                text: 'Data berhasil dihapus.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            fetchData(page);
        } catch (error: any) {
            console.error("Delete error", error);
            Swal.fire('Gagal!', error?.response?.data?.detail || "Gagal menghapus data.", 'error');
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setModalData({ name: '', username: '', email: '', password: '', role_id: '' });
        setShowModal(true);
    };

    const openEditModal = (user: any) => {
        setIsEditing(true);
        const roleMatch = roles.find(r => r.name.toLowerCase() === (user.role || '').toLowerCase() || (user.role === 'Super Admin' && r.name === 'super admin'));
        setModalData({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            password: '',
            role_id: roleMatch ? roleMatch.id : ''
        });
        setShowModal(true);
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Data Users" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-brand-500" />
                        Management Users
                    </h2>
                    <div className="flex gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari User..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500 text-sm"
                            />
                            <Search className="absolute right-4 top-3 h-4 w-4 text-gray-400" />
                        </div>
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate && (
                            <button onClick={openCreateModal} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-brand-600 transition shadow-sm">
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">User Baru</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Nama</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Username</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Email</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Role</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Bergabung</th>
                                {(canUpdate || canDelete) && <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Tidak ada data user.</td></tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(page - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <h5 className="font-semibold text-black dark:text-white text-sm">{item.name}</h5>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {item.username}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {item.email}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.role === 'Super Admin' || item.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {item.role || 'User'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center text-sm text-gray-500">
                                            {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                        {(canUpdate || canDelete) && (
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center space-x-2">
                                                    {canUpdate && (
                                                        <button onClick={() => openEditModal(item)} className="p-1.5 text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stroke pt-4 dark:border-strokedark">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Menampilkan {(page - 1) * perPage + 1} - {Math.min(page * perPage, totalItems)} dari {totalItems} data
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal CRUD */}
            {showModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-white dark:bg-boxdark sticky top-0 z-10">
                            <h3 className="text-lg font-bold text-black dark:text-white">
                                {isEditing ? 'Edit User' : 'Tambah User'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                            <div className="px-6 py-5 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Nama <span className="text-red-500">*</span></label>
                                    <input type="text" value={modalData.name} onChange={e => setModalData({ ...modalData, name: e.target.value })} className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input text-black dark:text-white" placeholder="Masukkan nama user" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Username <span className="text-red-500">*</span></label>
                                    <input type="text" value={modalData.username} onChange={e => setModalData({ ...modalData, username: e.target.value })} className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input text-black dark:text-white" placeholder="Masukkan username" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Email <span className="text-red-500">*</span></label>
                                    <input type="email" value={modalData.email} onChange={e => setModalData({ ...modalData, email: e.target.value })} className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input text-black dark:text-white" placeholder="Masukkan alamat email" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Password {isEditing ? <span className="font-normal text-xs text-brand-500">(Kosongi jika tidak diubah)</span> : <span className="text-red-500">*</span>}</label>
                                    <input type="password" value={modalData.password} onChange={e => setModalData({ ...modalData, password: e.target.value })} className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input text-black dark:text-white" placeholder="Masukkan password" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Role <span className="text-red-500">*</span></label>
                                    <SearchableSelect
                                        options={roles.map(r => ({ value: r.id.toString(), label: r.name }))}
                                        value={modalData.role_id?.toString() || ''}
                                        onChange={(val) => setModalData({ ...modalData, role_id: val })}
                                        placeholder="-- Pilih Role --"
                                        usePortal={true}
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 dark:bg-meta-4/30 flex justify-end gap-3 border-t border-stroke dark:border-strokedark sticky bottom-0 z-10">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-black bg-white border border-stroke rounded-lg hover:bg-gray-50 dark:border-strokedark dark:text-white dark:bg-meta-4 transition">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-opacity-90 flex items-center transition disabled:opacity-50">
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
export default withPermission(UtilitiesUsersPage, {
    permissions: ['users.index']
});
