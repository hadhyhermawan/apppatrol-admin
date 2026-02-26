'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Plus, Edit, Trash2, Search, Briefcase, X, Save, User, ArrowLeft, ArrowRight } from 'lucide-react';
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

type BpjsTkItem = {
    kode_bpjs_tk: string;
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

function PayrollBpjsTenagakerjaPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<BpjsTkItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [cabangList, setCabangList] = useState<CabangOption[]>([]);
    const [deptList, setDeptList] = useState<DeptOption[]>([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [totalItems, setTotalItems] = useState(0);

    // Filters
    const [keyword, setKeyword] = useState('');
    const [kodeCabang, setKodeCabang] = useState('');
    const [kodeDept, setKodeDept] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<{
        kode_bpjs_tk: string;
        nik: string;
        jumlah: number | '';
        tanggal_berlaku: string;
    }>({
        kode_bpjs_tk: '',
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
            params.append('page', currentPage.toString());
            params.append('per_page', perPage.toString());

            const response: any = await apiClient.get(`/payroll/bpjs-tenagakerja?${params.toString()}`);
            if (response.status && response.data) {
                setData(response.data);
                if (response.meta) {
                    setTotalPages(response.meta.total_pages);
                    setTotalItems(response.meta.total_items);
                }
            } else if (Array.isArray(response)) {
                // Backward compatibility
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch bpjs tenagakerja", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownOptions = async () => {
        try {
            const [empRes, cabangRes, deptRes] = await Promise.all([
                apiClient.get('/payroll/employees-list'),
                apiClient.get('/master/cabang/options'),
                apiClient.get('/master/departemen/options')
            ]);

            if (Array.isArray(empRes)) setEmployees(empRes);
            if (Array.isArray(cabangRes)) setCabangList(cabangRes);
            if (Array.isArray(deptRes)) setDeptList(deptRes);
        } catch (error) {
            console.error("Failed to fetch dropdown options", error);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(debounce);
    }, [keyword, kodeCabang, kodeDept, currentPage, perPage]);

    useEffect(() => {
        fetchDropdownOptions();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    // Modal Handlers
    const handleOpenCreate = () => {
        setModalMode('create');
        setEditingKode(null);
        setFormData({
            kode_bpjs_tk: '',
            nik: '',
            jumlah: '',
            tanggal_berlaku: new Date().toISOString().split('T')[0]
        });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: BpjsTkItem) => {
        setModalMode('edit');
        setEditingKode(item.kode_bpjs_tk);
        setFormData({
            kode_bpjs_tk: item.kode_bpjs_tk,
            nik: item.nik,
            jumlah: item.jumlah,
            tanggal_berlaku: item.tanggal_berlaku
        });
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        if (!isSubmitting) {
            setIsModalOpen(false);
        }
    };

    const handleFormChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.nik || formData.jumlah === '' || !formData.tanggal_berlaku) {
            setErrorMsg('Semua field wajib diisi.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (modalMode === 'create') {
                if (formData.nik === 'ALL') {
                    const promises = employees.map(emp => apiClient.post('/payroll/bpjs-tenagakerja', {
                        nik: emp.nik,
                        jumlah: Number(formData.jumlah),
                        tanggal_berlaku: formData.tanggal_berlaku
                    }));
                    await Promise.allSettled(promises);
                } else {
                    await apiClient.post('/payroll/bpjs-tenagakerja', {
                        nik: formData.nik,
                        jumlah: Number(formData.jumlah),
                        tanggal_berlaku: formData.tanggal_berlaku
                    });
                }
            } else {
                await apiClient.put(`/payroll/bpjs-tenagakerja/${editingKode}`, {
                    nik: formData.nik,
                    jumlah: Number(formData.jumlah),
                    tanggal_berlaku: formData.tanggal_berlaku
                });
            }

            setIsModalOpen(false);
            fetchData();
            Swal.fire({
                title: 'Berhasil!',
                text: `Data BPJS Tenaga Kerja berhasil ${modalMode === 'create' ? 'ditambahkan' : 'diperbarui'}.`,
                icon: 'success',
                confirmButtonColor: '#3C50E0'
            });
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.response?.data?.detail || 'Terjadi kesalahan saat menyimpan data.');
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

        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/payroll/bpjs-tenagakerja/${kode}`);
                Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
                fetchData();
            } catch (error) {
                Swal.fire('Gagal!', 'Gagal menghapus data.', 'error');
            }
        }
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="BPJS Tenaga Kerja" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-brand-500" />
                        Daftar BPJS Tenaga Kerja
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={fetchData} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('bpjstenagakerja') && (
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
                            placeholder="Cari karyawan..."
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        />
                        <Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                    </div>
                    <div className="relative z-20 bg-white dark:bg-form-input">
                        <SearchableSelect
                            options={cabangList.map(c => ({ value: c.kode_cabang, label: `${c.kode_cabang} - ${c.nama_cabang}` }))}
                            value={kodeCabang}
                            onChange={(val) => setKodeCabang(val)}
                            placeholder="Semua Cabang"
                        />
                    </div>
                    <div className="relative z-20 bg-white dark:bg-form-input">
                        <SearchableSelect
                            options={deptList.map(d => ({ value: d.kode_dept, label: `${d.kode_dept} - ${d.nama_dept}` }))}
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
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">Kode BPJS</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Karyawan</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Dept</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Cabang</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white text-right">Jumlah (Rp)</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white text-center">Berlaku Mulai</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan.</td></tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={item.kode_bpjs_tk} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20 align-top">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4 text-black dark:text-white">
                                            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.kode_bpjs_tk}</span>
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
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.kode_dept || '-'}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.kode_cabang || '-'}</p>
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium text-blue-600 dark:text-blue-400">
                                            {formatCurrency(item.jumlah)}
                                        </td>
                                        <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">
                                            {item.tanggal_berlaku}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleOpenEdit(item)} className="hover:text-brand-500 text-gray-500 transition-colors" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {canDelete('bpjstenagakerja') && (
                                                    <button onClick={() => handleDelete(item.kode_bpjs_tk)} className="hover:text-red-500 text-gray-500 transition-colors" title="Hapus">
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

                {/* Pagination */}
                <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stroke pt-4 dark:border-strokedark">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, totalItems)} dari {totalItems} data
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                            className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || loading}
                            className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4 shrink-0">
                            <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-brand-500" />
                                {modalMode === 'create' ? 'Tambah BPJS Tenaga Kerja' : 'Edit BPJS Tenaga Kerja'}
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
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Jumlah Iuran (Rp)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium tracking-wider">Rp</span>
                                            <input
                                                type="number"
                                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2.5 pl-12 pr-4 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500"
                                                value={formData.jumlah}
                                                onChange={(e) => handleFormChange('jumlah', e.target.value === '' ? '' : Number(e.target.value))}
                                                placeholder="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Tanggal Berlaku</label>
                                        <DatePicker
                                            id="form-tanggal"
                                            placeholder="Pilih Tanggal"
                                            defaultDate={formData.tanggal_berlaku}
                                            onChange={(dates: Date[], dateStr: string) => handleFormChange('tanggal_berlaku', dateStr)}
                                            staticDisplay={false}
                                        />
                                    </div>
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

// Protect page with permission
export default withPermission(PayrollBpjsTenagakerjaPage, {
    permissions: ['bpjstenagakerja.index']
});
