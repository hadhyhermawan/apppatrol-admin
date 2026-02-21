'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import {
    Plus, RefreshCw, Search, X, Save, Edit, Trash,
    ArrowLeft, ArrowRight, Clock, CalendarClock, Info,
    CheckCircle, XCircle, Building2, ShieldCheck, Loader2,
    Eye, Zap, ListChecks, ChevronRight
} from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import SearchableSelect from '@/components/form/SearchableSelect';
import clsx from 'clsx';

type PatrolScheduleItem = {
    id: number;
    kode_jam_kerja: string;
    name?: string | null;
    start_time: string;
    end_time: string;
    kode_dept: string | null;
    kode_cabang: string | null;
    is_active: number;
};

// Grup = kombinasi unik dept + cabang + shift
type ScheduleGroup = {
    kode_dept: string | null;
    kode_cabang: string | null;
    kode_jam_kerja: string;
    total_sesi: number;
    items: PatrolScheduleItem[];
};

type JamKerjaOption = {
    kode_jam_kerja: string;
    nama_jam_kerja: string;
    jam_masuk: string;
    jam_pulang: string;
};
type OptionItem = { code: string; name: string };

// ─── Helper: format waktu HH:MM ──────────────────────────────────────────────
function fmt(t?: string) { return t ? t.substring(0, 5) : '-'; }

// ─── Toggle ──────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button type="button" onClick={() => onChange(!checked)}
            className={clsx('relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                checked ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600')}>
            <span className={clsx('inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                checked ? 'translate-x-6' : 'translate-x-1')} />
        </button>
    );
}

// ─── Sesi Preview Card (bulk generate) ───────────────────────────────────────
type SesiInput = { start_time: string; end_time: string; name: string };

