'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Plus, Edit, Trash2, Search, Building2, X, Save } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import SearchableSelect from '@/components/form/SearchableSelect';
import dynamic from 'next/dynamic';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />
});

type GajiPokokItem = {
    kode_gaji: string;
    nik: string;
    nama_karyawan: string | null;
    kode_dept: string | null;
    kode_cabang: string | null;
    jumlah: number;
    tanggal_berlaku: string;
    created_at: string;
};

type EmployeeOption = {
    nik: string;
    nama_karyawan: string;
};

type CabangOption = {
    kode_cabang: string;
    nama_cabang: string;
};

type DeptOption = {
    kode_dept: string;
    nama_dept: string;
};

function PayrollGajiPokokPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<GajiPokokItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [cabangList, setCabangList] = useState<CabangOption[]>([]);
    const [deptList, setDeptList] = useState<DeptOption[]>([]);

    // Filters
    const [keyword, setKeyword] = useState('');
    const [kodeCabang, setKodeCabang] = useState('');
    const [kodeDept, setKodeDept] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<{
        kode_gaji: string;
        nik: string;
        jumlah: number | '';
        tanggal_berlaku: string;
    }>({
        kode_gaji: '',
        nik: '',
        jumlah: '',
        tanggal_berlaku: '',
    });
    const [editingKode, setEditingKode] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);
            if (kodeCabang) params.append('kode_cabang', kodeCabang);
            if (kodeDept) params.append('kode_dept', kodeDept);
            params.append('limit', '50');

            const response: any = await apiClient.get(`/payroll/gaji-pokok?${params.toString()}`);
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch gaji pokok", error);
            setData([]);
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

    const fetchOptions = async () => {
        try {
            const [cabangRes, deptRes] = await Promise.all([
                apiClient.get('/master/cabang/options'),
                apiClient.get('/master/departemen/options')
            ]);

            if (Array.isArray(cabangRes)) setCabangList(cabangRes);
            if (Array.isArray(deptRes)) setDeptList(deptRes);
        } catch (error) {
            console.error("Failed to fetch options", error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchEmployees();
        fetchOptions();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword, kodeCabang, kodeDept]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const handleOpenCreate = () => {
        setErrorMsg('');
        setModalMode('create');
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);

        setFormData({
            kode_gaji: '',
            nik: '',
            jumlah: '',
            tanggal_berlaku: dateStr,
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: GajiPokokItem) => {
        setErrorMsg('');
        setModalMode('edit');
        setFormData({
            kode_gaji: item.kode_gaji,
            nik: item.nik,
            jumlah: item.jumlah,
            tanggal_berlaku: item.tanggal_berlaku,
        });
        setEditingKode(item.kode_gaji);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.nik || formData.jumlah === '' || !formData.tanggal_berlaku) {
            setErrorMsg('Harap isi Karyawan, Jumlah Gaji, dan Tanggal.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                nik: formData.nik,
                jumlah: Number(formData.jumlah),
                tanggal_berlaku: formData.tanggal_berlaku
            };

            if (modalMode === 'create') {
                await apiClient.post('/payroll/gaji-pokok', payload);
            } else {
                await apiClient.put(`/payroll/gaji-pokok/${editingKode}`, payload);
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

    const handleDelete = async (kode: string) => {
        const result = await Swal.fire({
            title: 'Hapus Data?',
            text: "Data akan dihapus permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/payroll/gaji-pokok/${kode}`);
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
            <PageBreadcrumb pageTitle="Gaji Pokok" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-brand-500" />
                        Daftar Gaji Pokok
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={fetchData} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('gajipokok') && (
                            <button onClick={handleOpenCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                                <Plus className="h-4 w-4" />
                                <span>Tambah Data</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Section */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari Karyawan..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        />
                        <Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                        <SearchableSelect
                            options={[{ value: '', label: 'Semua Cabang' }, ...cabangList.map(cab => ({ value: cab.kode_cabang, label: cab.nama_cabang }))]}
                            value={kodeCabang}
                            onChange={(val) => setKodeCabang(val)}
                            placeholder="Semua Cabang"
                        />
                    </div>
                    <div>
                        <SearchableSelect
                            options={[{ value: '', label: 'Semua Dept' }, ...deptList.map(dept => ({ value: dept.kode_dept, label: dept.nama_dept }))]}
                            value={kodeDept}
                            onChange={(val) => setKodeDept(val)}
                            placeholder="Semua Dept"
                        />
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Kode Gaji</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Nama Karyawan</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Cabang/Dept</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-right">Jumlah (Rp)</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Berlaku Mulai</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan.</td></tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.kode_gaji} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20 align-top">
                                        <td className="px-4 py-4 text-black dark:text-white">
                                            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.kode_gaji}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-black dark:text-white">{item.nama_karyawan}</span>
                                                <span className="text-xs text-brand-500">{item.nik}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col text-xs text-gray-600 dark:text-gray-400">
                                                <span>{item.kode_cabang || '-'}</span>
                                                <span>{item.kode_dept || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium text-green-600 dark:text-green-400">
                                            {formatCurrency(item.jumlah)}
                                        </td>
                                        <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">
                                            {item.tanggal_berlaku}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {canUpdate('gajipokok') && (
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:text-yellow-500 text-gray-500 transition-colors" title="Edit">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {canDelete('gajipokok') && (
                                                    <button onClick={() => handleDelete(item.kode_gaji)} className="hover:text-red-500 text-gray-500 transition-colors" title="Hapus">
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
                <div className="mt-4 text-xs text-gray-400 italic">
                    * Menampilkan 50 data terakhir yang diinput/update. Gunakan pencarian untuk menemukan data spesifik.
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-white dark:bg-boxdark sticky top-0 z-10">
                            <h3 className="text-lg font-bold text-black dark:text-white">
                                {modalMode === 'create' ? 'Tambah Gaji Pokok' : 'Edit Gaji Pokok'}
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
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Karyawan</label>
                                    {modalMode === 'create' ? (
                                        <SearchableSelect
                                            options={employees.map(k => ({ value: k.nik, label: `${k.nama_karyawan} (${k.nik})` }))}
                                            value={formData.nik}
                                            onChange={(val) => setFormData({ ...formData, nik: val })}
                                            placeholder="Pilih Karyawan"
                                        />
                                    ) : (
                                        <div className="p-3 bg-gray-100 dark:bg-meta-4 rounded-lg">
                                            <p className="font-semibold text-black dark:text-white">
                                                {employees.find(e => e.nik === formData.nik)?.nama_karyawan || formData.nik}
                                            </p>
                                            <p className="text-sm text-gray-500">{formData.nik}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Jumlah Gaji Pokok (Rp)</label>
                                    <input
                                        type="number"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input text-black dark:text-white"
                                        placeholder="0"
                                        value={formData.jumlah}
                                        onChange={e => setFormData({ ...formData, jumlah: e.target.value === '' ? '' : Number(e.target.value) })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Tanggal Berlaku</label>
                                    <DatePicker
                                        id="form-tanggal"
                                        placeholder="Pilih Tanggal"
                                        defaultDate={formData.tanggal_berlaku}
                                        onChange={(dates: Date[], dateStr: string) => setFormData({ ...formData, tanggal_berlaku: dateStr })}
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 dark:bg-meta-4/30 flex justify-end gap-3 border-t border-stroke dark:border-strokedark sticky bottom-0 z-10">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-black bg-white border border-stroke rounded-lg hover:bg-gray-50 dark:bg-meta-4 dark:text-white dark:border-strokedark">
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
export default withPermission(PayrollGajiPokokPage, {
    permissions: ['gajipokok.index']
});
