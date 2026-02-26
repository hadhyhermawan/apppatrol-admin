'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Plus, Edit, Trash2, Search, FileText, CheckCircle, XCircle, Save, AlertCircle, X, Calendar } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import SearchableSelect from '@/components/form/SearchableSelect';

type SlipGajiItem = {
    kode_slip_gaji: string;
    bulan: number;
    tahun: string;
    status: number;
    created_at: string;
    updated_at: string;
};

function PayrollSlipGajiPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<SlipGajiItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState({
        bulan: new Date().getMonth() + 1,
        tahun: new Date().getFullYear(),
        status: 0,
        kode_slip_gaji: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get('/payroll/slip-gaji');
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch slip gaji", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openCreateModal = () => {
        setModalMode('create');
        setFormData({
            bulan: new Date().getMonth() + 1,
            tahun: new Date().getFullYear(),
            status: 0,
            kode_slip_gaji: ''
        });
        setError('');
        setIsModalOpen(true);
    };

    const openEditModal = (item: SlipGajiItem) => {
        setModalMode('edit');
        setFormData({
            bulan: item.bulan,
            tahun: typeof item.tahun === 'string' ? parseInt(item.tahun) : item.tahun as number,
            status: item.status,
            kode_slip_gaji: item.kode_slip_gaji
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
                await apiClient.post('/payroll/slip-gaji', {
                    bulan: formData.bulan,
                    tahun: formData.tahun,
                    status: formData.status
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'Data telah disimpan.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await apiClient.put(`/payroll/slip-gaji/${formData.kode_slip_gaji}`, {
                    bulan: formData.bulan,
                    tahun: formData.tahun,
                    status: formData.status
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
            text: "Data akan dihapus permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/payroll/slip-gaji/${kode}`);
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
            <PageBreadcrumb pageTitle="Slip Gaji" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-brand-500" />
                        Daftar Slip Gaji
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={fetchData} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('slipgaji') && (
                            <button onClick={openCreateModal} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                                <Plus className="h-4 w-4" />
                                <span>Generate Slip Gaji</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Kode</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Bulan</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Tahun</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
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
                                    <tr key={item.kode_slip_gaji} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-black dark:text-white font-mono">
                                            {item.kode_slip_gaji}
                                        </td>
                                        <td className="px-4 py-4 text-black dark:text-white">
                                            {getMonthName(item.bulan)}
                                        </td>
                                        <td className="px-4 py-4 text-black dark:text-white">
                                            {item.tahun}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {item.status === 1 ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Publish
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                    <XCircle className="h-3 w-3" />
                                                    Draft
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link href={`/payroll/slip-gaji/${item.kode_slip_gaji}`} className="hover:text-blue-500 text-gray-500 transition-colors" title="Lihat">
                                                    <FileText className="h-4 w-4" />
                                                </Link>
                                                {canUpdate('slipgaji') && (
                                                    <button onClick={() => openEditModal(item)} className="hover:text-brand-500 text-gray-500 transition-colors" title="Edit">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {canDelete('slipgaji') && (
                                                    <button onClick={() => handleDelete(item.kode_slip_gaji)} className="hover:text-red-500 text-gray-500 transition-colors" title="Hapus">
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
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4 shrink-0">
                            <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-brand-500" />
                                {modalMode === 'create' ? 'Generate Slip Gaji' : 'Edit Slip Gaji'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-5">
                                {error && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 mt-0.5" />
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

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Status</label>
                                    <div className="relative z-[90] bg-white dark:bg-form-input">
                                        <SearchableSelect
                                            options={[
                                                { value: "0", label: "Draft" },
                                                { value: "1", label: "Publish" },
                                            ]}
                                            value={formData.status.toString()}
                                            onChange={(val) => {
                                                if (val) setFormData({ ...formData, status: parseInt(val) })
                                            }}
                                            placeholder="Pilih Status"
                                            usePortal={true}
                                        />
                                    </div>
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
export default withPermission(PayrollSlipGajiPage, {
    permissions: ['slipgaji.index']
});
