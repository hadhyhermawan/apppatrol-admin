'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Plus, Search, Trash, Edit, RefreshCw, FileText, ArrowLeft, ArrowRight, Eye, CheckCircle, XCircle, AlertCircle, X, Save } from 'lucide-react';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import SearchableSelect from '@/components/form/SearchableSelect';
import dynamic from 'next/dynamic';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />,
});

type OptionItem = { value: string; label: string };

type IzinCuti = {
    kode_cuti: string;
    nik: string;
    nama_karyawan: string;
    nama_jabatan: string;
    nama_dept: string;
    nama_cabang: string;
    tanggal: string;
    dari: string;
    sampai: string;
    keterangan: string;
    keterangan_hrd: string | null;
    foto_bukti: string | null;
    status: string; // '0'=pending, '1'=approved, '2'=rejected
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

function IzinCutiPage() {
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = usePermissions();
    const [data, setData] = useState<IzinCuti[]>([]);
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
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<IzinCuti | null>(null);

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

            const res: any = await apiClient.get(`/izin?${params.toString()}`);
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
                apiClient.get(`/master/departemen/options?${cabParams.toString()}`)
            ];

            if (isSuperAdmin) {
                calls.push(apiClient.get('/vendors'));
            }

            const results = await Promise.all(calls);
            setKaryawanOptions(results[0] as any);
            setCabangOptions(results[1] as any);
            setDeptOptions(results[2] as any);

            if (isSuperAdmin && results[3]) {
                const vData = Array.isArray(results[3]) ? results[3] : ((results[3] as any)?.data || []);
                setVendorOptions(vData.map((v: any) => ({ value: String(v.id), label: v.nama_vendor })));
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
            item.kode_cuti.toLowerCase().includes(searchTerm.toLowerCase())
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

    const handleEdit = async (id: string) => {
        try {
            const res: any = await apiClient.get(`/izin/${id}`);
            setFormData({
                nik: res.nik,
                dari: res.dari,
                sampai: res.sampai,
                keterangan: res.keterangan
            });
            setCurrentId(id);
            setIsEditing(true);
            setShowModal(true);
        } catch (error) {
            Swal.fire('Error', 'Gagal memuat data', 'error');
        }
    };

    const handleViewDetail = async (id: string) => {
        try {
            const res: any = await apiClient.get(`/izin/${id}`);
            setSelectedDetail(res);
            setShowDetailModal(true);
        } catch (error) {
            Swal.fire('Error', 'Gagal memuat detail', 'error');
        }
    };

    const handleDelete = (id: string) => {
        Swal.fire({
            title: 'Hapus Data?',
            text: "Data izin cuti ini akan dihapus!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/izin/${id}`);
                    Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
                    fetchData();
                } catch (error) {
                    Swal.fire('Gagal!', 'Gagal menghapus data.', 'error');
                }
            }
        });
    };

    const handleApprove = async (id: string, approve: boolean) => {
        try {
            await apiClient.post(`/izin/${id}/approve`, { approve });
            Swal.fire('Berhasil', approve ? 'Izin absen disetujui' : 'Izin absen ditolak', 'success');
            fetchData();
        } catch (error) {
            Swal.fire('Gagal', 'Gagal memproses approval', 'error');
        }
    };

    const handleCancelApprove = async (id: string) => {
        try {
            await apiClient.post(`/izin/${id}/cancel-approve`, {});
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
                await apiClient.put(`/izin/${currentId}`, formData);
            } else {
                await apiClient.post('/izin', formData);
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

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const calculateDays = (dari: string, sampai: string) => {
        const start = new Date(dari);
        const end = new Date(sampai);
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
        return diff;
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Izin Cuti" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-brand-500" />
                        Management Izin Cuti
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('izin') && (
                            <button onClick={handleCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                                <Plus className="h-4 w-4" />
                                <span>Tambah Izin</span>
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
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">Kode</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">NIK</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Karyawan</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Jabatan</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">Dept</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">Cabang</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Bukti Foto</th>
                                <th className="min-w-[80px] px-4 py-4 font-medium text-black dark:text-white">Lama</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-500">Tidak ada data.</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.kode_cuti} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex rounded-full bg-gray-100 text-gray-800 px-3 py-1 text-xs font-semibold dark:bg-meta-4 dark:text-gray-300">
                                                {item.kode_cuti}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm font-mono">{item.nik}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <h5 className="font-semibold text-black dark:text-white text-sm">{item.nama_karyawan}</h5>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.nama_jabatan}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.nama_dept}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.nama_cabang}</p>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {item.foto_bukti ? (
                                                <button
                                                    onClick={() => {
                                                        const imgUrl = `${process.env.NEXT_PUBLIC_API_URL}/storage/${item.foto_bukti}`;
                                                        window.open(imgUrl, '_blank');
                                                    }}
                                                    className="inline-flex items-center gap-1 px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium dark:bg-meta-4 dark:hover:bg-meta-4/70 dark:text-gray-300"
                                                >
                                                    <Eye className="h-3 w-3" />
                                                    Lihat
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-brand-500 text-sm font-semibold">{calculateDays(item.dari, item.sampai)} Hari</p>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {getStatusBadge(item.status)}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                                <button onClick={() => handleViewDetail(item.kode_cuti)} className="hover:text-blue-500 text-gray-500 dark:text-gray-400 transition" title="Detail">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {item.status === '0' && (
                                                    <>
                                                        {canUpdate('izin') && (
                                                            <button onClick={() => handleEdit(item.kode_cuti)} className="hover:text-yellow-500 text-gray-500 dark:text-gray-400 transition" title="Edit">
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {canUpdate('izin') && (
                                                            <>
                                                                <button onClick={() => handleApprove(item.kode_cuti, true)} className="hover:text-green-500 text-gray-500 dark:text-gray-400 transition" title="Approve">
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </button>
                                                                <button onClick={() => handleApprove(item.kode_cuti, false)} className="hover:text-red-500 text-gray-500 dark:text-gray-400 transition" title="Reject">
                                                                    <XCircle className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                                {item.status !== '0' && canUpdate('izin') && (
                                                    <button onClick={() => handleCancelApprove(item.kode_cuti)} className="hover:text-orange-500 text-gray-500 dark:text-gray-400 transition" title="Cancel Approval">
                                                        <AlertCircle className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {canDelete('izin') && (
                                                    <button onClick={() => handleDelete(item.kode_cuti)} className="hover:text-red-500 text-gray-500 dark:text-gray-400 transition" title="Hapus">
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
                                <FileText className="w-5 h-5 text-brand-500" />
                                {isEditing ? 'Edit Izin Cuti' : 'Tambah Izin Cuti'}
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
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Dari Tanggal</label>
                                        <DatePicker
                                            id="form-dari"
                                            placeholder="Pilih Tanggal Mulai"
                                            defaultDate={formData.dari}
                                            staticDisplay={false}
                                            onChange={(dates: Date[], dateStr: string) => setFormData({ ...formData, dari: dateStr })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Sampai Tanggal</label>
                                        <DatePicker
                                            id="form-sampai"
                                            placeholder="Pilih Tanggal Selesai"
                                            defaultDate={formData.sampai}
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
                                        placeholder="Alasan izin cuti..."
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
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-3xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4 shrink-0">
                            <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                                <Eye className="w-5 h-5 text-brand-500" />
                                Detail Izin Cuti
                            </h3>
                            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Kode Izin</label>
                                    <p className="font-semibold text-black dark:text-white">{selectedDetail.kode_cuti}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">NIK</label>
                                    <p className="font-semibold text-black dark:text-white">{selectedDetail.nik}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Karyawan</label>
                                    <p className="font-semibold text-black dark:text-white">{selectedDetail.nama_karyawan}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Jabatan</label>
                                    <p className="font-semibold text-black dark:text-white">{selectedDetail.nama_jabatan}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Departemen</label>
                                    <p className="font-semibold text-black dark:text-white">{selectedDetail.nama_dept}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Cabang</label>
                                    <p className="font-semibold text-black dark:text-white">{selectedDetail.nama_cabang}</p>
                                </div>
                            </div>

                            <div className="border-t border-stroke pt-6 dark:border-strokedark">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Dari Tanggal</label>
                                        <p className="font-semibold text-black dark:text-white">{formatDate(selectedDetail.dari)}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Sampai Tanggal</label>
                                        <p className="font-semibold text-black dark:text-white">{formatDate(selectedDetail.sampai)}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Jumlah Hari</label>
                                        <p className="font-semibold text-brand-500">{calculateDays(selectedDetail.dari, selectedDetail.sampai)} Hari</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-stroke pt-6 dark:border-strokedark">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Keterangan Izin</label>
                                <div className="bg-gray-50 dark:bg-meta-4 p-4 rounded-lg">
                                    <p className="font-medium text-black dark:text-white whitespace-pre-wrap">{selectedDetail.keterangan}</p>
                                </div>
                            </div>

                            {selectedDetail.keterangan_hrd && (
                                <div className="border-t border-stroke pt-6 dark:border-strokedark">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Catatan HRD</label>
                                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 p-4 rounded-lg">
                                        <p className="font-medium text-orange-800 dark:text-orange-200">{selectedDetail.keterangan_hrd}</p>
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-stroke pt-6 dark:border-strokedark">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Status Approval</label>
                                <div>{getStatusBadge(selectedDetail.status)}</div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4 shrink-0 flex justify-end">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-boxdark dark:text-gray-300 dark:border-strokedark dark:hover:bg-meta-4 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

export default withPermission(IzinCutiPage, {
    permissions: ['izin.index']
});
