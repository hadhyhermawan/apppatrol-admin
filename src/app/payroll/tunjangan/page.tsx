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

type TunjanganDetailDTO = {
    kode_jenis_tunjangan: string;
    jenis_tunjangan_nama?: string;
    jumlah: number;
};

type TunjanganItem = {
    kode_tunjangan: string;
    nik: string;
    nama_karyawan: string | null;
    kode_dept: string | null;
    kode_cabang: string | null;
    tanggal_berlaku: string;
    total_tunjangan: number;
    details: TunjanganDetailDTO[];
};

type EmployeeOption = {
    nik: string;
    nama_karyawan: string;
};

type JenisTunjanganOption = {
    kode_jenis_tunjangan: string;
    jenis_tunjangan: string;
};

type CabangOption = {
    kode_cabang: string;
    nama_cabang: string;
};

type DeptOption = {
    kode_dept: string;
    nama_dept: string;
};

function PayrollTunjanganPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<TunjanganItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [jenisTunjangan, setJenisTunjangan] = useState<JenisTunjanganOption[]>([]);
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
        kode_tunjangan: string;
        nik: string;
        tanggal_berlaku: string;
        details: Record<string, { isChecked: boolean, jumlah: number | '' }>;
    }>({
        kode_tunjangan: '',
        nik: '',
        tanggal_berlaku: '',
        details: {}
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

            const response: any = await apiClient.get(`/payroll/tunjangan?${params.toString()}`);
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch tunjangan", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const [empResponse, jtResponse, cabangRes, deptRes] = await Promise.all([
                apiClient.get('/payroll/employees-list'),
                apiClient.get('/payroll/jenis-tunjangan'),
                apiClient.get('/master/cabang/options'),
                apiClient.get('/master/departemen/options')
            ]);

            if (Array.isArray(empResponse)) setEmployees(empResponse);
            if (Array.isArray(jtResponse)) setJenisTunjangan(jtResponse);
            if (Array.isArray(cabangRes)) setCabangList(cabangRes);
            if (Array.isArray(deptRes)) setDeptList(deptRes);
        } catch (error) {
            console.error("Failed to fetch options", error);
        }
    };

    useEffect(() => {
        fetchData();
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

        const initialDetails: Record<string, { isChecked: boolean, jumlah: number | '' }> = {};
        jenisTunjangan.forEach(jt => {
            initialDetails[jt.kode_jenis_tunjangan] = { isChecked: false, jumlah: '' };
        });

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);

        setFormData({
            kode_tunjangan: '',
            nik: '',
            tanggal_berlaku: dateStr,
            details: initialDetails
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: TunjanganItem) => {
        setErrorMsg('');
        setModalMode('edit');

        const initialDetails: Record<string, { isChecked: boolean, jumlah: number | '' }> = {};
        jenisTunjangan.forEach(jt => {
            const existing = item.details.find(d => d.kode_jenis_tunjangan === jt.kode_jenis_tunjangan);
            initialDetails[jt.kode_jenis_tunjangan] = {
                isChecked: !!existing,
                jumlah: existing ? existing.jumlah : ''
            };
        });

        setFormData({
            kode_tunjangan: item.kode_tunjangan,
            nik: item.nik,
            tanggal_berlaku: item.tanggal_berlaku,
            details: initialDetails
        });
        setEditingKode(item.kode_tunjangan);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (modalMode === 'create' && !formData.nik) {
            setErrorMsg('Harap pilih karyawan.');
            return;
        }

        if (!formData.tanggal_berlaku) {
            setErrorMsg('Tanggal berlaku harus diisi.');
            return;
        }

        const validDetails = Object.keys(formData.details)
            .filter(kode => formData.details[kode].isChecked && formData.details[kode].jumlah !== '')
            .map(kode => ({
                kode_jenis_tunjangan: kode,
                jumlah: Number(formData.details[kode].jumlah)
            }));

        if (validDetails.length === 0) {
            setErrorMsg('Minimal satu tunjangan harus dicentang & diisi jumlahnya.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...((modalMode === 'create') && { nik: formData.nik }),
                tanggal_berlaku: formData.tanggal_berlaku,
                details: validDetails
            };

            if (modalMode === 'create') {
                await apiClient.post('/payroll/tunjangan', payload);
            } else {
                await apiClient.put(`/payroll/tunjangan/${editingKode}`, payload);
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
            await apiClient.delete(`/payroll/tunjangan/${kode}`);
            Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
            fetchData();
        } catch (error) {
            Swal.fire('Gagal!', 'Gagal menghapus data.', 'error');
        }
    };

    const handleDetailCheckboxToggle = (kode: string) => {
        setFormData(prev => ({
            ...prev,
            details: {
                ...prev.details,
                [kode]: {
                    ...prev.details[kode],
                    isChecked: !prev.details[kode].isChecked,
                    jumlah: prev.details[kode].isChecked ? '' : prev.details[kode].jumlah // reset value if unchecking
                }
            }
        }));
    };

    const handleDetailJumlahChange = (kode: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            details: {
                ...prev.details,
                [kode]: {
                    ...prev.details[kode],
                    jumlah: value === '' ? '' : Number(value),
                    isChecked: true // force check if parsing value
                }
            }
        }));
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Tunjangan Karyawan" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-brand-500" />
                        Daftar Tunjangan Karyawan
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={fetchData} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('tunjangan') && (
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
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Kode</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Karyawan</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Detail Tunjangan</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-right">Total (Rp)</th>
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
                                    <tr key={item.kode_tunjangan} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20 align-top">
                                        <td className="px-4 py-4 text-black dark:text-white">
                                            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.kode_tunjangan}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-black dark:text-white">{item.nama_karyawan}</span>
                                                <span className="text-xs text-brand-500">{item.nik}</span>
                                                <div className="flex text-xs text-gray-500 gap-2 mt-1">
                                                    <span>{item.kode_cabang || '-'}</span>
                                                    <span>•</span>
                                                    <span>{item.kode_dept || '-'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <ul className="list-disc list-inside text-xs text-black dark:text-white">
                                                {item.details.map((d, i) => (
                                                    <li key={i}>
                                                        <span className="font-medium">{d.jenis_tunjangan_nama || d.kode_jenis_tunjangan}:</span>
                                                        <span className="ml-1 text-gray-600 dark:text-gray-400">{formatCurrency(d.jumlah)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium text-green-600 dark:text-green-400">
                                            {formatCurrency(item.total_tunjangan)}
                                        </td>
                                        <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">
                                            {item.tanggal_berlaku}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleOpenEdit(item)} className="hover:text-brand-500 text-gray-500 transition-colors" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {canDelete('tunjangan') && (
                                                    <button onClick={() => handleDelete(item.kode_tunjangan)} className="hover:text-red-500 text-gray-500 transition-colors" title="Hapus">
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
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-white dark:bg-boxdark shrink-0">
                            <h3 className="text-lg font-bold text-black dark:text-white">
                                {modalMode === 'create' ? 'Tambah Tunjangan' : 'Edit Tunjangan'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                            <div className="px-6 py-5 space-y-5">
                                {errorMsg && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                                        {errorMsg}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-stroke dark:border-strokedark pb-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Karyawan</label>
                                        {modalMode === 'create' ? (
                                            <SearchableSelect
                                                options={employees.map(k => ({ value: k.nik, label: `${k.nama_karyawan} (${k.nik})` }))}
                                                value={formData.nik}
                                                onChange={(val) => setFormData({ ...formData, nik: val })}
                                                placeholder="Pilih Karyawan"
                                                usePortal={true}
                                            />
                                        ) : (
                                            <div className="p-3 bg-gray-100 dark:bg-meta-4 rounded-lg">
                                                <p className="font-semibold text-black dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">
                                                    {employees.find(e => e.nik === formData.nik)?.nama_karyawan || formData.nik}
                                                </p>
                                                <p className="text-sm text-gray-500">{formData.nik}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Tanggal Berlaku</label>
                                        <DatePicker
                                            id="form-tanggal"
                                            placeholder="Pilih Tanggal"
                                            defaultDate={formData.tanggal_berlaku}
                                            onChange={(dates: Date[], dateStr: string) => setFormData({ ...formData, tanggal_berlaku: dateStr })}
                                            staticDisplay={false}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-3">Detail Tunjangan yang Diberikan</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-2">
                                        {jenisTunjangan.map(jt => {
                                            const detail = formData.details[jt.kode_jenis_tunjangan] || { isChecked: false, jumlah: '' };
                                            return (
                                                <div
                                                    key={jt.kode_jenis_tunjangan}
                                                    className={`
                                                        p-3 border rounded-lg transition-colors 
                                                        ${detail.isChecked
                                                            ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10'
                                                            : 'border-stroke bg-gray-50 dark:border-strokedark dark:bg-meta-4/20'}
                                                    `}
                                                >
                                                    <div className="flex items-center mb-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`check-${jt.kode_jenis_tunjangan}`}
                                                            checked={detail.isChecked}
                                                            onChange={() => handleDetailCheckboxToggle(jt.kode_jenis_tunjangan)}
                                                            className="w-4 h-4 text-brand-500 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                        />
                                                        <label htmlFor={`check-${jt.kode_jenis_tunjangan}`} className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer select-none">
                                                            {jt.jenis_tunjangan}
                                                        </label>
                                                    </div>
                                                    <div>
                                                        <input
                                                            type="number"
                                                            placeholder="Jumlah (Rp)"
                                                            disabled={!detail.isChecked}
                                                            value={detail.jumlah}
                                                            onChange={(e) => handleDetailJumlahChange(jt.kode_jenis_tunjangan, e.target.value)}
                                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 disabled:bg-gray-100 disabled:opacity-50 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:disabled:bg-boxdark"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {jenisTunjangan.length === 0 && (
                                            <p className="text-gray-500 text-sm italic py-2 col-span-2 text-center">Master Jenis Tunjangan kosong.</p>
                                        )}
                                    </div>
                                </div>

                            </div>

                            <div className="px-6 py-4 bg-gray-50 dark:bg-meta-4/30 flex justify-end gap-3 border-t border-stroke dark:border-strokedark shrink-0">
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
export default withPermission(PayrollTunjanganPage, {
    permissions: ['tunjangan.index']
});
