'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, Edit, Trash, FileText, CheckCircle2, Circle } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { usePermissions } from '@/contexts/PermissionContext';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

type PrivacyItem = {
    id: number;
    title: string;
    content: string;
    version: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
};

export default function AccountDeletionPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions(); // Optional
    const [data, setData] = useState<PrivacyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchData = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get('/account-deletion');
            if (Array.isArray(response)) {
                setData(response);
            } else if (response.data && Array.isArray(response.data)) {
                setData(response.data);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch account deletion policy", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenCreate = () => {
        router.push('/settings/hapus-akun/create');
    };

    const handleOpenEdit = (item: PrivacyItem) => {
        router.push(`/settings/hapus-akun/edit/${item.id}`);
    };

    const handleDelete = async (itemId: number) => {
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
            await apiClient.delete(`/account-deletion/${itemId}`);
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

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        try {
            return format(new Date(dateStr), "dd MMM yyyy HH:mm", { locale: id });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Kebijakan Penghapusan Akun" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-black dark:text-white">
                            Kelola Kebijakan Penghapusan Akun
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Hanya 1 (satu) dokumen kebijakan penghapusan akun yang dapat berstatus <strong className="text-green-600">Aktif</strong>.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button onClick={handleOpenCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                            <Plus className="h-4 w-4" />
                            <span>Tambah Data</span>
                        </button>
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Informasi Dokumen</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Terakhir Diubah</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Belum ada data Kebijakan Penghapusan Akun.</td></tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={idx} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20 transition">
                                        <td className="px-4 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-black dark:text-white line-clamp-1">{item.title}</h5>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Versi: {item.version}</p>
                                                    <p className="text-xs text-gray-400 mt-1 line-clamp-1 max-w-[300px]">{item.content.replace(/<[^>]+>/g, ' ')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {item.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle2 size={14} /> Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 dark:bg-meta-4 dark:text-gray-400">
                                                    <Circle size={14} /> Arsip
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-sm text-black dark:text-white">{formatDate(item.updated_at)}</p>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleOpenEdit(item)} className="p-2 hover:bg-gray-100 rounded-lg hover:text-brand-500 text-gray-500 dark:text-gray-400 transition" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-gray-100 rounded-lg hover:text-red-500 text-gray-500 dark:text-gray-400 transition" title="Hapus">
                                                    <Trash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    );
}
