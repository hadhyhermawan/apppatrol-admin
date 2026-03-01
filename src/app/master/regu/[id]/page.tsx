'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { usePermissions } from '@/contexts/PermissionContext';
import { ArrowLeft, Users, CalendarClock, ShieldCheck, CornerDownRight, CheckCircle, GripVertical, CalendarPlus, Trash2 } from 'lucide-react';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import idLocale from '@fullcalendar/core/locales/id';

interface Member {
    nik: string;
    nama_karyawan: string;
    kode_dept: string;
}

import { withPermission } from '@/hoc/withPermission';

function DetailReguPage() {
    const { id } = useParams();
    const router = useRouter();
    const { canUpdate, canCreate } = usePermissions();
    const [team, setTeam] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Member allocation
    const [teamMembers, setTeamMembers] = useState<Member[]>([]);
    const [availableMembers, setAvailableMembers] = useState<Member[]>([]);

    // Scheduling
    const [jamKerjaOptions, setJamKerjaOptions] = useState<any[]>([]);
    const [schedForm, setSchedForm] = useState({ kode_jam_kerja: '', start_date: '', end_date: '', overwrite: false });
    const [schedLoading, setSchedLoading] = useState(false);

    const [activeTab, setActiveTab] = useState<'members' | 'schedule'>('members');
    const palletRef = typeof window !== 'undefined' ? require('react').useRef() : null;

    const SHIFT_COLORS = [
        { bg: 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700', hex: '#3b82f6' },
        { bg: 'bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700', hex: '#10b981' },
        { bg: 'bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-700', hex: '#f43f5e' },
        { bg: 'bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700', hex: '#f59e0b' },
        { bg: 'bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700', hex: '#8b5cf6' },
        { bg: 'bg-cyan-100 dark:bg-cyan-900/30 hover:bg-cyan-200 dark:hover:bg-cyan-900/50', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-300 dark:border-cyan-700', hex: '#06b6d4' },
    ];

    const getShiftColor = (kode: string) => {
        const index = jamKerjaOptions.findIndex((j: any) => j.kode_jam_kerja === kode);
        return SHIFT_COLORS[index >= 0 ? (index % SHIFT_COLORS.length) : 0];
    };

    useEffect(() => {
        if (activeTab === 'schedule' && palletRef?.current) {
            let draggable = new Draggable(palletRef.current, {
                itemSelector: '.fc-event-pallet',
                eventData: function (eventEl) {
                    return {
                        title: eventEl.getAttribute('data-title'),
                        id: eventEl.getAttribute('data-id'),
                        backgroundColor: eventEl.getAttribute('data-hex'),
                        borderColor: eventEl.getAttribute('data-hex'),
                        create: true
                    };
                }
            });
            return () => draggable.destroy();
        }
    }, [activeTab, jamKerjaOptions]);

    const handleEventReceive = async (info: any) => {
        info.revert();
        if (teamMembers.length === 0) {
            return Swal.fire('Error', 'Regu tidak memiliki anggota!', 'error');
        }

        const title = info.event.title;
        const kode = info.event.id;
        const target_date = info.event.startStr;

        const result = await Swal.fire({
            title: `Assign Shift?`,
            html: `Jadwalkan <b class="text-brand-500">${title}</b> pada tanggal <b>${target_date}</b> untuk ${teamMembers.length} anggota?<br/><br/><small class="text-gray-500">Aksi ini akan menimpa jadwal tim sebelumnya di tanggal yang sama</small>`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            confirmButtonText: 'Generate Jadwal'
        });

        if (result.isConfirmed) {
            setSchedLoading(true);
            try {
                const payload = {
                    kode_jam_kerja: kode,
                    start_date: target_date,
                    end_date: target_date,
                    overwrite: true
                };
                const res: any = await apiClient.post(`/master/teams/${id}/generate-schedule`, payload);
                Swal.fire({ icon: 'success', title: 'Jadwal di-generate', text: `${res.total_generated} baris data berhasil masuk.`, timer: 1500, showConfirmButton: false });
                fetchData();
            } catch (err: any) {
                Swal.fire('Generate Gagal', err?.response?.data?.detail || 'Terjadi kesalahan sistem', 'error');
            } finally {
                setSchedLoading(false);
            }
        }
    };

    const handleEventClick = async (info: any) => {
        const result = await Swal.fire({
            title: 'Hapus Jadwal?',
            html: `Apakah Anda yakin ingin menghapus jadwal <b>${info.event.title}</b> pada tanggal <b>${info.event.startStr}</b>?<br/><br/><span class="text-sm text-red-500">Jadwal rekan-rekan regu Anda pada rentang tanggal tersebut akan ikut terhapus.</span>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hapus'
        });

        if (result.isConfirmed) {
            try {
                // info.event.id refers to team_schedule_id (s.id.toString())
                await apiClient.delete(`/master/teams/${id}/schedules/${info.event.id}`);
                Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Jadwal regu berhasil ditarik.', timer: 1500, showConfirmButton: false });
                fetchData();
            } catch (err: any) {
                Swal.fire('Error', err?.response?.data?.detail || 'Gagal menghapus jadwal', 'error');
            }
        }
    };

    const calendarEvents = team?.schedules?.map((s: any) => {
        // For visual, end date if different needs +1 day for FullCalendar, but here it's usually single day if dragged.
        // We'll just set start and end. If end is same as start it's fine.
        const endD = new Date(s.end_date);
        endD.setDate(endD.getDate() + 1); // FullCalendar requires exclusive end date for all-day events across multiple days

        const c = getShiftColor(s.kode_jam_kerja);

        return {
            id: s.id.toString(),
            title: jamKerjaOptions.find(j => j.kode_jam_kerja === s.kode_jam_kerja)?.nama_jam_kerja || s.kode_jam_kerja,
            start: s.start_date,
            end: s.start_date === s.end_date ? undefined : endD.toISOString().split('T')[0],
            allDay: true,
            backgroundColor: c ? c.hex : '#3b82f6',
            borderColor: c ? c.hex : '#2563eb'
        };
    }) || [];

    useEffect(() => {
        fetchData(true);
    }, [id]);

    const fetchData = async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            // Get Team Detail & Members
            const tRes: any = await apiClient.get(`/master/teams/${id}`);
            setTeam(tRes);
            setTeamMembers(tRes.members || []);

            // Get available members
            const aRes: any = await apiClient.get(`/master/teams/${id}/available-members`);
            setAvailableMembers(Array.isArray(aRes) ? aRes : []);

            // Get shift options
            const jRes: any = await apiClient.get('/master/jamkerja');
            setJamKerjaOptions(Array.isArray(jRes) ? jRes : []);

        } catch (err: any) {
            Swal.fire('Error', 'Gagal memuat data regu', 'error');
            router.push('/master/regu');
        } finally {
            if (isInitial) setLoading(false);
        }
    };

    // --- HTML5 Drag & Drop Logic for Members ---
    const handleDragStart = (e: React.DragEvent, nik: string, source: 'available' | 'team') => {
        e.dataTransfer.setData('nik', nik);
        e.dataTransfer.setData('source', source);
    };

    const handleDrop = async (e: React.DragEvent, target: 'available' | 'team') => {
        e.preventDefault();
        const nik = e.dataTransfer.getData('nik');
        const source = e.dataTransfer.getData('source');

        if (source === target) return; // No change

        try {
            if (target === 'team') {
                // Add to team
                await apiClient.post(`/master/teams/${id}/members`, { niks: [nik], action: 'add' });
                const moved = availableMembers.find(m => m.nik === nik);
                if (moved) {
                    setAvailableMembers(prev => prev.filter(m => m.nik !== nik));
                    setTeamMembers(prev => [...prev, moved]);
                }
            } else {
                // Remove from team
                await apiClient.post(`/master/teams/${id}/members`, { niks: [nik], action: 'remove' });
                const moved = teamMembers.find(m => m.nik === nik);
                if (moved) {
                    setTeamMembers(prev => prev.filter(m => m.nik !== nik));
                    setAvailableMembers(prev => [...prev, moved]);
                }
            }
        } catch (err: any) {
            Swal.fire('Error', err?.response?.data?.detail || 'Gagal memindahkan anggota', 'error');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // allow drop
    };

    // --- Generate Schedule ---
    const handleGenerateSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (teamMembers.length === 0) {
            return Swal.fire('Error', 'Regu tidak memiliki anggota!', 'error');
        }

        setSchedLoading(true);
        try {
            const res: any = await apiClient.post(`/master/teams/${id}/generate-schedule`, schedForm);
            Swal.fire('Berhasil!', `Jadwal di-generate. ${res.total_generated} baris data berhasil masuk.`, 'success');
            setSchedForm({ kode_jam_kerja: '', start_date: '', end_date: '', overwrite: false });
        } catch (err: any) {
            Swal.fire('Generate Gagal', err?.response?.data?.detail || 'Terjadi kesalahan sistem', 'error');
        } finally {
            setSchedLoading(false);
        }
    };

    if (loading) return <MainLayout><div className="p-20 text-center text-gray-400">Loading...</div></MainLayout>;

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle={`Detail Regu: ${team?.name}`} />

            <button onClick={() => router.push('/master/regu')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4 transition">
                <ArrowLeft className="w-4 h-4" /> Kembali ke Manajemen Regu
            </button>

            {/* Header Regu */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-brand-500" /> {team?.name}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">{team?.description || 'Tidak ada deskripsi'}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg text-sm font-semibold">
                        Cabang: {team?.nama_cabang}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mt-6 border-b border-gray-100 dark:border-gray-700">
                    <button onClick={() => setActiveTab('members')} className={`pb-3 px-2 text-sm font-medium border-b-2 transition ${activeTab === 'members' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        <Users className="w-4 h-4 inline mr-2" />
                        Alokasi Anggota ({teamMembers.length})
                    </button>
                    <button onClick={() => setActiveTab('schedule')} className={`pb-3 px-2 text-sm font-medium border-b-2 transition ${activeTab === 'schedule' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        <CalendarClock className="w-4 h-4 inline mr-2" />
                        Auto Scheduling
                    </button>
                </div>
            </div>

            {/* Content Tabs */}
            {activeTab === 'members' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Source Container */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col h-[600px]">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">Karyawan {team?.nama_cabang} (Tersedia)</h3>
                        <p className="text-xs text-gray-500 mb-4">Seret (drag) karyawan ke panel kanan untuk memasukkan mereka ke regu ini.</p>

                        <div
                            className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border-2 border-dashed border-gray-200 dark:border-gray-800"
                            onDrop={(e) => handleDrop(e, 'available')}
                            onDragOver={handleDragOver}
                        >
                            {availableMembers.map(m => (
                                <div
                                    key={m.nik}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, m.nik, 'available')}
                                    className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border border-gray-100 dark:border-gray-700 mb-2 cursor-grab active:cursor-grabbing flex items-center justify-between hover:border-brand-500 transition"
                                >
                                    <div>
                                        <p className="font-semibold text-sm text-gray-800 dark:text-white">{m.nama_karyawan}</p>
                                        <p className="text-xs text-gray-400 font-mono">{m.nik}</p>
                                    </div>
                                    <GripVertical className="w-4 h-4 text-gray-300" />
                                </div>
                            ))}
                            {availableMembers.length === 0 && (
                                <div className="h-full flex items-center justify-center text-sm text-gray-400">Tidak ada karyawan tersedia.</div>
                            )}
                        </div>
                    </div>

                    {/* Target Container */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-brand-200 dark:border-brand-900 p-5 flex flex-col h-[600px]">
                        <h3 className="font-bold text-brand-600 dark:text-brand-400 mb-2">Anggota {team?.name}</h3>
                        <p className="text-xs text-gray-500 mb-4">Seret (drag) karyawan keluar ke panel kiri untuk menghapus mereka dari regu.</p>

                        <div
                            className="flex-1 overflow-y-auto bg-brand-50/30 dark:bg-brand-900/10 rounded-lg p-3 border-2 border-dashed border-brand-200 dark:border-brand-800/50"
                            onDrop={(e) => handleDrop(e, 'team')}
                            onDragOver={handleDragOver}
                        >
                            {teamMembers.map(m => (
                                <div
                                    key={m.nik}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, m.nik, 'team')}
                                    className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm border flex items-center justify-between mb-2 cursor-grab active:cursor-grabbing border-l-4 border-l-brand-500 transition"
                                >
                                    <div>
                                        <p className="font-semibold text-sm text-gray-800 dark:text-white">{m.nama_karyawan}</p>
                                        <p className="text-xs text-gray-400 font-mono">{m.nik}</p>
                                    </div>
                                    <GripVertical className="w-4 h-4 text-gray-300" />
                                </div>
                            ))}
                            {teamMembers.length === 0 && (
                                <div className="h-full flex items-center justify-center text-sm text-brand-400/50">Tarik karyawan ke sini</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'schedule' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex flex-col lg:flex-row gap-6">

                        {/* Pallet Sidebar */}
                        <div className="lg:w-1/4">
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                <CalendarPlus className="w-5 h-5 text-brand-500" /> Palet Shift
                            </h3>
                            <p className="text-xs text-gray-500 mb-4">
                                Seret blok shift di bawah ini dan jatuhkan (drop) ke tanggal di kalender.
                            </p>

                            <div ref={palletRef} className="space-y-2 max-h-[500px] overflow-y-auto pr-2 no-scrollbar border-r border-gray-100 dark:border-gray-700">
                                {jamKerjaOptions.map((j: any) => {
                                    const c = getShiftColor(j.kode_jam_kerja);
                                    return (
                                        <div
                                            key={j.kode_jam_kerja}
                                            className={`fc-event-pallet ${c.bg} ${c.text} ${c.border} border p-3 rounded shadow-sm cursor-grab active:cursor-grabbing transition flex items-center justify-between`}
                                            data-title={j.nama_jam_kerja}
                                            data-id={j.kode_jam_kerja}
                                            data-hex={c.hex}
                                        >
                                            <div className="flex-1">
                                                <p className="font-bold text-sm pointer-events-none">{j.nama_jam_kerja}</p>
                                                <p className="text-[10px] pointer-events-none">{j.jam_masuk?.substring(0, 5)} - {j.jam_pulang?.substring(0, 5)}</p>
                                            </div>
                                            <GripVertical className="w-4 h-4 opacity-50 pointer-events-none" />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h4 className="font-bold text-sm mb-2 text-gray-600 dark:text-gray-300">Auto Scheduling Massal</h4>
                                <p className="text-xs text-gray-400 mb-3 block">Bisa juga menggunakan formulir rentang tanggal di bawah ini:</p>
                                <button
                                    onClick={() => document.getElementById('modal-bulk-form')?.classList.remove('hidden')}
                                    className="w-full text-sm py-2 px-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded font-medium transition text-gray-700 dark:text-white"
                                >
                                    Form Penjadwalan Rentang
                                </button>
                            </div>
                        </div>

                        {/* Calendar Area */}
                        <div className="lg:w-3/4 flex-1 overflow-hidden" style={{ minHeight: '600px' }}>
                            <div className="fc-theme-standard">
                                <FullCalendar
                                    plugins={[dayGridPlugin, interactionPlugin]}
                                    initialView="dayGridMonth"
                                    events={calendarEvents}
                                    droppable={true}
                                    height="auto"
                                    locale={idLocale}
                                    headerToolbar={{
                                        left: 'prev,next today',
                                        center: 'title',
                                        right: 'dayGridMonth'
                                    }}
                                    eventReceive={handleEventReceive}
                                    eventClick={handleEventClick}
                                    editable={false} // cannot drag around once placed (for now, backend logic restricted)
                                    selectable={true}
                                    eventContent={(info) => {
                                        return (
                                            <div className="flex items-center justify-between pointer-events-none w-full px-1">
                                                <span className="truncate">{info.event.title}</span>
                                                <Trash2 className="w-3 h-3 flex-shrink-0 text-white opacity-0 group-hover:opacity-100 ml-1" />
                                            </div>
                                        );
                                    }}
                                    eventClassNames="group cursor-pointer"
                                />
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Modal Form Bulk */}
            <div id="modal-bulk-form" className="fixed inset-0 z-[60] bg-black/50 hidden flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-2xl relative">
                    <button onClick={() => document.getElementById('modal-bulk-form')?.classList.add('hidden')} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white">✕</button>
                    <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Form Penjadwalan Rentang</h3>
                    <form onSubmit={async (e) => {
                        await handleGenerateSchedule(e);
                        document.getElementById('modal-bulk-form')?.classList.add('hidden');
                    }} className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold mb-1block">Pilih Shift</label>
                            <select required value={schedForm.kode_jam_kerja} onChange={e => setSchedForm({ ...schedForm, kode_jam_kerja: e.target.value })} className="w-full rounded border p-2 bg-transparent dark:border-gray-600">
                                <option value="">-- Pilih Shift --</option>
                                {jamKerjaOptions.map((j: any) => (
                                    <option key={j.kode_jam_kerja} value={j.kode_jam_kerja}>{j.nama_jam_kerja}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="text-sm font-semibold mb-1 block">Dari</label>
                                <input type="date" required value={schedForm.start_date} onChange={e => setSchedForm({ ...schedForm, start_date: e.target.value })} className="w-full rounded border p-2 bg-transparent dark:border-gray-600" />
                            </div>
                            <div className="w-1/2">
                                <label className="text-sm font-semibold mb-1 block">Sampai</label>
                                <input type="date" required value={schedForm.end_date} onChange={e => setSchedForm({ ...schedForm, end_date: e.target.value })} className="w-full rounded border p-2 bg-transparent dark:border-gray-600" />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                            <input type="checkbox" checked={schedForm.overwrite} onChange={e => setSchedForm({ ...schedForm, overwrite: e.target.checked })} />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Timpa jadwal lama (Overwrite)</span>
                        </label>
                        <button type="submit" disabled={schedLoading} className="w-full py-2 bg-brand-500 text-white rounded mt-4">Generate Jadwal</button>
                    </form>
                </div>
            </div>

        </MainLayout>
    );
}

export default withPermission(DetailReguPage, { permissions: ['teams.index'] });
