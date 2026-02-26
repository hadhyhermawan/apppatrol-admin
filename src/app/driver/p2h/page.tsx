'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Search, Plus, Edit, Trash, RefreshCw, ClipboardCheck, Info } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import Link from 'next/link';

type P2HItem = {
    id: number;
    user_id: number;
    driver_name: string;
    kendaraan_id: number;
    kendaraan_name: string;
    plat_nomor: string;
    tanggal: string;
    odometer_awal: number;
    status_p2h: string;
};

export default function DriverP2HPage() {
    const [data, setData] = useState<P2HItem[]>([]);
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
            let url = `/driver/p2h?page=${currentPage}&per_page=${perPage}`;
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
            console.error("Failed to fetch P2H", error);
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

    const handleDelete = async (id: number, tgl: string, nama: string) => {
        const result = await Swal.fire({
            title: 'Apakah Anda Yakin?',
            text: `Data P2H ${nama} tanggal ${tgl} akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/driver/p2h/${id}`);
            Swal.fire({
                title: 'Terhapus!',
                text: 'Data P2H berhasil dihapus.',
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
        if (status === 'APPROVED') {
            return <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">Approved</span>;
        } else if (status === 'PENDING') {
            return <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400">Pending</span>;
        } else if (status === 'REJECTED') {
            return <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">Rejected</span>;
        } else {
            return <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Data P2H (Pemeriksaan Kendaraan)" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                        Daftar Pemeriksaan Harian
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={handleRefresh} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <Link
                            href="/driver/p2h/create"
                            className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Buat P2H</span>
                        </Link>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="relative w-full max-w-sm">
                        <input
                            type="text"
                            placeholder="Cari driver atau kendaraan..."
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
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Tanggal</th>
                                <th className="min-w-[180px] px-4 py-4 font-medium text-black dark:text-white">Driver</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Kendaraan</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white text-center">Odometer Awal</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Status</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td></tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm font-medium">{item.tanggal}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-meta-4">
                                                    <Info className="h-5 w-5" />
                                                </div>
                                                <h5 className="font-medium text-black dark:text-white text-sm">{item.driver_name}</h5>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.kendaraan_name}</p>
                                            <span className="text-xs text-gray-500">{item.plat_nomor}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{item.odometer_awal} km</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            {getStatusBadge(item.status_p2h)}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <Link
                                                    href={`/driver/p2h/edit/${item.id}`}
                                                    className="hover:text-brand-500 text-gray-500 dark:text-gray-400"
                                                    title="Edit Data"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(item.id, item.tanggal, item.driver_name)}
                                                    className="hover:text-red-500 text-gray-500 dark:text-gray-400"
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
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, totalItems)} dari {totalItems} data
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading || totalPages === 0}
                            className="px-3 py-1 rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4 text-sm"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || loading || totalPages === 0}
                            className="px-3 py-1 rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4 text-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

