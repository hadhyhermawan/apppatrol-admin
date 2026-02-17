'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Plus, Edit, Trash2, Calendar, Users, ArrowRight, Save, AlertCircle, X } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { Modal } from "@/components/ui/modal";
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';

type PenyesuaianGajiItem = {
    kode_penyesuaian_gaji: string;
    bulan: number;
    tahun: number;
    created_at: string;
    updated_at: string;
};

function PayrollPenyesuaianGajiPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<PenyesuaianGajiItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState({
        bulan: new Date().getMonth() + 1,
        tahun: new Date().getFullYear(),
        kode_penyesuaian_gaji: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get(`/payroll/penyesuaian-gaji?tahun=${year}`);
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch penyesuaian gaji", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [year]);

    const openCreateModal = () => {
        setModalMode('create');
        setFormData({
            bulan: new Date().getMonth() + 1,
            tahun: new Date().getFullYear(),
            kode_penyesuaian_gaji: ''
        });
        setError('');
        setIsModalOpen(true);
    };

    const openEditModal = (item: PenyesuaianGajiItem) => {
        setModalMode('edit');
        setFormData({
            bulan: item.bulan,
            tahun: item.tahun,
            kode_penyesuaian_gaji: item.kode_penyesuaian_gaji
        });
        setError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            if (modalMode === 'create') {
                await apiClient.post('/payroll/penyesuaian-gaji', {
                    bulan: formData.bulan,
                    tahun: formData.tahun
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Data telah disimpan.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await apiClient.put(`/payroll/penyesuaian-gaji/${formData.kode_penyesuaian_gaji}`, {
                    bulan: formData.bulan,
                    tahun: formData.tahun
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Data telah diperbarui.',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            closeModal();
            fetchData();
        } catch (error: any) {
            setError(error.response?.data?.detail || 'Terjadi kesalahan saat menyimpan data.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (kode: string) => {
        Swal.fire({
            title: 'Hapus Data?',
            text: "Data akan dihapus permanen beserta detailnya!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/payroll/penyesuaian-gaji/${kode}`);
                    Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
                    fetchData();
                } catch (error) {
                    Swal.fire('Gagal!', 'Gagal menghapus data.', 'error');
                }
            }
        });
    };

    const getMonthName = (month: number) => {
        return new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' });
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Penyesuaian Gaji" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-brand-500" />
                        Periode Penyesuaian Gaji
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={fetchData} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button onClick={openCreateModal} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                            <Plus className="h-4 w-4" />
                            <span>Tambah Periode</span>
                        </button>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="mb-6 flex items-center gap-4">
                    <div className="relative">
                        <label className="text-sm font-medium mb-1 block text-gray-500">Filter Tahun</label>
                        <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="w-32 rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500 dark:text-white"
                        />
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Kode</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Bulan</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Tahun</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Kelola</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan.</td></tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.kode_penyesuaian_gaji} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-black dark:text-white font-mono">
                                            {item.kode_penyesuaian_gaji}
                                        </td>
                                        <td className="px-4 py-4 text-black dark:text-white">
                                            {getMonthName(item.bulan)}
                                        </td>
                                        <td className="px-4 py-4 text-black dark:text-white">
                                            {item.tahun}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <Link href={`/payroll/penyesuaian-gaji/${item.kode_penyesuaian_gaji}`} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
                                                <Users className="h-3.5 w-3.5" />
                                                Kelola Karyawan
                                                <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEditModal(item)} className="hover:text-brand-500 text-gray-500 transition-colors" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {canDelete('penyesuaiangaji') && (
                                                    <button onClick={() => handleDelete(item.kode_penyesuaian_gaji)} className="hover:text-red-500 text-gray-500 transition-colors" title="Hapus">
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
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-md p-6">
                <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                                {modalMode === 'create' ? 'Tambah Periode Baru' : 'Edit Periode'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {modalMode === 'create'
                                    ? 'Silakan pilih bulan dan tahun untuk periode penyesuaian gaji baru.'
                                    : 'Ubah detail periode penyesuaian gaji.'}
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-sm flex items-start gap-2 animate-fadeIn">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="space-y-5">
                            <div className="group">
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Bulan
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.bulan}
                                        onChange={(e) => setFormData({ ...formData, bulan: parseInt(e.target.value) })}
                                        className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 outline-none transition-all duration-200 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:focus:bg-gray-800"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
                                        <svg className="h-4 w-4 fill-current transition-transform duration-200 group-focus-within:rotate-180" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tahun
                                </label>
                                <input
                                    type="number"
                                    value={formData.tahun}
                                    onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) })}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 outline-none transition-all duration-200 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:focus:bg-gray-800"
                                    min="2020"
                                    max="2030"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-700 transition"
                                disabled={isSubmitting}
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:from-brand-700 hover:to-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-300 dark:focus:ring-brand-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Simpan
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </MainLayout>
    );
}

// Protect page with permission
export default withPermission(PayrollPenyesuaianGajiPage, {
    permissions: ['penyesuaiangaji.index']
});
