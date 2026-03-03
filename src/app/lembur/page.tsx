'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Plus, Search, Trash, Edit, RefreshCw, Clock, ArrowLeft, ArrowRight, Eye, CheckCircle, XCircle, AlertCircle, X, Save, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import SearchableSelect from '@/components/form/SearchableSelect';
import dynamic from 'next/dynamic';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />,
});

type Lembur = {
    id: number;
    nik: string;
    nama_karyawan: string;
    nama_jabatan: string;
    nama_dept: string;
    nama_cabang: string;
    tanggal: string;
    lembur_mulai: string;
    lembur_selesai: string;
    lembur_in: string | null;
    lembur_out: string | null;
    status: string; // '0'=pending, '1'=approved, '2'=rejected
    keterangan: string;
};

type KaryawanOption = {
    nik: string;
    nama_karyawan: string;
};

type BranchOption = {
    kode_cabang: string;
    nama_cabang: string;
};

type DeptOption = {
    kode_dept: string;
    nama_dept: string;
};

type OptionItem = { value: string; label: string };

function LemburPage() {
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = usePermissions();
    const [data, setData] = useState<Lembur[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCabang, setSearchCabang] = useState('');
    const [searchDept, setSearchDept] = useState('');
    const [searchStatus, setSearchStatus] = useState('');
    const [filterVendor, setFilterVendor] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(10);

    // Modal & Form States
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<Lembur | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
        nik: '',
        dari: '',
        sampai: '',
        keterangan: ''
    });

    // Options
    const [karyawanOptions, setKaryawanOptions] = useState<KaryawanOption[]>([]);
    const [cabangOptions, setCabangOptions] = useState<BranchOption[]>([]);
    const [deptOptions, setDeptOptions] = useState<DeptOption[]>([]);
    const [vendorOptions, setVendorOptions] = useState<OptionItem[]>([]);

    useEffect(() => {
        fetchData();
    }, [searchCabang, searchDept, searchStatus, dateFilter, filterVendor]);

    useEffect(() => {
        fetchOptions();
    }, [isSuperAdmin, filterVendor]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchCabang) params.append('kode_cabang', searchCabang);
            if (searchDept) params.append('kode_dept', searchDept);
            if (searchStatus) params.append('status', searchStatus);
            if (isSuperAdmin && filterVendor) params.append('vendor_id', filterVendor);
            if (dateFilter) {
                const dates = dateFilter.split(' to ');
                if (dates[0]) params.append('dari', dates[0]);
                if (dates[1]) params.append('sampai', dates[1]);
            }

            const res: any = await apiClient.get(`/lembur?${params.toString()}`);
            setData(Array.isArray(res) ? res : []);
        } catch (error) {
            console.error(error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const cabParams = new URLSearchParams();
            if (isSuperAdmin && filterVendor) {
                cabParams.append('vendor_id', filterVendor);
            }
            const calls = [
                apiClient.get(`/master/karyawan/options?${cabParams.toString()}`),
                apiClient.get(`/master/cabang/options?${cabParams.toString()}`),
                apiClient.get('/master/departemen/options')
            ];

            if (isSuperAdmin) {
                calls.push(apiClient.get('/vendors'));
            }

            const responses = await Promise.all(calls);
            setKaryawanOptions(responses[0] as any);
            setCabangOptions(responses[1] as any);
            setDeptOptions(responses[2] as any);

            if (isSuperAdmin && Array.isArray(responses[3])) {
                setVendorOptions(responses[3].map((v: any) => ({ value: v.id.toString(), label: v.nama_vendor })));
            }
        } catch (error) {
            console.error("Failed options", error);
        }
    };

    // Filter & Pagination
    const filteredData = useMemo(() => {
        return data.filter(item =>
            item.nama_karyawan.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.nik.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [filteredData, currentPage, perPage]);

    const totalPages = Math.ceil(filteredData.length / perPage);

    const handleCreate = () => {
        setIsEditing(false);
        setFormData({
            nik: '',
            dari: '',
            sampai: '',
            keterangan: ''
        });
        setShowModal(true);
    };

    const handleEdit = async (id: number) => {
        try {
            const res: any = await apiClient.get(`/lembur/${id}`);
            setFormData({
                nik: res.nik,
                dari: res.lembur_mulai,
                sampai: res.lembur_selesai,
                keterangan: res.keterangan
            });
            setCurrentId(id);
            setIsEditing(true);
            setShowModal(true);
        } catch (error) {
            Swal.fire('Error', 'Gagal memuat data', 'error');
        }
    };

    const handleViewDetail = async (id: number) => {
        try {
            const res: any = await apiClient.get(`/lembur/${id}`);
            setSelectedDetail(res);
            setShowDetailModal(true);
        } catch (error) {
            Swal.fire('Error', 'Gagal memuat detail', 'error');
        }
    };

    const handleDelete = (id: number) => {
        Swal.fire({
            title: 'Hapus Data?',
            text: "Data lembur ini akan dihapus!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/lembur/${id}`);
                    Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
                    fetchData();
                } catch (error) {
                    Swal.fire('Gagal!', 'Gagal menghapus data.', 'error');
                }
            }
        });
    };

    const handleApprove = async (id: number, approve: boolean) => {
        try {
            await apiClient.post(`/lembur/${id}/approve`, { approve });
            Swal.fire('Berhasil', approve ? 'Lembur disetujui' : 'Lembur ditolak', 'success');
            fetchData();
        } catch (error) {
            Swal.fire('Gagal', 'Gagal memproses approval', 'error');
        }
    };

    const handleCancelApprove = async (id: number) => {
        try {
            await apiClient.post(`/lembur/${id}/cancel-approve`, {});
            Swal.fire('Berhasil', 'Approval dibatalkan', 'success');
            fetchData();
        } catch (error) {
            Swal.fire('Gagal', 'Gagal membatalkan approval', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentId) {
                await apiClient.put(`/lembur/${currentId}`, formData);
            } else {
                await apiClient.post('/lembur', formData);
            }

            setShowModal(false);
            Swal.fire('Berhasil', 'Data berhasil disimpan', 'success');
            fetchData();
        } catch (error: any) {
            Swal.fire('Gagal', error.response?.data?.detail || 'Gagal menyimpan data', 'error');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case '0':
                return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-semibold dark:bg-yellow-900 dark:text-yellow-300">
                    <AlertCircle className="h-3 w-3" />
                    Pending
                </span>;
            case '1':
                return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-semibold dark:bg-green-900 dark:text-green-300">
                    <CheckCircle className="h-3 w-3" />
                    Approved
                </span>;
            case '2':
                return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-800 px-3 py-1 text-xs font-semibold dark:bg-red-900 dark:text-red-300">
                    <XCircle className="h-3 w-3" />
                    Rejected
                </span>;
            default:
                return <span>-</span>;
        }
    };

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Lembur" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <Clock className="w-6 h-6 text-brand-500" />
                        Management Lembur
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('lembur') && (
                            <button onClick={handleCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                                <Plus className="h-4 w-4" />
                                <span>Tambah Lembur</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <div className="relative col-span-1 md:col-span-2">
                        <input
                            type="text"
                            placeholder="Cari karyawan atau keterangan..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        />
                        <Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                    </div>

                    {isSuperAdmin && (
                        <div>
                            <SearchableSelect
                                options={[{ value: "", label: "Semua Vendor" }, ...vendorOptions]}
                                value={filterVendor}
                                onChange={setFilterVendor}
                                placeholder="Semua Vendor"
                            />
                        </div>
                    )}

                    <div>
                        <DatePicker
                            id="date-filter"
                            placeholder="Filter Tanggal"
                            defaultDate={dateFilter}
                            onChange={(dates: Date[], dateStr: string) => setDateFilter(dateStr)}
                        />
                    </div>
                    <div>
                        <SearchableSelect
                            options={[{ value: '', label: 'Semua Departemen' }, ...deptOptions.map(o => ({ value: o.kode_dept, label: o.nama_dept }))]}
                            value={searchDept}
                            onChange={val => setSearchDept(val)}
                            placeholder="Semua Departemen"
                        />
                    </div>
                    <div>
                        <SearchableSelect
                            options={[{ value: '', label: 'Semua Cabang' }, ...cabangOptions.map(o => ({ value: o.kode_cabang, label: o.nama_cabang }))]}
                            value={searchCabang}
                            onChange={val => setSearchCabang(val)}
                            placeholder="Semua Cabang"
                        />
                    </div>
                    <div>
                        <SearchableSelect
                            options={[
                                { value: '', label: 'Semua Status' },
                                { value: '0', label: 'Pending' },
                                { value: '1', label: 'Approved' },
                                { value: '2', label: 'Rejected' }
                            ]}
                            value={searchStatus}
                            onChange={val => setSearchStatus(val)}
                            placeholder="Semua Status"
                        />
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Karyawan</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Tanggal</th>
                                <th className="min-w-[180px] px-4 py-4 font-medium text-black dark:text-white">Waktu Lembur</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Keterangan</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada data.</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <h5 className="font-semibold text-black dark:text-white text-sm">{item.nama_karyawan}</h5>
                                            <p className="text-xs text-gray-500">{item.nama_dept}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{new Date(item.tanggal).toLocaleDateString('id-ID')}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-xs">{formatDateTime(item.lembur_mulai)}</p>
                                            <p className="text-gray-500 text-xs">s/d {formatDateTime(item.lembur_selesai)}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.keterangan}</p>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {getStatusBadge(item.status)}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                                <button onClick={() => handleViewDetail(item.id)} className="hover:text-blue-500 text-gray-500 dark:text-gray-400 transition" title="Detail">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {item.status === '0' && (
                                                    <>
                                                        <button onClick={() => handleEdit(item.id)} className="hover:text-yellow-500 text-gray-500 dark:text-gray-400" title="Edit">
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleApprove(item.id, true)} className="hover:text-green-500 text-gray-500 dark:text-gray-400" title="Approve">
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleApprove(item.id, false)} className="hover:text-red-500 text-gray-500 dark:text-gray-400" title="Reject">
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {item.status !== '0' && (
                                                    <button onClick={() => handleCancelApprove(item.id)} className="hover:text-orange-500 text-gray-500 dark:text-gray-400 transition" title="Cancel Approval">
                                                        <AlertCircle className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {canDelete('lembur') && (
                                                    <button onClick={() => handleDelete(item.id)} className="hover:text-red-500 text-gray-500 dark:text-gray-400 transition" title="Hapus">
                                                        <Trash className="h-4 w-4" />
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
                {filteredData.length > 0 && (
                    <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stroke pt-4 dark:border-strokedark">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, filteredData.length)} dari {filteredData.length} data
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4 shrink-0">
                            <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-brand-500" />
                                {isEditing ? 'Edit Lembur' : 'Tambah Lembur'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Karyawan</label>
                                    {!isEditing ? (
                                        <div className="relative z-[100] bg-white dark:bg-form-input">
                                            <SearchableSelect
                                                options={karyawanOptions.map(k => ({ value: k.nik, label: `${k.nama_karyawan} (${k.nik})` }))}
                                                value={formData.nik}
                                                onChange={(val) => setFormData({ ...formData, nik: val })}
                                                placeholder="Pilih Karyawan"
                                                usePortal={true}
                                            />
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-gray-50 dark:bg-meta-4 rounded-lg border border-stroke dark:border-strokedark flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-black dark:text-white">
                                                    {karyawanOptions.find(k => k.nik === formData.nik)?.nama_karyawan || formData.nik}
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
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Dari (Mulai)</label>
                                        <DatePicker
                                            id="form-dari"
                                            placeholder="Pilih Waktu Mulai"
                                            defaultDate={formData.dari}
                                            enableTime={true}
                                            dateFormat="Y-m-d H:i"
                                            staticDisplay={false}
                                            onChange={(dates: Date[], dateStr: string) => setFormData({ ...formData, dari: dateStr })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Sampai (Selesai)</label>
                                        <DatePicker
                                            id="form-sampai"
                                            placeholder="Pilih Waktu Selesai"
                                            defaultDate={formData.sampai}
                                            enableTime={true}
                                            dateFormat="Y-m-d H:i"
                                            staticDisplay={false}
                                            onChange={(dates: Date[], dateStr: string) => setFormData({ ...formData, sampai: dateStr })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Keterangan</label>
                                    <textarea
                                        value={formData.keterangan}
                                        onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                        rows={4}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-2.5 px-4 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500 resize-none"
                                        placeholder="Alasan lembur..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-stroke dark:border-strokedark flex justify-end gap-3 bg-gray-50 dark:bg-meta-4 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    disabled={loading}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-boxdark dark:text-gray-300 dark:border-strokedark dark:hover:bg-meta-4 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
                                >
                                    {loading ? (
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

            {/* Detail Modal */}
            {showDetailModal && selectedDetail && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText size={18} className="text-blue-500" /> Detail Lembur
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {selectedDetail.nama_karyawan} &bull; NIK: {selectedDetail.nik}
                                </p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500 dark:text-gray-400">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 overflow-y-auto min-h-0">
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jabatan</label>
                                    <p className="mt-1 font-medium text-gray-900 dark:text-white">{selectedDetail.nama_jabatan}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Departemen</label>
                                    <p className="mt-1 font-medium text-gray-900 dark:text-white">{selectedDetail.nama_dept}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cabang</label>
                                    <p className="mt-1 font-medium text-gray-900 dark:text-white">{selectedDetail.nama_cabang}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</label>
                                    <div className="mt-1">{getStatusBadge(selectedDetail.status)}</div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
                                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                                            <Clock size={12} className="text-green-500" /> Waktu Mulai
                                        </label>
                                        <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatDateTime(selectedDetail.lembur_mulai)}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                                            <Clock size={12} className="text-blue-500" /> Waktu Selesai
                                        </label>
                                        <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatDateTime(selectedDetail.lembur_selesai)}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Absen Masuk</label>
                                        <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatDateTime(selectedDetail.lembur_in)}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Absen Pulang</label>
                                        <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatDateTime(selectedDetail.lembur_out)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Keterangan</label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-line">{selectedDetail.keterangan || '-'}</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800 shrink-0">
                            <button onClick={() => setShowDetailModal(false)} className="rounded-xl px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition">Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

// Protect page with permission
export default withPermission(LemburPage, {
    permissions: ['lembur.index']
});
