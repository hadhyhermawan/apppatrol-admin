'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, MessageCircle, Users, Trash2, Search, Filter } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

type ThreadItem = {
    room: string;
    total_messages: number;
    total_participants: number;
    last_message_id: number;
    last_sender_id: string | null;
    last_sender_name: string | null;
    last_message_text: string | null;
    last_message_at: string | null;
};

type SummaryStats = {
    total_messages: number;
    total_threads: number;
    total_senders: number;
};

export default function ChatManagementPage() {
    const router = useRouter();
    const [data, setData] = useState<ThreadItem[]>([]);
    const [summary, setSummary] = useState<SummaryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(20);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) {
                params.append('room', searchTerm);
            }
            params.append('page', page.toString());
            params.append('limit', limit.toString());

            const response: any = await apiClient.get(`/chat-management?${params.toString()}`);
            setData(response.data || []);
            setSummary(response.summary || null);
            setTotalPages(Math.ceil((response.meta?.total || 1) / limit));
        } catch (error) {
            console.error("Failed to fetch chat logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, searchTerm]);

    const handleDeleteThread = (room: string) => {
        Swal.fire({
            title: 'Hapus Thread?',
            text: "Seluruh pesan dalam obrolan ini akan dihapus permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/chat-management/thread/${encodeURIComponent(room)}`);
                    Swal.fire('Terhapus!', 'Thread berhasil dihapus.', 'success');
                    fetchData();
                } catch (error) {
                    Swal.fire('Gagal!', 'Gagal menghapus thread.', 'error');
                }
            }
        });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Manajemen Obrolan (Walkie Talkie)" />

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
                    <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-title-md font-bold text-black dark:text-white">{summary.total_threads}</h4>
                                <span className="text-sm font-medium">Total Thread</span>
                            </div>
                            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                                <MessageCircle className="text-primary" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-title-md font-bold text-black dark:text-white">{summary.total_messages}</h4>
                                <span className="text-sm font-medium">Total Pesan</span>
                            </div>
                            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                                <MessageCircle className="text-primary" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-title-md font-bold text-black dark:text-white">{summary.total_senders}</h4>
                                <span className="text-sm font-medium">Total Partisipan</span>
                            </div>
                            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
                                <Users className="text-primary" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 gap-4 max-w-md">
                        <div className="relative w-full">
                            <button className="absolute left-0 top-1/2 -translate-y-1/2 pl-3">
                                <Search className="h-4 w-4 text-gray-500" />
                            </button>
                            <input
                                type="text"
                                placeholder="Cari nama room..."
                                className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchData} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Room</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Pesan</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Partisipan</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Pesan Terakhir</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan.</td></tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={idx} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-black dark:text-white font-semibold">
                                            <Link href={`/utilities/chat-management/thread/${encodeURIComponent(item.room)}`} className="text-primary hover:underline">
                                                {item.room}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-4 text-center text-black dark:text-white">
                                            {item.total_messages}
                                        </td>
                                        <td className="px-4 py-4 text-center text-black dark:text-white">
                                            {item.total_participants}
                                        </td>
                                        <td className="px-4 py-4 text-black dark:text-white max-w-xs truncate">
                                            {item.last_message_text ? (
                                                <div>
                                                    <div className="truncate text-gray-800 dark:text-gray-200">"{item.last_message_text}"</div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Oleh: {item.last_sender_name} • {formatDate(item.last_message_at)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">Tidak ada pesan</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button onClick={() => handleDeleteThread(item.room)} className="text-red-500 hover:text-red-700 transition" title="Hapus Thread">
                                                <Trash2 className="h-4 w-4 mx-auto" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                        <nav className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span className="px-3 py-1">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
