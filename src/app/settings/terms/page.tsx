'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, X, Save, Edit, Trash, FileText, CheckCircle2, Circle } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { usePermissions } from '@/contexts/PermissionContext';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

type TermsItem = {
    id: number;
    title: string;
    content: string;
    version: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
};

export default function TermsPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions(); // Optional, assuming true for superadmin
    const [data, setData] = useState<TermsItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState({ title: '', content: '', version: '', is_active: false });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get('/terms');
            if (Array.isArray(response)) {
                setData(response);
            } else if (response.data && Array.isArray(response.data)) {
                setData(response.data);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch terms", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handlers
    const handleOpenCreate = () => {
        setErrorMsg('');
        setModalMode('create');
        setFormData({ title: '', content: '', version: '', is_active: true });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: TermsItem) => {
        setErrorMsg('');
        setModalMode('edit');
        setFormData({
            title: item.title,
            content: item.content,
            version: item.version,
            is_active: item.is_active
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
        if (!formData.title.trim() || !formData.content.trim() || !formData.version.trim()) {
            setErrorMsg('Harap isi judul, konten, dan versi.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (modalMode === 'create') {
                await apiClient.post('/terms', formData);
            } else {
                await apiClient.put(`/terms/${editingId}`, formData);
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
            await apiClient.delete(`/terms/${id}`);
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
            <PageBreadcrumb pageTitle="Syarat & Ketentuan" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-black dark:text-white">
                            Kelola Syarat & Ketentuan
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Hanya 1 (satu) dokumen yang dapat berstatus <strong className="text-green-600">Aktif</strong> pada satu waktu.
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
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Belum ada data Syarat & Ketentuan.</td></tr>
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
                                                    <p className="text-xs text-gray-400 mt-1 line-clamp-1 max-w-[300px]">{item.content}</p>
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

            {/* MODAL EDITOR */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center">
                            <h3 className="text-lg font-bold text-black dark:text-white">
                                {modalMode === 'create' ? 'Tulis Syarat & Ketentuan Baru' : 'Edit Syarat & Ketentuan'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body (Scrollable) */}
                        <div className="flex-1 overflow-y-auto w-full p-6">
                            <form id="termsForm" onSubmit={handleSubmit} className="space-y-5">
                                {errorMsg && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                                        {errorMsg}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Judul Dokumen</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input dsabled:bg-gray-100"
                                            placeholder="Contoh: Syarat & Ketentuan Operasional"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Versi</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            placeholder="Contoh: v1.0.1"
                                            value={formData.version}
                                            onChange={e => setFormData({ ...formData, version: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                                        Konten Aturan (Bisa multi-paragraf)
                                    </label>
                                    <textarea
                                        rows={12}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                        placeholder="Tulis seluruh poin-poin syarat dan ketentuan di sini..."
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                    <input
                                        type="checkbox"
                                        id="isActiveToggle"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                                    />
                                    <label htmlFor="isActiveToggle" className="text-sm font-medium text-black dark:text-white cursor-pointer select-none">
                                        Setel sebagai <strong>Dokumen Aktif (Live)</strong>
                                        <p className="font-normal text-xs text-blue-600 dark:text-blue-400 mt-0.5">Mencentang ini akan otomatis menonaktifkan versi lainnya.</p>
                                    </label>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 dark:bg-meta-4/30 flex justify-end gap-3 border-t border-stroke dark:border-strokedark">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="px-5 py-2.5 text-sm font-medium text-black dark:text-white bg-white border border-stroke rounded-lg hover:bg-gray-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                form="termsForm"
                                disabled={isSubmitting}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-opacity-90 flex items-center shadow-sm disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    <span className="animate-spin mr-2 border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                Simpan Syarat & Ketentuan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