function SesiCard({ idx, sesi, onChange, onRemove }: {
    idx: number; sesi: SesiInput;
    onChange: (s: SesiInput) => void; onRemove: () => void;
}) {
    const handleTimeInput = (field: 'start_time' | 'end_time', raw: string, prevVal: string) => {
        let v = raw.replace(/[^0-9:]/g, '');
        if (v.length === 2 && !v.includes(':') && prevVal.length === 1) v = v + ':';
        if (v.length > 5) v = v.slice(0, 5);
        onChange({ ...sesi, [field]: v });
    };

    return (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5">
            <span className="w-6 text-center text-xs font-bold text-gray-400">{idx + 1}</span>
            <div className="flex-1 grid grid-cols-3 gap-2">
                <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Mulai (HH:MM)</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={sesi.start_time}
                        maxLength={5}
                        placeholder="08:00"
                        onChange={e => handleTimeInput('start_time', e.target.value, sesi.start_time)}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent px-2 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-brand-500 placeholder-gray-300"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Selesai (HH:MM)</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={sesi.end_time}
                        maxLength={5}
                        placeholder="10:00"
                        onChange={e => handleTimeInput('end_time', e.target.value, sesi.end_time)}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent px-2 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-brand-500 placeholder-gray-300"
                    />
                </div>
                <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Nama Sesi</label>
                    <input type="text" value={sesi.name} placeholder={`Patroli ${idx + 1}`}
                        onChange={e => onChange({ ...sesi, name: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-brand-500" />
                </div>
            </div>
            <button type="button" onClick={onRemove}
                className="text-red-400 hover:text-red-600 p-1 rounded transition">
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

function MasterJadwalTugasPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [allData, setAllData] = useState<PatrolScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [cabangOptions, setCabangOptions] = useState<OptionItem[]>([]);
    const [deptOptions, setDeptOptions] = useState<OptionItem[]>([]);
    const [jamKerjaOptions, setJamKerjaOptions] = useState<JamKerjaOption[]>([]);

    const [filterShift, setFilterShift] = useState('');
    const [filterCabang, setFilterCabang] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    // View mode: 'groups' | 'detail'
    const [viewMode, setViewMode] = useState<'groups' | 'detail'>('groups');
    const [selectedGroup, setSelectedGroup] = useState<ScheduleGroup | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'bulk' | 'single_edit'>('bulk');
    const [editingItem, setEditingItem] = useState<PatrolScheduleItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Bulk form
    const [bulkForm, setBulkForm] = useState({
        kode_jam_kerja: '',
        kode_dept: '',
        kode_cabang: '',
        jumlah: 4,
    });
    const [sesiList, setSesiList] = useState<SesiInput[]>([]);
    const [generatedShift, setGeneratedShift] = useState<JamKerjaOption | null>(null);

    // Single edit form
    const [editForm, setEditForm] = useState({ kode_jam_kerja: '', kode_dept: '', kode_cabang: '', start_time: '', end_time: '', name: '', is_active: 1 });

    // ─── Fetch ────────────────────────────────────────────────────────────────
    const fetchOptions = async () => {
        try {
            const resOpts: any = await apiClient.get('/master/options');
            setCabangOptions(resOpts?.cabang || []);
            setDeptOptions(resOpts?.departemen || []);
            const resJK: any = await apiClient.get('/master/jamkerja');
            setJamKerjaOptions(Array.isArray(resJK) ? resJK : []);
        } catch { }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/master/patrol-schedules?';
            if (filterCabang) url += `kode_cabang=${filterCabang}&`;
            if (filterDept) url += `kode_dept=${filterDept}&`;
            if (filterShift) url += `kode_jam_kerja=${filterShift}`;
            const response: any = await apiClient.get(url);
            setAllData(Array.isArray(response) ? response : []);
        } catch { setAllData([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchOptions(); }, []);
    useEffect(() => { fetchData(); }, [filterCabang, filterDept, filterShift]);

    // ─── Grouping ─────────────────────────────────────────────────────────────
    const groups = useMemo<ScheduleGroup[]>(() => {
        const map = new Map<string, ScheduleGroup>();
        allData.forEach(item => {
            const key = `${item.kode_dept || 'null'}||${item.kode_cabang || 'null'}||${item.kode_jam_kerja}`;
            if (!map.has(key)) {
                map.set(key, { kode_dept: item.kode_dept, kode_cabang: item.kode_cabang, kode_jam_kerja: item.kode_jam_kerja, total_sesi: 0, items: [] });
            }
            const g = map.get(key)!;
            g.total_sesi++;
            g.items.push(item);
        });
        return Array.from(map.values());
    }, [allData]);

    const filteredGroups = useMemo(() =>
        groups.filter(g => {
            const shiftName = getJKName(g.kode_jam_kerja).toLowerCase();
            const deptName = getDeptName(g.kode_dept)?.toLowerCase() || '';
            const q = searchTerm.toLowerCase();
            return !q || shiftName.includes(q) || deptName.includes(q) || g.kode_jam_kerja.toLowerCase().includes(q);
        }), [groups, searchTerm, deptOptions, jamKerjaOptions]);

    const paginatedGroups = useMemo(() => {
        const s = (currentPage - 1) * perPage;
        return filteredGroups.slice(s, s + perPage);
    }, [filteredGroups, currentPage]);
    const totalPages = Math.max(1, Math.ceil(filteredGroups.length / perPage));

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function getJKObj(kode: string) { return jamKerjaOptions.find(j => j.kode_jam_kerja === kode); }
    function getJKName(kode: string) { return getJKObj(kode)?.nama_jam_kerja || kode; }
    function getDeptName(kode: string | null) { return kode ? deptOptions.find(d => d.code === kode)?.name || kode : null; }
    function getCabangName(kode: string | null) { return kode ? cabangOptions.find(c => c.code === kode)?.name || kode : null; }

    // ─── Generate Waktu Otomatis ──────────────────────────────────────────────
    const handleGenerate = () => {
        const jk = getJKObj(bulkForm.kode_jam_kerja);
        if (!jk || !bulkForm.jumlah) { setErrorMsg('Pilih shift dan jumlah sesi terlebih dahulu.'); return; }
        setErrorMsg('');
        setGeneratedShift(jk);

        const toMinutes = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        let startMin = toMinutes(jk.jam_masuk);
        let endMin = toMinutes(jk.jam_pulang);
        if (endMin <= startMin) endMin += 24 * 60; // lintas hari

        const totalMin = endMin - startMin;
        const gap = Math.floor(totalMin / bulkForm.jumlah);

        const result: SesiInput[] = [];
        for (let i = 0; i < bulkForm.jumlah; i++) {
            const s = startMin + i * gap;
            const e = s + gap;
            const fmt2 = (m: number) => {
                const mm = m % (24 * 60);
                const hh = Math.floor(mm / 60).toString().padStart(2, '0');
                const mn = (mm % 60).toString().padStart(2, '0');
                return `${hh}:${mn}`;
            };
            result.push({ start_time: fmt2(s), end_time: fmt2(e), name: `Patroli ${i + 1}` });
        }
        setSesiList(result);
    };

    // ─── Submit Bulk ──────────────────────────────────────────────────────────
    const handleSubmitBulk = async () => {
        if (!bulkForm.kode_jam_kerja || sesiList.length === 0) { setErrorMsg('Generate waktu terlebih dahulu.'); return; }
        const valid = sesiList.filter(s => s.start_time && s.end_time && s.end_time > s.start_time);
        if (valid.length === 0) { setErrorMsg('Waktu selesai harus lebih besar dari waktu mulai.'); return; }
        setIsSubmitting(true);
        try {
            for (const s of valid) {
                await apiClient.post('/master/patrol-schedules', {
                    kode_jam_kerja: bulkForm.kode_jam_kerja,
                    kode_dept: bulkForm.kode_dept || null,
                    kode_cabang: bulkForm.kode_cabang || null,
                    start_time: s.start_time,
                    end_time: s.end_time,
                    name: s.name || null,
                    is_active: 1,
                });
            }
            setIsModalOpen(false);
            setSesiList([]);
            setGeneratedShift(null);
            fetchData();
            Swal.fire({ icon: 'success', title: `${valid.length} jadwal berhasil ditambahkan`, timer: 1800, showConfirmButton: false });
        } catch (e: any) {
            setErrorMsg(e?.response?.data?.detail || 'Gagal menyimpan jadwal.');
        } finally { setIsSubmitting(false); }
    };

    // ─── Submit Edit Sesi ─────────────────────────────────────────────────────
    const handleSubmitEdit = async () => {
        if (!editingItem) return;
        setIsSubmitting(true);
        try {
            await apiClient.put(`/master/patrol-schedules/${editingItem.id}`, {
                kode_jam_kerja: editForm.kode_jam_kerja,
                start_time: editForm.start_time,
                end_time: editForm.end_time,
                name: editForm.name || null,
                kode_dept: editForm.kode_dept || null,
                kode_cabang: editForm.kode_cabang || null,
                is_active: editForm.is_active,
            });
            setIsModalOpen(false);
            fetchData();
            if (selectedGroup) {
                // refresh detail view
                setSelectedGroup(prev => prev ? {
                    ...prev,
                    items: prev.items.map(it => it.id === editingItem.id
                        ? { ...it, start_time: editForm.start_time, end_time: editForm.end_time, name: editForm.name, is_active: editForm.is_active }
                        : it)
                } : null);
            }
            Swal.fire({ icon: 'success', title: 'Sesi berhasil diperbarui', timer: 1500, showConfirmButton: false });
        } catch (e: any) {
            setErrorMsg(e?.response?.data?.detail || 'Gagal menyimpan.');
        } finally { setIsSubmitting(false); }
    };

    const handleDeleteSesi = async (id: number, name: string) => {
        const r = await Swal.fire({
            title: 'Hapus Sesi?', html: `Sesi <b>${name}</b> akan dihapus.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#d33', cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal',
        });
        if (!r.isConfirmed) return;
        try {
            await apiClient.delete(`/master/patrol-schedules/${id}`);
            fetchData();
            if (selectedGroup) {
                setSelectedGroup(prev => prev ? { ...prev, items: prev.items.filter(it => it.id !== id), total_sesi: prev.total_sesi - 1 } : null);
            }
            Swal.fire({ icon: 'success', title: 'Sesi dihapus', timer: 1500, showConfirmButton: false });
        } catch (e: any) { Swal.fire('Gagal!', e?.response?.data?.detail || 'Gagal menghapus.', 'error'); }
    };

    const handleDeleteGroup = async (group: ScheduleGroup) => {
        const r = await Swal.fire({
            title: 'Hapus Semua Sesi Grup?',
            html: `Semua <b>${group.total_sesi} sesi</b> dalam grup ini akan dihapus permanen.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#d33', cancelButtonColor: '#6b7280',
            confirmButtonText: `Hapus ${group.total_sesi} Sesi`, cancelButtonText: 'Batal',
        });
        if (!r.isConfirmed) return;
        try {
            for (const item of group.items) {
                await apiClient.delete(`/master/patrol-schedules/${item.id}`);
            }
            fetchData();
            Swal.fire({ icon: 'success', title: `${group.total_sesi} sesi berhasil dihapus`, timer: 1800, showConfirmButton: false });
        } catch { Swal.fire('Gagal!', 'Gagal menghapus grup.', 'error'); }
    };

    const openBulkModal = () => {
        setErrorMsg(''); setModalMode('bulk');
        setBulkForm({ kode_jam_kerja: '', kode_dept: '', kode_cabang: '', jumlah: 4 });
        setSesiList([]); setGeneratedShift(null);
        setIsModalOpen(true);
    };

    const openEditSesi = (item: PatrolScheduleItem) => {
        setErrorMsg(''); setModalMode('single_edit'); setEditingItem(item);
        setEditForm({
            kode_jam_kerja: item.kode_jam_kerja,
            kode_dept: item.kode_dept || '',
            kode_cabang: item.kode_cabang || '',
            start_time: fmt(item.start_time),
            end_time: fmt(item.end_time),
            name: item.name || '',
            is_active: item.is_active,
        });
        setIsModalOpen(true);
    };

    const openGroupDetail = (group: ScheduleGroup) => {
        setSelectedGroup(group); setViewMode('detail');
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Jadwal Tugas Patroli" />

            {/* ── Banner ────────────────────────────────────────────────────── */}
            <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800/40 dark:bg-blue-900/10 p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                    <span className="font-semibold">Jadwal Tugas Patroli</span> menentukan kapan dan berapa kali petugas melakukan patroli dalam satu shift.
                    Setiap shift dapat memiliki beberapa sesi patroli (contoh: 4 kali patroli dalam 8 jam kerja).
                </div>
            </div>

            {/* ── Stats ─────────────────────────────────────────────────────── */}
            <div className="mb-5 grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Grup', value: groups.length, icon: CalendarClock, color: 'blue' },
                    { label: 'Total Sesi', value: allData.length, icon: ListChecks, color: 'purple' },
                    { label: 'Sesi Aktif', value: allData.filter(d => d.is_active).length, icon: CheckCircle, color: 'green' },
                ].map(s => (
                    <div key={s.label} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] p-4 flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg bg-${s.color}-100 dark:bg-${s.color}-500/15 flex items-center justify-center`}>
                            <s.icon className={`w-5 h-5 text-${s.color}-600 dark:text-${s.color}-400`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-black dark:text-white">{s.value}</p>
                            <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Card ─────────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">

                {/* ── Breadcrumb detail / header ───────────────────────────── */}
                {viewMode === 'detail' && selectedGroup ? (
                    <>
                        {/* Detail view header */}
                        <div className="mb-5">
                            <button onClick={() => setViewMode('groups')}
                                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white mb-3 transition">
                                <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Grup
                            </button>

                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                        <span>Jadwal</span><ChevronRight className="w-3 h-3" />
                                        <span className="text-gray-600 dark:text-gray-300 font-medium">{getJKName(selectedGroup.kode_jam_kerja)}</span>
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-brand-500" />
                                        {getJKName(selectedGroup.kode_jam_kerja)}
                                        <span className="text-sm font-normal text-gray-400">
                                            ({fmt(getJKObj(selectedGroup.kode_jam_kerja)?.jam_masuk)} – {fmt(getJKObj(selectedGroup.kode_jam_kerja)?.jam_pulang)})
                                        </span>
                                    </h2>
                                    <div className="flex flex-wrap gap-3 mt-1">
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Building2 className="w-3.5 h-3.5" />
                                            {getDeptName(selectedGroup.kode_dept) || 'Semua Departemen'}
                                        </span>
                                        <span className="text-xs text-gray-500">•</span>
                                        <span className="text-xs text-gray-500">
                                            {getCabangName(selectedGroup.kode_cabang) || 'Semua Cabang'}
                                        </span>
                                        <span className="text-xs font-semibold text-brand-500">
                                            {selectedGroup.items.length} Sesi Tugas
                                        </span>
                                    </div>
                                </div>
                                {canCreate('jadwal') && (
                                    <button onClick={openBulkModal}
                                        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-opacity-90 transition">
                                        <Plus className="w-4 h-4" /> Tambah Sesi
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Grid sesi */}
                        {selectedGroup.items.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-14 text-gray-400">
                                <CalendarClock className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                                <p className="font-medium text-gray-600 dark:text-gray-300">Belum ada sesi dalam grup ini</p>
                                <p className="text-xs">Klik "Tambah Sesi" untuk menambahkan jadwal patroli</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {selectedGroup.items.sort((a, b) => a.start_time.localeCompare(b.start_time)).map((item, i) => (
                                    <div key={item.id}
                                        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:-translate-y-1 hover:shadow-md transition-all">
                                        <div className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                                        <Clock className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                                            {item.name || `Patroli ${i + 1}`}
                                                        </p>
                                                        <p className="text-xs font-mono text-blue-600 dark:text-blue-400">
                                                            {fmt(item.start_time)} – {fmt(item.end_time)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {item.is_active ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 rounded-full px-2 py-0.5">
                                                        <CheckCircle className="w-3 h-3" /> Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                                                        <XCircle className="w-3 h-3" /> Non-Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                {canUpdate('jadwal') && (
                                                    <button onClick={() => openEditSesi(item)}
                                                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 hover:bg-yellow-100 rounded-lg py-1.5 transition">
                                                        <Edit className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                )}
                                                {canDelete('jadwal') && (
                                                    <button onClick={() => handleDeleteSesi(item.id, item.name || `Patroli ${i + 1}`)}
                                                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 rounded-lg py-1.5 transition">
                                                        <Trash className="w-3.5 h-3.5" /> Hapus
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* ── Daftar Grup Header ──────────────────────────────── */}
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-black dark:text-white">Daftar Grup Jadwal</h2>
                                <p className="text-sm text-gray-500 mt-0.5">{filteredGroups.length} grup jadwal</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={fetchData}
                                    className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white shadow-sm transition">
                                    <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
                                    <span className="hidden sm:inline">Refresh</span>
                                </button>
                                {canCreate('jadwal') && (
                                    <button onClick={openBulkModal}
                                        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-opacity-90 transition">
                                        <Zap className="h-4 w-4" /> Tambah Jadwal
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter */}
                        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-5">
                            <div className="relative col-span-2">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                <input type="text" placeholder="Cari shift / departemen..."
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition" />
                            </div>
                            <SearchableSelect
                                options={[{ value: '', label: 'Semua Shift' }, ...jamKerjaOptions.map(j => ({ value: j.kode_jam_kerja, label: `${j.nama_jam_kerja} (${fmt(j.jam_masuk)}–${fmt(j.jam_pulang)})` }))]}
                                value={filterShift} onChange={v => { setFilterShift(v); setCurrentPage(1); }} placeholder="Semua Shift" />
                            <SearchableSelect
                                options={[{ value: '', label: 'Semua Departemen' }, ...deptOptions.map(o => ({ value: o.code, label: o.name }))]}
                                value={filterDept} onChange={v => { setFilterDept(v); setCurrentPage(1); }} placeholder="Semua Dept" />
                            <SearchableSelect
                                options={[{ value: '', label: 'Semua Cabang' }, ...cabangOptions.map(o => ({ value: o.code, label: o.name }))]}
                                value={filterCabang} onChange={v => { setFilterCabang(v); setCurrentPage(1); }} placeholder="Semua Cabang" />
                        </div>

                        {/* Tabel Grup */}
                        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                                        <th className="px-4 py-3 text-center font-semibold text-gray-500 w-10">#</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-500 min-w-[160px]">Departemen</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-500 min-w-[140px]">Cabang</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-500 min-w-[180px]">Shift (Jam Kerja)</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-500 w-28">Total Sesi</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-500 w-36">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={6} className="py-14 text-center">
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span className="text-sm">Memuat data...</span>
                                            </div>
                                        </td></tr>
                                    ) : paginatedGroups.length === 0 ? (
                                        <tr><td colSpan={6} className="py-14 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                                <CalendarClock className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                                <div>
                                                    <p className="font-medium text-gray-600 dark:text-gray-300">
                                                        {searchTerm || filterShift || filterDept ? 'Tidak ada yang cocok' : 'Belum ada jadwal tugas'}
                                                    </p>
                                                    <p className="text-xs mt-1">
                                                        {!searchTerm && !filterShift && !filterDept && 'Klik "Tambah Jadwal" untuk membuat jadwal patroli pertama'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td></tr>
                                    ) : paginatedGroups.map((group, idx) => {
                                        const jk = getJKObj(group.kode_jam_kerja);
                                        return (
                                            <tr key={`${group.kode_dept}-${group.kode_cabang}-${group.kode_jam_kerja}`}
                                                className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                                                <td className="px-4 py-3.5 text-center text-xs text-gray-400">
                                                    {(currentPage - 1) * perPage + idx + 1}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                        <span className="font-medium text-gray-800 dark:text-white">
                                                            {getDeptName(group.kode_dept) || <span className="text-gray-400 italic text-xs">Semua Dept</span>}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                                                    {getCabangName(group.kode_cabang) || <span className="text-gray-400 italic text-xs">Semua Cabang</span>}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div>
                                                        <p className="font-semibold text-brand-600 dark:text-brand-400">{getJKName(group.kode_jam_kerja)}</p>
                                                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                                                            {fmt(jk?.jam_masuk)} – {fmt(jk?.jam_pulang)}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 text-xs font-bold px-3 py-1">
                                                        <ListChecks className="w-3.5 h-3.5" /> {group.total_sesi} Sesi
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button onClick={() => openGroupDetail(group)}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 hover:bg-blue-100 px-2.5 py-1.5 text-xs font-medium transition">
                                                            <Eye className="w-3.5 h-3.5" /> Detail
                                                        </button>
                                                        {canDelete('jadwal') && (
                                                            <button onClick={() => handleDeleteGroup(group)}
                                                                className="inline-flex items-center gap-1 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 px-2.5 py-1.5 text-xs font-medium transition">
                                                                <Trash className="w-3.5 h-3.5" /> Hapus
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {filteredGroups.length > perPage && (
                            <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                                <p className="text-sm text-gray-500">
                                    Halaman <span className="font-medium text-gray-900 dark:text-white">{currentPage}</span> / <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 disabled:opacity-40 transition">
                                        <ArrowLeft className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 disabled:opacity-40 transition">
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Modal ─────────────────────────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

                        {/* Modal Header */}
                        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {modalMode === 'bulk'
                                        ? <><Zap className="w-5 h-5 text-brand-500" /> Tambah Jadwal Baru</>
                                        : <><Edit className="w-5 h-5 text-yellow-500" /> Edit Sesi Patroli</>}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {modalMode === 'bulk'
                                        ? 'Pilih shift lalu generate waktu otomatis sesuai jumlah sesi'
                                        : 'Ubah detail sesi patroli'}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                            {errorMsg && (
                                <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3">
                                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {errorMsg}
                                </div>
                            )}

                            {modalMode === 'bulk' ? (
                                <>
                                    {/* Step 1 & 2 — berdampingan */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Step 1 */}
                                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Langkah 1 — Shift &amp; Lokasi</p>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5 block">
                                                    Shift / Jam Kerja <span className="text-red-500">*</span>
                                                </label>
                                                <SearchableSelect
                                                    options={jamKerjaOptions.map(jk => ({
                                                        value: jk.kode_jam_kerja,
                                                        label: `${jk.nama_jam_kerja} — ${fmt(jk.jam_masuk)} s/d ${fmt(jk.jam_pulang)}`
                                                    }))}
                                                    value={bulkForm.kode_jam_kerja}
                                                    onChange={v => setBulkForm(f => ({ ...f, kode_jam_kerja: v }))}
                                                    placeholder="Pilih shift..." />
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5 block">Departemen <span className="text-xs font-normal text-gray-400">(opsional)</span></label>
                                                <SearchableSelect
                                                    options={[{ value: '', label: 'Semua Departemen' }, ...deptOptions.map(o => ({ value: o.code, label: o.name }))]}
                                                    value={bulkForm.kode_dept}
                                                    onChange={v => setBulkForm(f => ({ ...f, kode_dept: v }))}
                                                    placeholder="Semua Dept" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5 block">Cabang <span className="text-xs font-normal text-gray-400">(opsional)</span></label>
                                                <SearchableSelect
                                                    options={[{ value: '', label: 'Semua Cabang' }, ...cabangOptions.map(o => ({ value: o.code, label: o.name }))]}
                                                    value={bulkForm.kode_cabang}
                                                    onChange={v => setBulkForm(f => ({ ...f, kode_cabang: v }))}
                                                    placeholder="Semua Cabang" />
                                            </div>
                                        </div>

                                        {/* Step 2 */}
                                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Langkah 2 — Jumlah Sesi</p>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Berapa kali patroli dalam satu shift?</label>
                                                <input type="number" min={1} max={24} value={bulkForm.jumlah}
                                                    onChange={e => setBulkForm(f => ({ ...f, jumlah: parseInt(e.target.value) || 1 }))}
                                                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
                                                <p className="text-xs text-gray-400 mt-1.5">Contoh: 4 sesi dalam shift 8 jam → setiap 2 jam sekali</p>
                                            </div>
                                            <button type="button" onClick={handleGenerate}
                                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-opacity-90 shadow-sm transition">
                                                <Zap className="w-4 h-4" /> Generate Waktu Otomatis
                                            </button>
                                            {generatedShift && (
                                                <div className="rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-700/40 p-3 text-xs text-green-700 dark:text-green-400">
                                                    ✓ Dibagi rata dari <span className="font-mono font-bold">{fmt(generatedShift.jam_masuk)}</span> s/d <span className="font-mono font-bold">{fmt(generatedShift.jam_pulang)}</span> → <span className="font-bold">{sesiList.length} sesi</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Step 3: Preview */}
                                    {sesiList.length > 0 && (
                                        <div className="rounded-xl border border-green-200 dark:border-green-700/40 bg-green-50/50 dark:bg-green-500/5 p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Langkah 3 — Preview &amp; Edit ({sesiList.length} Sesi)
                                                </p>
                                                <button type="button" onClick={() => setSesiList(s => [...s, { start_time: '', end_time: '', name: `Patroli ${s.length + 1}` }])}
                                                    className="text-xs text-brand-500 hover:underline flex items-center gap-1">
                                                    <Plus className="w-3 h-3" /> Tambah Sesi
                                                </button>
                                            </div>
                                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                                {sesiList.map((s, i) => (
                                                    <SesiCard key={i} idx={i} sesi={s}
                                                        onChange={ns => setSesiList(list => list.map((l, li) => li === i ? ns : l))}
                                                        onRemove={() => setSesiList(list => list.filter((_, li) => li !== i))} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                // Edit Sesi
                                <>
                                    {/* Dept & Cabang */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5 block">
                                                Departemen <span className="text-xs font-normal text-gray-400">(opsional)</span>
                                            </label>
                                            <SearchableSelect
                                                options={[{ value: '', label: 'Semua Departemen' }, ...deptOptions.map(o => ({ value: o.code, label: o.name }))]}
                                                value={editForm.kode_dept}
                                                onChange={v => setEditForm(f => ({ ...f, kode_dept: v }))}
                                                placeholder="Semua Dept" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5 block">
                                                Cabang <span className="text-xs font-normal text-gray-400">(opsional)</span>
                                            </label>
                                            <SearchableSelect
                                                options={[{ value: '', label: 'Semua Cabang' }, ...cabangOptions.map(o => ({ value: o.code, label: o.name }))]}
                                                value={editForm.kode_cabang}
                                                onChange={v => setEditForm(f => ({ ...f, kode_cabang: v }))}
                                                placeholder="Semua Cabang" />
                                        </div>
                                    </div>
                                    {/* Waktu */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5 block">
                                                <Clock className="inline w-3.5 h-3.5 mr-1" />Waktu Mulai (HH:MM)
                                            </label>
                                            <input type="text" inputMode="numeric" maxLength={5}
                                                value={editForm.start_time} placeholder="08:00"
                                                onChange={e => { let v = e.target.value.replace(/[^0-9:]/g, ''); if (v.length === 2 && !v.includes(':') && editForm.start_time.length === 1) v += ':'; setEditForm(f => ({ ...f, start_time: v.slice(0, 5) })); }}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500/20" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5 block">
                                                <Clock className="inline w-3.5 h-3.5 mr-1" />Waktu Selesai (HH:MM)
                                            </label>
                                            <input type="text" inputMode="numeric" maxLength={5}
                                                value={editForm.end_time} placeholder="10:00"
                                                onChange={e => { let v = e.target.value.replace(/[^0-9:]/g, ''); if (v.length === 2 && !v.includes(':') && editForm.end_time.length === 1) v += ':'; setEditForm(f => ({ ...f, end_time: v.slice(0, 5) })); }}
                                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-brand-500/20" />
                                        </div>
                                    </div>
                                    {/* Nama */}
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5 block">Nama Sesi</label>
                                        <input type="text" value={editForm.name} placeholder="Contoh: Patroli 1"
                                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20" />
                                    </div>
                                    {/* Status */}
                                    <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800 p-4">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Status Sesi</p>
                                            <p className="text-xs text-gray-400">{editForm.is_active ? 'Sesi aktif' : 'Sesi dinonaktifkan'}</p>
                                        </div>
                                        <Toggle checked={!!editForm.is_active} onChange={v => setEditForm(f => ({ ...f, is_active: v ? 1 : 0 }))} />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 transition">
                                Batal
                            </button>
                            <button type="button" disabled={isSubmitting}
                                onClick={modalMode === 'bulk' ? handleSubmitBulk : handleSubmitEdit}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-opacity-90 rounded-xl shadow-sm disabled:opacity-60 transition">
                                {isSubmitting
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                                    : <><Save className="w-4 h-4" /> {modalMode === 'bulk' ? `Simpan ${sesiList.length} Sesi` : 'Simpan'}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

export default withPermission(MasterJadwalTugasPage, { permissions: ['jadwal.index'] });
