'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Plus, Edit, Trash2, ArrowLeft, UserPlus, Save, X, User } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import SearchableSelect from '@/components/form/SearchableSelect';

type DetailItem = {
    kode_penyesuaian_gaji: string;
    nik: string;
    nama_karyawan: string | null;
    penambah: number;
    pengurang: number;
    keterangan: string;
    created_at: string;
    updated_at: string;
};

type HeaderInfo = {
    kode_penyesuaian_gaji: string;
    bulan: number;
    tahun: number;
};

type EmployeeOption = {
    nik: string;
    nama_karyawan: string;
};

export default function DetailPenyesuaianGajiPage() {
    const params = useParams();
    const router = useRouter();
    const kode = params.kode as string;

    const [header, setHeader] = useState<HeaderInfo | null>(null);
    const [details, setDetails] = useState<DetailItem[]>([]);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<{
        nik: string;
        penambah: number | '';
        pengurang: number | '';
        keterangan: string;
    }>({
        nik: '',
        penambah: 0,
        pengurang: 0,
        keterangan: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchHeader = async () => {
        try {
            const response: any = await apiClient.get(`/payroll/penyesuaian-gaji/${kode}`);
            setHeader(response);
        } catch (error) {
            console.error("Failed to fetch header", error);
            Swal.fire('Error', 'Data periode tidak ditemukan', 'error').then(() => router.back());
        }
    };

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get(`/payroll/penyesuaian-gaji/${kode}/details`);
            if (Array.isArray(response)) {
                setDetails(response);
            } else {
                setDetails([]);
            }
        } catch (error) {
            console.error("Failed to fetch details", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response: any = await apiClient.get('/payroll/employees-list');
            if (Array.isArray(response)) {
                setEmployees(response);
            }
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    useEffect(() => {
        if (kode) {
            fetchHeader();
            fetchDetails();
            fetchEmployees();
        }
    }, [kode]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const getMonthName = (month: number) => {
        return new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' });
    };

    const handleDelete = (nik: string) => {
        Swal.fire({
            title: 'Hapus Karyawan?',
            text: "Data penyesuaian untuk karyawan ini akan dihapus!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/payroll/penyesuaian-gaji/${kode}/details/${nik}`);
                    Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
                    fetchDetails();
                } catch (error) {
                    Swal.fire('Gagal!', 'Gagal menghapus data.', 'error');
                }
            }
        });
    };

    const handleOpenCreate = () => {
        setModalMode('create');
        setFormData({
            nik: '',
            penambah: 0,
            pengurang: 0,
            keterangan: ''
        });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: DetailItem) => {
        setModalMode('edit');
        setFormData({
            nik: item.nik,
            penambah: item.penambah,
            pengurang: item.pengurang,
            keterangan: item.keterangan
        });
        setErrorMsg('');
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleFormChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nik) {
            setErrorMsg('Karyawan harus dipilih');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg('');

        try {
            if (modalMode === 'create') {
                if (formData.nik === 'ALL') {
                    const promises = employees.map(emp => apiClient.post(`/payroll/penyesuaian-gaji/${kode}/details`, {
                        nik: emp.nik,
                        penambah: Number(formData.penambah),
                        pengurang: Number(formData.pengurang),
                        keterangan: formData.keterangan || '-'
                    }));
                    await Promise.allSettled(promises);
                } else {
                    await apiClient.post(`/payroll/penyesuaian-gaji/${kode}/details`, {
                        nik: formData.nik,
                        penambah: Number(formData.penambah),
                        pengurang: Number(formData.pengurang),
                        keterangan: formData.keterangan || '-'
                    });
                }
                Swal.fire('Berhasil!', 'Data penyesuaian karyawan ditambahkan.', 'success');
            } else {
                await apiClient.put(`/payroll/penyesuaian-gaji/${kode}/details/${formData.nik}`, {
                    nik: formData.nik,
                    penambah: Number(formData.penambah),
                    pengurang: Number(formData.pengurang),
                    keterangan: formData.keterangan || '-'
                });
                Swal.fire('Berhasil!', 'Data penyesuaian diperbarui.', 'success');
            }

            handleCloseModal();
            fetchDetails();
        } catch (error: any) {
            console.error("Failed to save data", error);
            setErrorMsg(error.response?.data?.detail || 'Terjadi kesalahan saat menyimpan data');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!header) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Detail Penyesuaian Gaji" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">

                {/* Header Information */}
                <div className="mb-6 border-b border-gray-200 pb-4 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Link href="/payroll/penyesuaian-gaji" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                <ArrowLeft className="w-5 h-5 text-gray-500" />
                            </Link>
                            <div>
                                <h2 className="text-xl font-bold text-black dark:text-white">
                                    {getMonthName(header.bulan)} {header.tahun}
                                </h2>
                                <p className="text-sm text-gray-500 font-mono">{header.kode_penyesuaian_gaji}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchDetails} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button onClick={handleOpenCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                            <UserPlus className="h-4 w-4" />
                            <span>Tambah Karyawan</span>
                        </button>
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Karyawan</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white text-right text-green-600">Penambah</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white text-right text-red-600">Pengurang</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Keterangan</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : details.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Belum ada data karyawan di periode ini.</td></tr>
                            ) : (
                                details.map((item, idx) => (
                                    <tr key={item.nik} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20 align-top">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-10 w-10 flex-shrink-0 rounded-full">
                                                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 dark:bg-meta-4 text-gray-500">
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-black dark:text-white text-sm">{item.nama_karyawan || item.nik}</h5>
                                                    <p className="text-xs text-gray-500">{item.nik}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium text-green-600">
                                            {formatCurrency(item.penambah)}
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium text-red-600">
                                            {formatCurrency(item.pengurang)}
                                        </td>
                                        <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                                            {item.keterangan}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleOpenEdit(item)} className="hover:text-brand-500 text-gray-500 transition-colors" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item.nik)} className="hover:text-red-500 text-gray-500 transition-colors" title="Hapus">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {details.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 font-semibold text-black dark:text-white">
                                    <td colSpan={3} className="px-4 py-4 text-right">Total:</td>
                                    <td className="px-4 py-4 text-right text-green-600">
                                        {formatCurrency(details.reduce((sum, item) => sum + item.penambah, 0))}
                                    </td>
                                    <td className="px-4 py-4 text-right text-red-600">
                                        {formatCurrency(details.reduce((sum, item) => sum + item.pengurang, 0))}
                                    </td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4 shrink-0">
                            <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-brand-500" />
                                {modalMode === 'create' ? 'Tambah Data Karyawan' : 'Edit Data Karyawan'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-5">
                                {errorMsg && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-start gap-2">
                                        <span>{errorMsg}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Karyawan</label>
                                    {modalMode === 'create' ? (
                                        <div className="relative z-[100] bg-white dark:bg-form-input">
                                            <SearchableSelect
                                                options={[
                                                    { value: 'ALL', label: '--- Pilih Semua Karyawan ---' },
                                                    ...employees.map(e => ({ value: e.nik, label: `${e.nama_karyawan} (${e.nik})` }))
                                                ]}
                                                value={formData.nik}
                                                onChange={(val) => handleFormChange('nik', val)}
                                                placeholder="Pilih Karyawan"
                                                usePortal={true}
                                            />
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-gray-50 dark:bg-meta-4 rounded-lg border border-stroke dark:border-strokedark flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-black dark:text-white">
                                                    {employees.find(e => e.nik === formData.nik)?.nama_karyawan || formData.nik}
                                                </span>
                                                <span className="text-xs text-gray-500">{formData.nik}</span>
                                            </div>
                                            <span className="text-xs font-medium bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                                Tidak dapat diubah
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Penambah (Rp)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium tracking-wider">Rp</span>
                                            <input
                                                type="number"
                                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2.5 pl-12 pr-4 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500"
                                                value={formData.penambah}
                                                onChange={(e) => handleFormChange('penambah', e.target.value === '' ? '' : Number(e.target.value))}
                                                placeholder="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Pengurang (Rp)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium tracking-wider">Rp</span>
                                            <input
                                                type="number"
                                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2.5 pl-12 pr-4 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500"
                                                value={formData.pengurang}
                                                onChange={(e) => handleFormChange('pengurang', e.target.value === '' ? '' : Number(e.target.value))}
                                                placeholder="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Keterangan</label>
                                    <textarea
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500 min-h-[80px]"
                                        value={formData.keterangan}
                                        onChange={(e) => handleFormChange('keterangan', e.target.value)}
                                        placeholder="Keterangan penyesuaian..."
                                    ></textarea>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-stroke dark:border-strokedark flex justify-end gap-3 bg-gray-50 dark:bg-meta-4 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
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
