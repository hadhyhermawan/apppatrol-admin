'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Search, Shield, Trash2, ArrowLeft, ArrowRight, User, Building, MapPin, AlertTriangle, Monitor, Smartphone, FileText } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';

type SecurityReportItem = {
    id: number;
    created_at: string;
    user_name: string;
    user_nik: string;
    branch_name: string;
    dept_name: string;
    type: string;
    detail: string | null;
    device_model: string | null;
    ip_address: string | null;
    status_flag: string;
};

export default function UtilitiesSecurityReportsPage() {
    const [data, setData] = useState<SecurityReportItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [keyword, setKeyword] = useState('');
    const [nikFilter, setNikFilter] = useState('');
    const [kodeCabang, setKodeCabang] = useState('');
    const [kodeDept, setKodeDept] = useState('');

    // Dropdown Data State (Mocked or assume we have endpoints, but for now we can rely on manual input or fetch)
    // To match user request perfectly, we should ideally fetch branches/depts if needed, but for MVP let's stick to text or simple inputs first
    // or reuse existing hooks. For now I will use text inputs for filters to be quick, or check if I can fetch select options.

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);
            if (nikFilter) params.append('nik_filter', nikFilter);
            if (kodeCabang) params.append('kode_cabang', kodeCabang);
            if (kodeDept) params.append('kode_dept', kodeDept);
            params.append('limit', '100');

            const response: any = await apiClient.get(`/utilities/security-reports?${params.toString()}`);
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch reports", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1);
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [keyword, nikFilter, kodeCabang, kodeDept]);

    // Client-side pagination
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return data.slice(start, start + perPage);
    }, [data, currentPage, perPage]);

    const totalPages = Math.ceil(data.length / perPage);

    const handleDelete = (id: number) => {
        Swal.fire({
            title: 'Hapus Laporan?',
            text: "Data laporan akan dihapus permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/utilities/security-reports/${id}`);
                    Swal.fire('Terhapus!', 'Laporan berhasil dihapus.', 'success');
                    fetchData();
                } catch (error) {
                    Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus laporan.', 'error');
                }
            }
        });
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Laporan Keamanan" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-brand-500" />
                        Daftar Laporan Keamanan
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="mb-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari NIK / Karyawan..."
                                value={nikFilter}
                                onChange={(e) => setNikFilter(e.target.value)}
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            />
                            <User className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                        </div>
                        {/* Simple placeholder inputs for filters - could be Selects if we fetched lists */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Kode Cabang..."
                                value={kodeCabang}
                                onChange={(e) => setKodeCabang(e.target.value)}
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            />
                            <Building className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Kode Dept..."
                                value={kodeDept}
                                onChange={(e) => setKodeDept(e.target.value)}
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            />
                            <MapPin className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Keyword (Tipe...)"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            />
                            <Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center w-12">No</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white min-w-[140px]">Tanggal</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white min-w-[150px]">User</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white min-w-[150px]">Cabang / Dept</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Tipe</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white min-w-[200px]">Detail</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white min-w-[150px]">Device</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Memuat data laporan...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Tidak ada laporan ditemukan.</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-black dark:text-white font-medium">{item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}</span>
                                                <span className="text-xs text-gray-500">{item.created_at ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-black dark:text-white font-medium">{item.user_name}</span>
                                                <span className="text-xs text-gray-500">{item.user_nik || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-black dark:text-white">{item.branch_name || '-'}</span>
                                                <span className="text-xs text-gray-500">{item.dept_name || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${item.type === 'FACE_LIVENESS_LOCK'
                                                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 max-w-[250px]" title={item.detail || ''}>
                                                {item.detail || '-'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-black dark:text-white truncate max-w-[150px]" title={item.device_model || ''}>{item.device_model || '-'}</span>
                                                <span className="text-xs font-mono text-gray-500">{item.ip_address || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {item.status_flag === 'auto-flag' || item.status_flag?.includes('lock') ? (
                                                <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-red-500 text-white">
                                                    Blocked
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-green-500 text-white">
                                                    Logged
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="hover:text-red-500 text-gray-500 dark:text-gray-400 transition-colors"
                                                title="Hapus Laporan"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data.length > 0 && (
                    <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stroke pt-4 dark:border-strokedark">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, data.length)} dari {data.length} data
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
        </MainLayout>
    );
}
