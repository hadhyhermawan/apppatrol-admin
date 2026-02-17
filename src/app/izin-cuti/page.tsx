'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Plus, Search, Trash2, Edit, RefreshCw, FileText, ArrowLeft, ArrowRight, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

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

export default function IzinCutiPage() {
    const [data, setData] = useState<IzinCuti[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCabang, setSearchCabang] = useState('');
    const [searchDept, setSearchDept] = useState('');
    const [searchStatus, setSearchStatus] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

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

    useEffect(() => {
        fetchData();
        fetchOptions();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchCabang) params.append('kode_cabang', searchCabang);
            if (searchDept) params.append('kode_dept', searchDept);
            if (searchStatus) params.append('status', searchStatus);
            if (dateFrom) params.append('dari', dateFrom);
            if (dateTo) params.append('sampai', dateTo);

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
            const [karyawanRes, cabangRes, deptRes] = await Promise.all([
                apiClient.get('/master/karyawan/options'),
                apiClient.get('/master/cabang/options'),
                apiClient.get('/master/departemen/options')
            ]);
            setKaryawanOptions(karyawanRes as any);
            setCabangOptions(cabangRes as any);
            setDeptOptions(deptRes as any);
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
                        <button onClick={handleCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                            <Plus className="h-4 w-4" />
                            <span>Tambah Izin</span>
                        </button>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <div className="relative lg:col-span-2">
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
                    <div>
                        <select
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            value={searchCabang}
                            onChange={(e) => {
                                setSearchCabang(e.target.value);
                                fetchData();
                            }}
                        >
                            <option value="">Semua Cabang</option>
                            {cabangOptions.map(c => (
                                <option key={c.kode_cabang} value={c.kode_cabang}>{c.nama_cabang}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            value={searchDept}
                            onChange={(e) => {
                                setSearchDept(e.target.value);
                                fetchData();
                            }}
                        >
                            <option value="">Semua Dept</option>
                            {deptOptions.map(d => (
                                <option key={d.kode_dept} value={d.kode_dept}>{d.nama_dept}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            value={searchStatus}
                            onChange={(e) => {
                                setSearchStatus(e.target.value);
                                fetchData();
                            }}
                        >
                            <option value="">Semua Status</option>
                            <option value="0">Pending</option>
                            <option value="1">Approved</option>
                            <option value="2">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => {
                                setDateFrom(e.target.value);
                                fetchData();
                            }}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            placeholder="Dari"
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
                                                        const imgUrl = `https://k3guard.com/storage/${item.foto_bukti}`;
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
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleViewDetail(item.kode_cuti)} className="hover:text-blue-500 text-gray-500 dark:text-gray-400" title="Detail">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {item.status === '0' && (
                                                    <>
                                                        <button onClick={() => handleEdit(item.kode_cuti)} className="hover:text-yellow-500 text-gray-500 dark:text-gray-400" title="Edit">
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleApprove(item.kode_cuti, true)} className="hover:text-green-500 text-gray-500 dark:text-gray-400" title="Approve">
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleApprove(item.kode_cuti, false)} className="hover:text-red-500 text-gray-500 dark:text-gray-400" title="Reject">
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {item.status !== '0' && (
                                                    <button onClick={() => handleCancelApprove(item.kode_cuti)} className="hover:text-orange-500 text-gray-500 dark:text-gray-400" title="Cancel Approval">
                                                        <AlertCircle className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(item.kode_cuti)} className="hover:text-red-500 text-gray-500 dark:text-gray-400" title="Hapus">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
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
                <div className="fixed inset-0 z-999999 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl dark:bg-boxdark">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white text-2xl font-bold">✕</button>
                        <h3 className="mb-6 text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                            <FileText className="w-6 h-6 text-brand-500" />
                            {isEditing ? 'Edit Izin Cuti' : 'Tambah Izin Cuti'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-6 mb-6">
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white font-medium">Karyawan</label>
                                    <select
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-brand-500"
                                        value={formData.nik}
                                        onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                                        required
                                    >
                                        <option value="">Pilih Karyawan</option>
                                        {karyawanOptions.map(k => <option key={k.nik} value={k.nik}>{k.nama_karyawan}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-2.5 block text-black dark:text-white font-medium">Dari Tanggal</label>
                                        <input
                                            type="date"
                                            value={formData.dari}
                                            onChange={(e) => setFormData({ ...formData, dari: e.target.value })}
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-brand-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2.5 block text-black dark:text-white font-medium">Sampai Tanggal</label>
                                        <input
                                            type="date"
                                            value={formData.sampai}
                                            onChange={(e) => setFormData({ ...formData, sampai: e.target.value })}
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-brand-500"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white font-medium">Keterangan</label>
                                    <textarea
                                        value={formData.keterangan}
                                        onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                        rows={4}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-brand-500"
                                        placeholder="Alasan izin cuti..."
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark">
                                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg bg-gray-200 px-6 py-2.5 font-medium text-black hover:bg-gray-300 transition">Batal</button>
                                <button type="submit" className="rounded-lg bg-brand-500 px-6 py-2.5 font-medium text-white hover:bg-opacity-90 transition shadow-sm">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedDetail && (
                <div className="fixed inset-0 z-999999 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-3xl rounded-2xl bg-white p-8 shadow-2xl dark:bg-boxdark">
                        <button onClick={() => setShowDetailModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white text-2xl font-bold">✕</button>
                        <h3 className="mb-6 text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                            <Eye className="w-6 h-6 text-brand-500" />
                            Detail Izin Cuti
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">Kode Izin</label>
                                    <p className="font-semibold text-black dark:text-white">{selectedDetail.kode_cuti}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">NIK</label>
                                    <p className="font-semibold text-black dark:text-white">{selectedDetail.nik}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">Karyawan</label>
                                    <p className="font-semibold text-black dark:text-white">{selectedDetail.nama_karyawan}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">Jabatan</label>
                                    <p className="font-semibold text-black dark:text-white">{selectedDetail.nama_jabatan}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">Departemen</label>
                                    <p className="font-semibold text-black dark:text-white">{selectedDetail.nama_dept}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 dark:text-gray-400">Cabang</label>
                                    <p className="font-semibold text-black dark:text-white">{selectedDetail.nama_cabang}</p>
                                </div>
                            </div>

                            <div className="border-t border-stroke pt-4 dark:border-strokedark">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-500 dark:text-gray-400">Dari Tanggal</label>
                                        <p className="font-semibold text-black dark:text-white">{formatDate(selectedDetail.dari)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 dark:text-gray-400">Sampai Tanggal</label>
                                        <p className="font-semibold text-black dark:text-white">{formatDate(selectedDetail.sampai)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 dark:text-gray-400">Jumlah Hari</label>
                                        <p className="font-semibold text-brand-500">{calculateDays(selectedDetail.dari, selectedDetail.sampai)} hari</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-stroke pt-4 dark:border-strokedark">
                                <label className="text-sm text-gray-500 dark:text-gray-400">Keterangan</label>
                                <p className="font-semibold text-black dark:text-white">{selectedDetail.keterangan}</p>
                            </div>

                            {selectedDetail.keterangan_hrd && (
                                <div className="border-t border-stroke pt-4 dark:border-strokedark">
                                    <label className="text-sm text-gray-500 dark:text-gray-400">Keterangan HRD</label>
                                    <p className="font-semibold text-black dark:text-white">{selectedDetail.keterangan_hrd}</p>
                                </div>
                            )}

                            <div className="border-t border-stroke pt-4 dark:border-strokedark">
                                <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
                                <div className="mt-2">{getStatusBadge(selectedDetail.status)}</div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-stroke pt-4 mt-6 dark:border-strokedark">
                            <button onClick={() => setShowDetailModal(false)} className="rounded-lg bg-gray-200 px-6 py-2.5 font-medium text-black hover:bg-gray-300 transition">Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
