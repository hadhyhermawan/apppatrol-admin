'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Search, Trash2, ArrowLeft, ArrowRight, Monitor, User, Calendar, Smartphone, Shield } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import flatpickr from "flatpickr";
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import "flatpickr/dist/flatpickr.min.css";

type LogItem = {
    id: number;
    user_name: string;
    email: string;
    branch_name: string | null;
    ip: string;
    device: string | null;
    android_version: string | null;
    login_at: string;
    logout_at: string | null;
};

function UtilitiesLogsPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [userFilter, setUserFilter] = useState('');
    const [ipFilter, setIpFilter] = useState('');
    const [deviceFilter, setDeviceFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

    useEffect(() => {
        flatpickr(".flatpickr-date", {
            dateFormat: "Y-m-d",
            allowInput: true,
            onChange: (selectedDates, dateStr, instance) => {
                const inputElement = instance.element as HTMLInputElement;
                if (inputElement.name === "from") setFromDate(dateStr);
                if (inputElement.name === "to") setToDate(dateStr);
            }
        });
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (userFilter) params.append('user', userFilter);
            if (ipFilter) params.append('ip', ipFilter);
            if (deviceFilter) params.append('device', deviceFilter);
            if (fromDate) params.append('from', fromDate);
            if (toDate) params.append('to', toDate);
            params.append('limit', '100');

            const response: any = await apiClient.get(`/utilities/logs?${params.toString()}`);
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch logs", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Client-side pagination for the fetched batch
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return data.slice(start, start + perPage);
    }, [data, currentPage, perPage]);

    const totalPages = Math.ceil(data.length / perPage);

    const handleDelete = (id: number) => {
        Swal.fire({
            title: 'Apakah anda yakin?',
            text: "Data log akan dihapus permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/utilities/logs/${id}`);
                    Swal.fire('Terhapus!', 'Log berhasil dihapus.', 'success');
                    fetchData();
                } catch (error) {
                    Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus log.', 'error');
                }
            }
        });
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Login Logs" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-brand-500" />
                        Monitoring Login Logs
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
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari User..."
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            />
                            <User className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari IP Address..."
                                value={ipFilter}
                                onChange={(e) => setIpFilter(e.target.value)}
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            />
                            <Monitor className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari Device..."
                                value={deviceFilter}
                                onChange={(e) => setDeviceFilter(e.target.value)}
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            />
                            <Smartphone className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                        </div>
                        <div className="relative">
                            <input
                                name="from"
                                type="text"
                                placeholder="Tanggal Dari"
                                className="flatpickr-date w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            />
                            <Calendar className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex gap-2">
                            <input
                                name="to"
                                type="text"
                                placeholder="Tanggal Sampai"
                                className="flatpickr-date w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            />
                            <button onClick={() => { setCurrentPage(1); fetchData(); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                                <Search className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">User Info</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Lokasi / IP</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Perangkat</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Waktu Login</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data logs...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Tidak ada data logs ditemukan.</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-black dark:text-white text-sm">{item.user_name}</span>
                                                <span className="text-xs text-gray-500">{item.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-black dark:text-white">{item.branch_name || '-'}</span>
                                                <span className="text-xs font-mono text-gray-500">{item.ip}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-black dark:text-white truncate max-w-[150px]" title={item.device || ''}>{item.device || '-'}</span>
                                                <span className="text-xs text-gray-500">{item.android_version ? `Android ${item.android_version}` : ''}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-black dark:text-white">{new Date(item.login_at).toLocaleString()}</span>
                                                {item.logout_at && <span className="text-xs text-gray-500">Logout: {new Date(item.logout_at).toLocaleString()}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {canDelete('logs') && (
                                                    <button
                                                onClick={() => handleDelete(item.id)}
                                                className="hover:text-red-500 text-gray-500 dark:text-gray-400 transition-colors"
                                                title="Hapus Log"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                                )}
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

// Protect page with permission
export default withPermission(UtilitiesLogsPage, {
    permissions: ['logs.index']
});
