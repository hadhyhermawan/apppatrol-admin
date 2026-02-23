'use client';

import { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Search, Send, Trash2, Paperclip, X, User } from 'lucide-react';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';

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

type ChatMessage = {
    id: number;
    room: string;
    sender_id: string;
    sender_nama: string;
    role: string;
    message: string;
    created_at: string;
    attachment: string | null;
    attachment_type: string | null;
};

function ChatManagementPage() {
    const [threads, setThreads] = useState<ThreadItem[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [participants, setParticipants] = useState<any[]>([]);
    const [activeRoom, setActiveRoom] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);

    const [threadsLoading, setThreadsLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);

    // Auth User
    const [currentUser, setCurrentUser] = useState<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('patrol_user');
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch (e) { }
        }
        fetchThreads();
        const interval = setInterval(() => fetchThreads(false), 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeRoom) {
            fetchMessages(activeRoom, true);
            interval = setInterval(() => fetchMessages(activeRoom, false), 5000); // polling
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeRoom]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchThreads = async (showLoading = true) => {
        if (showLoading) setThreadsLoading(true);
        try {
            const res: any = await apiClient.get('/chat-management?limit=50');
            setThreads(res.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            if (showLoading) setThreadsLoading(false);
        }
    };

    const fetchMessages = async (room: string, showLoading = true) => {
        if (showLoading) setMessagesLoading(true);
        try {
            const res: any = await apiClient.get(`/chat-management/thread/${encodeURIComponent(room)}?limit=100`);
            // Reverse to show oldest first, newest at bottom
            const msgs = (res.data || []).reverse();
            setMessages(msgs);
            setParticipants(res.participants || []);
        } catch (error) {
            console.error(error);
        } finally {
            if (showLoading) setMessagesLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() && !attachment) return;
        if (!activeRoom || !currentUser) return;

        const formData = new FormData();
        formData.append('room', activeRoom);
        if (chatInput.trim()) formData.append('message', chatInput);
        formData.append('role', currentUser.roles?.[0]?.name || 'admin');
        formData.append('sender_id', String(currentUser.id || 'ADMIN'));
        formData.append('sender_nama', currentUser.name || currentUser.username || 'Administrator');
        if (attachment) formData.append('file', attachment);

        // Optimistic UI update could be added here
        setChatInput('');
        setAttachment(null);

        try {
            await apiClient.post('/chat-management/send', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchMessages(activeRoom, false);
            fetchThreads(false);
        } catch (error) {
            Swal.fire('Error', 'Gagal mengirim pesan', 'error');
        }
    };

    const handleDeleteMessage = (id: number) => {
        Swal.fire({
            title: 'Hapus Pesan?',
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
                    fetchThreads(false);
                } catch (error) {
                    Swal.fire('Error', 'Gagal menghapus pesan', 'error');
                }
            }
        });
    };

    const handleDeleteThread = () => {
        if (!activeRoom) return;
        Swal.fire({
            title: `Hapus Chat ${activeRoom}?`,
            text: "Seluruh riwayat pesan di grup ini akan dihapus permanen.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Hapus Grup'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/chat-management/thread/${encodeURIComponent(activeRoom)}`);
                    setActiveRoom(null);
                    setMessages([]);
                    fetchThreads();
                    Swal.fire('Terhapus', 'Grup chat dikosongkan.', 'success');
                } catch (error) {
                    Swal.fire('Error', 'Gagal menghapus grup', 'error');
                }
            }
        });
    };

    const formatTimestamp = (dateString: string | null) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateObj = (dateString: string | null) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getInitials = (name: string) => {
        return name ? name.substring(0, 2).toUpperCase() : '??';
    };

    const isOwnMessage = (senderId: string) => {
        if (!currentUser) return false;
        return String(senderId) === String(currentUser.id) || senderId === 'ADMIN';
    };

    const filteredThreads = threads.filter(t => t.room.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <MainLayout>
            {/* Main Chat Container - Max Height constraints for WhatsApp Web feel */}
            <div className="flex bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-xl overflow-hidden shadow-default h-[calc(100vh-120px)]">

                {/* 1. SIDEBAR KIRI - DAFTAR GRUP */}
                <div className={`w-full md:w-1/3 lg:w-1/4 flex-col border-r border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-boxdark-2 ${activeRoom ? 'hidden md:flex' : 'flex'}`}>

                    {/* Header Sidebar */}
                    <div className="p-4 border-b border-stroke dark:border-strokedark flex items-center bg-white dark:bg-meta-4 shrink-0 h-16">
                        <h2 className="text-lg font-bold text-black dark:text-white">Admin Chat</h2>
                    </div>

                    {/* Search Bar */}
                    <div className="p-3 border-b border-stroke dark:border-strokedark shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari group chat..."
                                className="w-full bg-white dark:bg-boxdark rounded-full pl-9 pr-4 py-2 text-sm border border-stroke dark:border-strokedark focus:border-primary focus:outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Room List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {threadsLoading ? (
                            <div className="p-4 text-center text-sm text-gray-500">Memuat...</div>
                        ) : filteredThreads.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">Tidak ada percakapan.</div>
                        ) : (
                            filteredThreads.map((t, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveRoom(t.room)}
                                    className={`w-full text-left p-4 flex items-center gap-3 border-b border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4/50 transition ${activeRoom === t.room ? 'bg-primary/10 dark:bg-primary/20' : ''}`}
                                >
                                    {/* Group Avatar */}
                                    <div className="shrink-0 h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                                        {getInitials(t.room)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-semibold text-black dark:text-white truncate text-sm">{t.room}</h3>
                                            <span className="text-[10px] text-gray-400 shrink-0">
                                                {formatDateObj(t.last_message_at)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-gray-500 truncate min-w-0">
                                                {t.last_message_text ? (
                                                    <span className={activeRoom !== t.room ? "text-gray-600 dark:text-gray-300" : ""}>
                                                        <span className="font-medium mr-1">{t.last_sender_name}:</span>
                                                        {t.last_message_text}
                                                    </span>
                                                ) : <span className="italic">Grup Baru</span>}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. PANEL KANAN - RUANG CHAT */}
                <div className={`w-full md:w-2/3 lg:w-3/4 flex-col bg-[#efeae2] dark:bg-boxdark ${!activeRoom ? 'hidden md:flex' : 'flex'}`}>

                    {!activeRoom ? (
                        // Empty State
                        <div className="flex-1 flex flex-col justify-center items-center text-center p-8">
                            <div className="h-32 w-32 mb-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Send size={48} className="translate-x-1" />
                            </div>
                            <h2 className="text-2xl font-bold text-black dark:text-white mb-2">K3Guard Admin Chat</h2>
                            <p className="text-gray-500 max-w-sm">Pilih grup dari menu di sebelah kiri untuk melihat pesan atau memulai percakapan baru dengan petugas keamanan.</p>
                        </div>
                    ) : (
                        // Active Chat
                        <>
                            {/* Chat Header */}
                            <div className="h-16 px-4 bg-white dark:bg-meta-4 border-b border-stroke dark:border-strokedark flex items-center justify-between shrink-0 relative z-10 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <button
                                        className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300"
                                        onClick={() => setActiveRoom(null)}
                                    >
                                        <X size={20} />
                                    </button>
                                    <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                                        {getInitials(activeRoom)}
                                    </div>
                                    <div className="cursor-pointer">
                                        <h3 className="font-bold text-black dark:text-white leading-tight">{activeRoom}</h3>
                                        <p className="text-xs text-brand-500">
                                            {participants.length} Partisipan Terakhir Aktif
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleDeleteThread} className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-full transition" title="Bersihkan Chat">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Chat Messages Area */}
                            {/* Texture background similar to WA Web */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative" style={{ backgroundImage: "url('https://frontend.k3guard.com/images/wa-bg.png')", backgroundRepeat: 'repeat', backgroundSize: '400px', backgroundColor: 'transparent' }}>
                                {/* Dark Mode Overlay to fade texture properly */}
                                <div className="absolute inset-0 bg-white/70 dark:bg-boxdark-2/90 pointer-events-none z-0"></div>

                                <div className="relative z-10 flex flex-col space-y-3 pb-2">
                                    {messagesLoading && messages.length === 0 ? (
                                        <div className="text-center p-4 bg-white/80 dark:bg-boxdark/80 rounded-lg mx-auto shadow-sm my-10">Memuat riwayat chat...</div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center p-4 text-xs font-medium text-gray-500 dark:text-gray-400 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-lg mx-auto w-fit shadow-sm my-4">Belum ada pesan dari grup ini.</div>
                                    ) : (
                                        messages.map((msg, idx) => {
                                            const isOwn = isOwnMessage(msg.sender_id);
                                            // Optional: Show date separator here if needed

                                            return (
                                                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group max-w-full drop-shadow-sm`}>

                                                    {/* Other participant's avatar outside bubble */}
                                                    {!isOwn && (
                                                        <div className="shrink-0 mr-2 mt-auto pb-1">
                                                            <div className="h-7 w-7 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center text-[10px] font-bold">
                                                                {getInitials(msg.sender_nama)}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Bubble */}
                                                    <div className={`relative px-3.5 pt-2 pb-1.5 max-w-[80%] sm:max-w-[65%] rounded-2xl ${isOwn
                                                            ? 'bg-brand-500 text-white rounded-br-sm'
                                                            : 'bg-white dark:bg-[#1E293B] dark:text-white rounded-bl-sm border border-stroke dark:border-strokedark'
                                                        }`}>

                                                        {/* Sender Name for incoming messages */}
                                                        {!isOwn && (
                                                            <div className="text-[11px] font-bold text-primary mb-0.5 leading-tight select-none">
                                                                {msg.sender_nama} {msg.role !== 'Satpam' ? `• ${msg.role}` : ''}
                                                            </div>
                                                        )}

                                                        {/* Attachment Handling */}
                                                        {msg.attachment && (
                                                            <div className="mb-2">
                                                                {msg.attachment_type === 'image' ? (
                                                                    <div className="rounded-lg overflow-hidden border border-black/10 dark:border-white/10 cursor-pointer" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/storage/${msg.attachment}`, '_blank')}>
                                                                        <img src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${msg.attachment}`} className="max-h-[300px] w-auto object-cover hover:opacity-90" alt="Lampiran" />
                                                                    </div>
                                                                ) : (
                                                                    <a href={`${process.env.NEXT_PUBLIC_API_URL}/storage/${msg.attachment}`} target="_blank" className={`flex items-center gap-2 p-2 rounded-lg text-sm ${isOwn ? 'bg-black/10' : 'bg-gray-100 dark:bg-boxdark'} hover:opacity-80`}>
                                                                        <Paperclip size={16} /> <span>Dokumen Terlampir</span>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Main Text */}
                                                        {msg.message && (
                                                            <p className="text-[14px] whitespace-pre-wrap break-words leading-relaxed" style={{ color: isOwn ? 'rgba(255,255,255,0.95)' : 'inherit' }}>{msg.message}</p>
                                                        )}

                                                        {/* Timestamp & Status */}
                                                        <div className={`flex justify-end items-center gap-1 mt-0.5 select-none ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                                                            <span className="text-[10px] tabular-nums tracking-tighter">
                                                                {formatTimestamp(msg.created_at)}
                                                            </span>
                                                            {/* Simulate Double Tick for Own Message */}
                                                            {isOwn && <Check size={12} />}
                                                        </div>

                                                        {/* Delete Context Action */}
                                                        <button
                                                            onClick={() => handleDeleteMessage(msg.id)}
                                                            className="absolute top-1 right-2 p-1 opacity-0 group-hover:opacity-100 bg-black/5 rounded-full hover:bg-red-500 hover:text-white transition-all transform scale-75 cursor-pointer"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Attachment Preview UI */}
                            {attachment && (
                                <div className="absolute bottom-[72px] left-0 w-full p-3 bg-gray-100 dark:bg-meta-4/90 border-t border-stroke dark:border-strokedark z-20 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-black dark:text-white font-medium">
                                        <Paperclip size={16} className="text-primary" />
                                        <span className="truncate max-w-xs">{attachment.name}</span>
                                    </div>
                                    <button onClick={() => setAttachment(null)} className="p-1 rounded-full bg-red-500 text-white hover:bg-red-600 shadow">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            {/* Chat Input Area */}
                            <div className="px-4 py-3 bg-gray-100 dark:bg-meta-4 border-t border-stroke dark:border-strokedark flex items-end gap-2 shrink-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">

                                {/* Attachment Button */}
                                <label className="cursor-pointer shrink-0 p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-boxdark rounded-full transition flex items-center justify-center">
                                    <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setAttachment(e.target.files[0]);
                                            e.target.value = ''; // Reset
                                        }
                                    }} />
                                    <Paperclip size={22} className="rotate-45" />
                                </label>

                                {/* Message Input */}
                                <form onSubmit={handleSendMessage} className="flex-1 flex items-end gap-2">
                                    <div className="flex-1 relative bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-sm shadow-black/5 overflow-hidden flex items-center">
                                        <input
                                            type="text"
                                            className="w-full bg-transparent px-4 py-3.5 text-sm text-black dark:text-white outline-none placeholder:text-gray-400"
                                            placeholder="Ketik sebuah pesan..."
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            autoComplete="off"
                                        />
                                    </div>

                                    {/* Send Button */}
                                    <button
                                        type="submit"
                                        disabled={!chatInput.trim() && !attachment}
                                        className="shrink-0 h-[48px] w-[48px] rounded-full flex items-center justify-center transition-all bg-primary text-white hover:bg-primary/90 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed shadow-md focus:scale-95 cursor-pointer"
                                    >
                                        <Send size={20} className="-mr-0.5" />
                                    </button>
                                </form>

                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Inject a small style block to style custom scrollbar lightly inside chat text area if needed */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: rgba(156, 163, 175, 0.4);
                  border-radius: 20px;
                }
            `}</style>
        </MainLayout>
    );
}

export default withPermission(ChatManagementPage, {
    permissions: ['chat.index']
});
