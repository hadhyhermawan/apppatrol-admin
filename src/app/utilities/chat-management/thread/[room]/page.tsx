'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { ArrowLeft, Send, Trash2, Paperclip, Search, User } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { useParams, useRouter } from 'next/navigation';

type ChatMessage = {
    id: number;
    room: string;
    sender_id: string;
    sender_nama: string;
    role: string;
    message: string;
    created_at: string;
    reply_to: string | null;
    attachment: string | null;
    attachment_type: string | null;
    reply_sender_nama: string | null;
    reply_message: string | null;
};

type SummaryStats = {
    total_messages: number;
    total_participants: number;
    first_message_at: string;
    last_message_at: string;
};

export default function ChatThreadPage() {
    const params = useParams();
    // Decode the room parameter manually as it might be double encoded or contain special chars
    const room = decodeURIComponent(params.room as string);

    // In React/Next.js client components using hooks, we should use state for loading
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [summary, setSummary] = useState<SummaryStats | null>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchData = async (reset = false) => {
        setLoading(true);
        try {
            const p = reset ? 1 : page;
            const res: any = await apiClient.get(`/chat-management/thread/${encodeURIComponent(room)}`, {
                params: {
                    limit: 50,
                    page: p,
                    q: filterText
                }
            });

            if (reset) {
                setMessages(res.data);
            } else {
                setMessages(prev => [...prev, ...res.data]);
            }

            setSummary(res.summary);
            setParticipants(res.participants);
            setHasMore(res.data.length === 50);

        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Gagal memuat obrolan', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(true);
    }, [filterText]); // Reload when filter changes

    const handleDeleteMessage = (id: number) => {
        Swal.fire({
            title: 'Hapus Pesan?',
            text: "Pesan ini akan dihapus permanen.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Hapus'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/chat-management/${id}`);
                    setMessages(prev => prev.filter(m => m.id !== id));
                    Swal.fire('Terhapus!', 'Pesan dihapus.', 'success');
                } catch (error) {
                    Swal.fire('Gagal!', 'Gagal menghapus pesan.', 'error');
                }
            }
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    const getInitials = (name: string) => {
        return name ? name.substring(0, 2).toUpperCase() : '??';
    };

    return (
        <MainLayout>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                        <Link href="/utilities/chat-management" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        Room: {room}
                    </h2>
                    {summary && (
                        <p className="text-sm text-gray-500 ml-9 mt-1">
                            {summary.total_messages} Pesan • {summary.total_participants} Partisipan • {formatDate(summary.first_message_at)} s/d {formatDate(summary.last_message_at)}
                        </p>
                    )}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Cari pesan..."
                        className="pl-9 pr-4 py-2 rounded-lg border border-stroke bg-white dark:bg-boxdark dark:border-strokedark text-sm focus:border-primary focus:outline-none"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">

                {/* Chat Area */}
                <div className="lg:col-span-3 flex flex-col bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-xl shadow-sm overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                        {loading && messages.length === 0 ? (
                            <div className="flex justify-center items-center h-full text-gray-500">Memuat obrolan...</div>
                        ) : messages.length === 0 ? (
                            <div className="flex justify-center items-center h-full text-gray-500">Tidak ada pesan ditemukan.</div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-3 group`}>
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                            {getInitials(msg.sender_nama)}
                                        </div>
                                    </div>
                                    <div className="flex-1 max-w-[85%]">
                                        <div className="flex items-baseline justify-between mb-1">
                                            <span className="font-bold text-sm text-black dark:text-white mr-2">{msg.sender_nama}</span>
                                            <span className="text-xs text-gray-400">{formatDate(msg.created_at)}</span>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700 relative">
                                            {msg.reply_to && (
                                                <div className="mb-2 pl-3 border-l-4 border-gray-300 dark:border-gray-600">
                                                    <p className="text-xs font-semibold text-gray-500">{msg.reply_sender_nama || 'Deleted User'}</p>
                                                    <p className="text-xs text-gray-400 line-clamp-1">{msg.reply_message || 'Deleted Message'}</p>
                                                </div>
                                            )}

                                            <p className="text-sm whitespace-pre-wrap dark:text-gray-200">{msg.message}</p>

                                            {msg.attachment && (
                                                <div className="mt-2">
                                                    {msg.attachment_type === 'image' ? (
                                                        <img
                                                            src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${msg.attachment}`}
                                                            alt="Attachment"
                                                            className="max-w-full h-auto rounded-lg max-h-60 cursor-pointer hover:opacity-90 transition"
                                                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/storage/${msg.attachment}`, '_blank')}
                                                        />
                                                    ) : (
                                                        <a
                                                            href={`${process.env.NEXT_PUBLIC_API_URL}/storage/${msg.attachment}`}
                                                            target="_blank"
                                                            className="flex items-center gap-2 text-sm text-primary hover:underline bg-primary/5 p-2 rounded"
                                                        >
                                                            <Paperclip className="h-4 w-4" />
                                                            Lihat Lampiran
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            <button
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                                title="Hapus Pesan"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {hasMore && !loading && messages.length > 0 && (
                            <div className="text-center pt-2">
                                <button
                                    onClick={() => { setPage(p => p + 1); fetchData(); }}
                                    className="text-xs text-primary hover:underline"
                                >
                                    Muat lebih banyak...
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Participants */}
                <div className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-xl shadow-sm p-4 overflow-y-auto">
                    <h3 className="font-bold text-black dark:text-white mb-4 flex items-center gap-2">
                        <User className="h-5 w-5" /> Partisipan ({participants.length})
                    </h3>
                    <div className="space-y-3">
                        {participants.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition">
                                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                                    {getInitials(p.sender_nama)}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-black dark:text-white truncate">{p.sender_nama}</p>
                                    <p className="text-xs text-gray-500">{p.count} pesan</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </MainLayout>
    );
}
