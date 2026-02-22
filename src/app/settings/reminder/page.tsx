'use client';

import { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import {
    Bell, Plus, Pencil, Trash2, ToggleRight, ToggleLeft,
    Clock, Users, Building2, AlertCircle, CheckCircle2,
    Shield, Brush, Car, LogIn, LogOut, SendHorizonal, Loader2, ChevronDown, Search
} from 'lucide-react';

// ─── SearchableSelect ─────────────────────────────────────────────────────────
function SearchableSelect({ options, value, onChange, placeholder }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find(o => o.value === value);
    const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));
    useEffect(() => {
        const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, []);
    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => { setOpen(o => !o); setQ(''); }}
                className="w-full flex items-center justify-between gap-2 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none">
                <span className={selected ? '' : 'text-gray-400'}>{selected?.label || placeholder || 'Pilih...'}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-2">
                            <Search size={13} className="text-gray-400" />
                            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                                className="flex-1 bg-transparent py-1.5 text-sm outline-none text-gray-700 dark:text-white"
                                placeholder="Cari..." />
                        </div>
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                        {filtered.length === 0
                            ? <p className="text-xs text-gray-400 px-3 py-2">Tidak ditemukan</p>
                            : filtered.map(o => (
                                <button key={o.value} type="button"
                                    onClick={() => { onChange(o.value); setOpen(false); }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-violet-50 dark:hover:bg-violet-900/30 transition ${o.value === value ? 'text-violet-600 font-semibold bg-violet-50 dark:bg-violet-900/20' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {o.label}
                                </button>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Types ───────────────────────────────────────────────────────────────────
type ReminderType =
    | 'absen_masuk'
    | 'absen_pulang'
    | 'absen_patroli'
    | 'cleaning_task'
    | 'driver_task';

interface Reminder {
    id: number;
    type: ReminderType;
    label: string;
    message: string;
    minutes_before: number;
    target_role: string | null;
    target_dept: string | null;
    target_cabang: string | null;
    is_active: number;
    created_at: string | null;
    updated_at: string | null;
}

const VALID_TYPES = [
    { value: 'absen_masuk', label: 'Pengingat Absen Masuk' },
    { value: 'absen_pulang', label: 'Pengingat Absen Pulang' },
    { value: 'absen_patroli', label: 'Pengingat Absen Patroli' },
    { value: 'cleaning_task', label: 'Pengingat Tugas Cleaning' },
    { value: 'driver_task', label: 'Pengingat Tugas Driver' },
];

const TYPE_META: Record<ReminderType, { icon: React.ReactNode; color: string; bg: string }> = {
    absen_masuk: { icon: <LogIn size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    absen_pulang: { icon: <LogOut size={18} />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    absen_patroli: { icon: <Shield size={18} />, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/30' },
    cleaning_task: { icon: <Brush size={18} />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
    driver_task: { icon: <Car size={18} />, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/30' },
};

const EMPTY_FORM = {
    type: 'absen_masuk' as ReminderType,
    label: '',
    message: '',
    minutes_before: 30,
    target_role: '',
    target_dept: '',
    target_cabang: '',
    target_shift: '',
    is_active: 1,
};

// ─── Page ────────────────────────────────────────────────────────────────────
function ReminderSettingPage() {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [testingId, setTestingId] = useState<number | null>(null);
    const [deptOptions, setDeptOptions] = useState<{ value: string; label: string }[]>([]);
    const [cabangOptions, setCabangOptions] = useState<{ value: string; label: string }[]>([]);
    const [shiftOptions, setShiftOptions] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        fetchReminders();
        fetchOptions();
    }, []);

    const fetchOptions = async () => {
        try {
            const res: any = await apiClient.get('/master/options');
            setDeptOptions([
                { value: '', label: 'Semua Departemen' },
                ...(res?.departemen || []).map((d: any) => ({ value: d.code, label: d.name }))
            ]);
            setCabangOptions([
                { value: '', label: 'Semua Cabang' },
                ...(res?.cabang || []).map((c: any) => ({ value: c.code, label: c.name }))
            ]);
            const resJK: any = await apiClient.get('/master/jamkerja');
            const jkArr = Array.isArray(resJK) ? resJK : [];
            setShiftOptions([
                { value: '', label: 'Semua Shift' },
                ...jkArr.map((j: any) => ({ value: j.kode_jam_kerja, label: `${j.nama_jam_kerja} (${j.jam_masuk?.slice(0, 5)}–${j.jam_pulang?.slice(0, 5)})` }))
            ]);
        } catch { }
    };

    const fetchReminders = async () => {
        setLoading(true);
        try {
            const res: any = await apiClient.get('/reminder-settings');
            setReminders(res.data ?? []);
        } catch {
            Swal.fire('Error', 'Gagal memuat pengaturan reminder', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditId(null);
        setForm({ ...EMPTY_FORM });
        setShowModal(true);
    };

    const openEdit = (r: Reminder) => {
        setEditId(r.id);
        setForm({
            type: r.type,
            label: r.label,
            message: r.message,
            minutes_before: r.minutes_before,
            target_role: r.target_role ?? '',
            target_dept: r.target_dept ?? '',
            target_cabang: r.target_cabang ?? '',
            target_shift: (r as any).target_shift ?? '',
            is_active: r.is_active,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.label.trim() || !form.message.trim()) {
            Swal.fire('Validasi', 'Label dan Pesan wajib diisi', 'warning');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                target_role: form.target_role || null,
                target_dept: form.target_dept || null,
                target_cabang: form.target_cabang || null,
            };
            if (editId) {
                await apiClient.put(`/reminder-settings/${editId}`, payload);
            } else {
                await apiClient.post('/reminder-settings', payload);
            }
            setShowModal(false);
            await fetchReminders();
            Swal.fire({ icon: 'success', title: editId ? 'Berhasil diupdate' : 'Berhasil ditambahkan', timer: 1500, showConfirmButton: false });
        } catch (e: any) {
            Swal.fire('Error', e?.message ?? 'Gagal menyimpan', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id: number) => {
        try {
            const res: any = await apiClient.patch(`/reminder-settings/${id}/toggle`);
            setReminders(prev => prev.map(r => r.id === id ? { ...r, is_active: res.data?.is_active ?? (r.is_active ? 0 : 1) } : r));
        } catch {
            Swal.fire('Error', 'Gagal mengubah status', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus Reminder?',
            text: 'Data ini akan dihapus permanen.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#ef4444',
        });
        if (!result.isConfirmed) return;
        try {
            await apiClient.delete(`/reminder-settings/${id}`);
            setReminders(prev => prev.filter(r => r.id !== id));
            Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1200, showConfirmButton: false });
        } catch {
            Swal.fire('Error', 'Gagal menghapus', 'error');
        }
    };

    const handleTestSend = async (r: Reminder) => {
        const confirm = await Swal.fire({
            title: `Uji Kirim: ${r.label}`,
            html: `<p class="text-sm text-gray-600">Notifikasi akan dikirim ke semua device karyawan yang sesuai target reminder ini.</p><br/><p class="text-xs text-gray-400">Pesan: <em>${r.message}</em></p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '🚀 Kirim Sekarang',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#7c3aed',
        });
        if (!confirm.isConfirmed) return;

        setTestingId(r.id);
        try {
            const res: any = await apiClient.post(`/reminder-settings/${r.id}/test-send`);
            if (res.status) {
                Swal.fire({
                    icon: 'success',
                    title: 'Uji Kirim Berhasil!',
                    html: `<p>Notifikasi <strong>${r.label}</strong> sedang dikirim ke <strong>${res.sent_to}</strong> device.</p><br/><p class="text-xs text-gray-400">Pesan: ${res.message_preview}</p>`,
                    confirmButtonColor: '#7c3aed',
                });
            } else {
                Swal.fire('Info', res.message ?? 'Tidak ada device yang ditemukan', 'info');
            }
        } catch (e: any) {
            Swal.fire('Error', e?.message ?? 'Gagal mengirim uji notifikasi', 'error');
        } finally {
            setTestingId(null);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <MainLayout>
            <div className="p-4 md:p-6 space-y-6">
                <PageBreadcrumb pageTitle="Pengaturan Reminder" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Bell className="text-violet-500" size={24} />
                            Pengaturan Reminder
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Kelola notifikasi push otomatis ke perangkat karyawan sebelum jam kerja / jadwal patroli
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-sm"
                    >
                        <Plus size={16} />
                        Tambah Reminder
                    </button>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
                    <AlertCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Scheduler berjalan setiap <strong>1 menit</strong>. Notifikasi dikirim melalui{' '}
                        <strong>FCM (Firebase Cloud Messaging)</strong> ke semua device karyawan yang sesuai target.
                        Suara yang diputar: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">absen_masuk.mp3</code>, {' '}
                        <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">absen_pulang.mp3</code>, {' '}
                        <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">patroli.mp3</code>
                    </p>
                </div>

                {/* Cards Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 animate-pulse h-48 border border-gray-100 dark:border-gray-700" />
                        ))}
                    </div>
                ) : reminders.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                        <Bell size={48} className="mx-auto mb-3 opacity-30" />
                        <p>Belum ada reminder. Klik <strong>Tambah Reminder</strong> untuk mulai.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {reminders.map(r => {
                            const meta = TYPE_META[r.type] ?? TYPE_META['absen_masuk'];
                            return (
                                <div
                                    key={r.id}
                                    className={`bg-white dark:bg-gray-800 rounded-2xl border ${r.is_active ? 'border-gray-200 dark:border-gray-700' : 'border-dashed border-gray-300 dark:border-gray-600 opacity-60'} shadow-sm hover:shadow-md transition-all p-5 space-y-4`}
                                >
                                    {/* Top Row */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className={`${meta.bg} ${meta.color} p-2 rounded-xl`}>
                                            {meta.icon}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleToggle(r.id)}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                                title={r.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                            >
                                                {r.is_active
                                                    ? <ToggleRight size={22} className="text-emerald-500" />
                                                    : <ToggleLeft size={22} className="text-gray-400" />
                                                }
                                            </button>
                                            <button
                                                onClick={() => openEdit(r)}
                                                className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500 transition"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(r.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition"
                                                title="Hapus"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Label & Status */}
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{r.label}</h3>
                                            {r.is_active
                                                ? <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">Aktif</span>
                                                : <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full font-medium">Nonaktif</span>
                                            }
                                        </div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{r.type}</p>
                                    </div>

                                    {/* Message */}
                                    <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 leading-relaxed line-clamp-2">
                                        {r.message}
                                    </p>

                                    {/* Meta */}
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg">
                                            <Clock size={11} /> {r.minutes_before} menit sebelum
                                        </span>
                                        {r.target_role && (
                                            <span className="flex items-center gap-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-lg">
                                                <Users size={11} /> {r.target_role}
                                            </span>
                                        )}
                                        {r.target_dept && (
                                            <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg">
                                                <Building2 size={11} /> {r.target_dept}
                                            </span>
                                        )}
                                        {!r.target_role && !r.target_dept && (
                                            <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-lg">
                                                <Users size={11} /> Semua Karyawan
                                            </span>
                                        )}
                                    </div>

                                    {/* Uji Kirim Button */}
                                    <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
                                        <button
                                            onClick={() => handleTestSend(r)}
                                            disabled={testingId === r.id}
                                            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-700 rounded-xl py-2 px-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {testingId === r.id
                                                ? <><Loader2 size={13} className="animate-spin" /> Mengirim...</>
                                                : <><SendHorizonal size={13} /> Uji Kirim Notifikasi</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ─── Modal ──────────────────────────────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Bell size={20} className="text-violet-500" />
                                {editId ? 'Edit Reminder' : 'Tambah Reminder'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Jenis Reminder <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.type}
                                    onChange={e => {
                                        const t = e.target.value as ReminderType;
                                        const found = VALID_TYPES.find(v => v.value === t);
                                        setForm(prev => ({ ...prev, type: t, label: found?.label ?? prev.label }));
                                    }}
                                    disabled={!!editId}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none disabled:opacity-50"
                                >
                                    {VALID_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Label */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Label / Judul Notifikasi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.label}
                                    onChange={e => setForm(prev => ({ ...prev, label: e.target.value }))}
                                    placeholder="cth: Pengingat Absen Masuk"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Isi Pesan Notifikasi <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={form.message}
                                    onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="Pesan yang tampil di notifikasi HP karyawan..."
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">{form.message.length}/255 karakter</p>
                            </div>

                            {/* Minutes Before */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Menit Sebelum Jam Target
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min={1} max={120} step={5}
                                        value={form.minutes_before}
                                        onChange={e => setForm(prev => ({ ...prev, minutes_before: Number(e.target.value) }))}
                                        className="flex-1 accent-violet-600"
                                    />
                                    <span className="w-20 text-center bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-bold text-sm py-1.5 rounded-lg">
                                        {form.minutes_before} mnt
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
                                    <span>1 mnt</span><span>30</span><span>60</span><span>90</span><span>120 mnt</span>
                                </div>
                            </div>


                            {/* Target Shift */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Shift / Jam Kerja <span className="text-gray-400 font-normal text-xs">(kosong = semua shift)</span>
                                </label>
                                <SearchableSelect
                                    options={shiftOptions}
                                    value={form.target_shift}
                                    onChange={v => setForm(prev => ({ ...prev, target_shift: v }))}
                                    placeholder="Semua Shift"
                                />
                            </div>

                            {/* Target Dept & Cabang */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Departemen <span className="text-gray-400 font-normal text-xs">(kosong = semua)</span>
                                    </label>
                                    <SearchableSelect
                                        options={deptOptions}
                                        value={form.target_dept}
                                        onChange={v => setForm(prev => ({ ...prev, target_dept: v }))}
                                        placeholder="Semua Departemen"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Cabang <span className="text-gray-400 font-normal text-xs">(kosong = semua)</span>
                                    </label>
                                    <SearchableSelect
                                        options={cabangOptions}
                                        value={form.target_cabang}
                                        onChange={v => setForm(prev => ({ ...prev, target_cabang: v }))}
                                        placeholder="Semua Cabang"
                                    />
                                </div>
                            </div>


                            {/* Status */}
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status Aktif</span>
                                <button
                                    onClick={() => setForm(prev => ({ ...prev, is_active: prev.is_active ? 0 : 1 }))}
                                    className="flex items-center gap-2 text-sm font-medium"
                                >
                                    {form.is_active
                                        ? <><ToggleRight size={28} className="text-emerald-500" /><span className="text-emerald-600">Aktif</span></>
                                        : <><ToggleLeft size={28} className="text-gray-400" /><span className="text-gray-500">Nonaktif</span></>
                                    }
                                </button>
                            </div>

                            {/* Preview */}
                            <div className="bg-gray-900 rounded-xl p-4 space-y-2">
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Preview Notifikasi HP</p>
                                <div className="bg-gray-800 rounded-lg p-3 flex items-start gap-3">
                                    <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Bell size={14} className="text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white text-xs font-semibold truncate">{form.label || 'Judul Notifikasi'}</p>
                                        <p className="text-gray-300 text-xs mt-0.5 leading-relaxed line-clamp-2">{form.message || 'Isi pesan notifikasi...'}</p>
                                        <p className="text-gray-500 text-xs mt-1">{form.minutes_before} menit sebelum jam target</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl transition shadow-sm"
                            >
                                {saving ? (
                                    <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                                ) : (
                                    <CheckCircle2 size={16} />
                                )}
                                {editId ? 'Simpan Perubahan' : 'Tambah Reminder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

export default withPermission(ReminderSettingPage, { permissions: [] });
