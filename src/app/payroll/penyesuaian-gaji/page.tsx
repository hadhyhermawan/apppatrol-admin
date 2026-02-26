'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Plus, Edit, Trash2, Calendar, Users, ArrowRight, Save, AlertCircle, X } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import SearchableSelect from '@/components/form/SearchableSelect';

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
                        {canCreate('penyesuaiangaji') && (
                            <button onClick={openCreateModal} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                                <Plus className="h-4 w-4" />
                                <span>Tambah Periode</span>
                            </button>
                        )}
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
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Kode</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Bulan</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">Tahun</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white text-center">Kelola</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan.</td></tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={item.kode_penyesuaian_gaji} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20 align-top">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4 text-black dark:text-white">
                                            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.kode_penyesuaian_gaji}</span>
                                        </td>
                                        <td className="px-4 py-4 text-black dark:text-white text-sm">
                                            {getMonthName(item.bulan)}
                                        </td>
                                        <td className="px-4 py-4 text-black dark:text-white text-sm">
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
                                                {canUpdate('penyesuaiangaji') && (
                                                    <button onClick={() => openEditModal(item)} className="hover:text-brand-500 text-gray-500 transition-colors" title="Edit">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                )}
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

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4 shrink-0">
                            <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-brand-500" />
                                {modalMode === 'create' ? 'Tambah Periode Baru' : 'Edit Periode Penyesuaian'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-5">
                                {error && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-start gap-2">
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Bulan</label>
                                    <div className="relative z-[100] bg-white dark:bg-form-input">
                                        <SearchableSelect
                                            options={Array.from({ length: 12 }, (_, i) => ({
                                                value: (i + 1).toString(),
                                                label: new Date(0, i).toLocaleString('id-ID', { month: 'long' })
                                            }))}
                                            value={formData.bulan.toString()}
                                            onChange={(val) => {
                                                if (val) setFormData({ ...formData, bulan: parseInt(val) })
                                            }}
                                            placeholder="Pilih Bulan"
                                            usePortal={true}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Tahun</label>
                                    <input
                                        type="number"
                                        value={formData.tahun}
                                        onChange={(e) => setFormData({ ...formData, tahun: parseInt(e.target.value) })}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2.5 px-4 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500"
                                        min="2020"
                                        max="2030"
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-stroke dark:border-strokedark flex justify-end gap-3 bg-gray-50 dark:bg-meta-4 shrink-0">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-boxdark dark:text-gray-300 dark:border-strokedark dark:hover:bg-meta-4 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
                                >
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
export default withPermission(PayrollPenyesuaianGajiPage, {
    permissions: ['penyesuaiangaji.index']
});
