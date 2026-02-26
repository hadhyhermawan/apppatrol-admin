'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Search, Plus, Edit, Trash, RefreshCw, Car, Info, Navigation, Calendar } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import Link from 'next/link';

type TaskItem = {
    id: number;
    user_id: number;
    driver_name: string;
    p2h_id: number | null;
    kendaraan_name: string;
    plat_nomor: string;
    nama_tamu: string;
    tujuan_perjalanan: string;
    lokasi_jemput: string;
    jadwal_jemput: string;
    status: string;
};

export default function DriverTasksPage() {
    const [data, setData] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `/driver/tasks?page=${currentPage}&per_page=${perPage}`;
            if (searchTerm) url += `&search=${searchTerm}`;

            const response: any = await apiClient.get(url);
            if (response.status) {
                setData(response.data);
                if (response.meta) {
                    setTotalPages(response.meta.total_pages);
                    setTotalItems(response.meta.total_items);
                }
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch Tasks", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchData(), 300);
        return () => clearTimeout(timer);
    }, [searchTerm, currentPage, perPage]);

    const handleRefresh = () => {
        if (searchTerm === '' && currentPage === 1) {
            fetchData();
        } else {
            setSearchTerm('');
            setCurrentPage(1);
        }
    };

    const handleDelete = async (id: number, nama_tamu: string) => {
        const result = await Swal.fire({
            title: 'Apakah Anda Yakin?',
            text: `Tugas/Job Order untuk tamu: ${nama_tamu} akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/driver/tasks/${id}`);
            Swal.fire({
                title: 'Terhapus!',
                text: 'Job Order berhasil dihapus.',
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

    const getStatusBadge = (status: string) => {
        if (status === 'ASSIGNED') {
            return <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">Assigned</span>;
        } else if (status === 'ON_THE_WAY_PICKUP') {
            return <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400">Menuju Lokasi</span>;
        } else if (status === 'PICKED_UP') {
            return <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">Tamu Dijemput</span>;
        } else if (status === 'COMPLETED') {
            return <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">Completed</span>;
        } else if (status === 'CANCELED') {
            return <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">Dibatalkan</span>;
        } else {
            return <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Driver Tasks / Job Orders" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <Navigation className="w-6 h-6 text-brand-500" />
                        Daftar Job Order Driver
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={handleRefresh} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <Link
                            href="/driver/tasks/create"
                            className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm hover:shadow-md"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Buat Task Baru</span>
                        </Link>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="relative w-full max-w-sm">
                        <input
                            type="text"
                            placeholder="Cari driver atau nama tamu..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        />
                        <Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800 border-b border-stroke dark:border-strokedark">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Jadwal Jemput</th>
                                <th className="min-w-[180px] px-4 py-4 font-medium text-black dark:text-white">Driver / P2H</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Informasi Tamu</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Tujuan</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 font-medium">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 font-medium">Tidak ada data ditemukan</td></tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-colors">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2 text-black dark:text-white text-sm font-medium">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {item.jadwal_jemput ? item.jadwal_jemput.slice(0, 16).replace('T', ' ') : '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                        <Car className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span className="font-semibold text-black dark:text-white text-sm">{item.driver_name}</span>
                                                </div>
                                                {item.p2h_id ? (
                                                    <span className="text-xs text-gray-500 ml-9 bg-gray-100 px-2 py-0.5 rounded-full dark:bg-gray-800 w-fit">{item.kendaraan_name} - {item.plat_nomor}</span>
                                                ) : (
                                                    <span className="text-xs text-orange-500 ml-9 italic">Belum assign P2H</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col text-sm">
                                                <span className="font-medium text-black dark:text-white">{item.nama_tamu || '-'}</span>
                                                <span className="text-xs text-gray-500 truncate max-w-[150px]" title={item.lokasi_jemput}>Jemput: {item.lokasi_jemput || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm truncate max-w-[150px] font-medium" title={item.tujuan_perjalanan}>
                                                {item.tujuan_perjalanan || '-'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {getStatusBadge(item.status)}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <Link
                                                    href={`/driver/tasks/edit/${item.id}`}
                                                    className="p-1.5 hover:text-brand-500 hover:bg-brand-50 rounded-lg text-gray-500 dark:text-gray-400 dark:hover:bg-brand-500/10 transition-colors"
                                                    title="Edit Data"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(item.id, item.nama_tamu)}
                                                    className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-lg text-gray-500 dark:text-gray-400 dark:hover:bg-red-500/10 transition-colors"
                                                    title="Hapus Data"
                                                >
                                                    <Trash className="h-4 w-4" />
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
                <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stroke pt-4 dark:border-strokedark">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, totalItems)} dari {totalItems} data
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading || totalPages === 0}
                            className="px-3 py-1 rounded-lg border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4 text-sm font-medium transition-colors"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || loading || totalPages === 0}
                            className="px-3 py-1 rounded-lg border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4 text-sm font-medium transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
