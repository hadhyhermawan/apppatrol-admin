'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, User, CheckCircle, AlertTriangle, Check, X } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import SearchableSelect from '@/components/ui/SearchableSelect';
import dynamic from 'next/dynamic';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />
});

// --- TYPES ---
type ReguSlot = {
    jam_ke: number;
    rentang: string;
    mulai: string;
    batas: string;
    terpenuhi: boolean;
    jumlah_event: number;
}

type ReguMember = {
    nik: string;
    nama_karyawan: string;
    kode_dept: string;
    sumber_jadwal: string | null;
    sudah_patroli: boolean;
    jumlah_sesi_patroli: number;
    jam_patrol_terakhir: string | null;
}

type ReguGroup = {
    uid: string;
    kode_cabang: string;
    nama_cabang: string;
    kode_jam_kerja: string;
    nama_jam_kerja: string;
    jam_masuk: string | null;
    jam_pulang: string | null;
    lintashari: boolean;
    total_anggota: number;
    sudah_patroli: number;
    belum_patroli: number;
    jumlah_sesi_patroli: number;
    slot_wajib: number;
    slot_terpenuhi: number;
    slot_kurang: number;
    persen_slot: number;
    status_level: string;
    shift_timing_status: string;
    shift_timing_label: string;
    members: ReguMember[];
    hourly_slots: ReguSlot[];
}

type MonitoringSummary = {
    total_regu_shift: number;
    total_anggota: number;
    total_sudah_patroli: number;
    total_belum_patroli: number;
    total_slot_wajib: number;
    total_slot_terpenuhi: number;
    total_slot_kurang: number;
    persen_slot: number;
}

function SecurityTeamsPage() {
    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Monitoring Regu (Patroli)" />
            <LegacyMonitoringView />
        </MainLayout>
    );
}

// === COMPONENT: LEGACY MONITORING VIEW (Authentic Port) ===
function LegacyMonitoringView() {
    const [monitorDate, setMonitorDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [groups, setGroups] = useState<ReguGroup[]>([]);
    const [summary, setSummary] = useState<MonitoringSummary | null>(null);
    const [loading, setLoading] = useState(false);

    const { isSuperAdmin } = usePermissions();

    // Filter State
    const [vendorOptions, setVendorOptions] = useState<{ value: string, label: string }[]>([]);
    const [selectedVendor, setSelectedVendor] = useState('');
    const [cabangOptions, setCabangOptions] = useState<{ kode_cabang: string; nama_cabang: string }[]>([]);
    const [selectedCabang, setSelectedCabang] = useState('');
    const [deptOptions, setDeptOptions] = useState<{ kode_dept: string; nama_dept: string }[]>([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [shiftOptions, setShiftOptions] = useState<{ kode_jam_kerja: string; nama_jam_kerja: string }[]>([]);
    const [selectedShift, setSelectedShift] = useState('');

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const cabParams = new URLSearchParams();
                if (isSuperAdmin && selectedVendor) {
                    cabParams.append('vendor_id', selectedVendor);
                }

                const calls = [
                    apiClient.get(`/master/cabang/options?${cabParams.toString()}`),
                    apiClient.get('/master/departemen/options'),
                    apiClient.get('/monitoring/jam-kerja-options')
                ];

                if (isSuperAdmin) {
                    calls.push(apiClient.get('/vendors'));
                }

                const responses = await Promise.all(calls);
                setCabangOptions(responses[0] as any);
                setDeptOptions(responses[1] as any);

                const shiftRes = responses[2] as any;
                if (shiftRes && Array.isArray(shiftRes.data)) {
                    setShiftOptions(shiftRes.data.map((s: any) => ({ kode_jam_kerja: s.kode, nama_jam_kerja: s.nama })));
                } else if (Array.isArray(shiftRes)) {
                    setShiftOptions(shiftRes.map((s: any) => ({ kode_jam_kerja: s.kode_jam_kerja || s.kode, nama_jam_kerja: s.nama_jam_kerja || s.nama })));
                }

                if (isSuperAdmin && Array.isArray(responses[3])) {
                    setVendorOptions(responses[3].map((v: any) => ({ value: v.id.toString(), label: v.nama_vendor })));
                } else if (isSuperAdmin && responses[3] && Array.isArray((responses[3] as any).data)) {
                    setVendorOptions((responses[3] as any).data.map((v: any) => ({ value: v.id.toString(), label: v.nama_vendor })));
                }
            } catch (error) {
                console.error("Failed options", error);
            }
        };
        fetchOptions();
    }, [isSuperAdmin, selectedVendor]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `/monitoring-regu?tanggal=${monitorDate}`;
            if (selectedCabang) url += `&kode_cabang=${selectedCabang}`;
            if (selectedDept) url += `&kode_dept=${selectedDept}`;
            if (selectedShift) url += `&kode_jam_kerja=${selectedShift}`;
            if (isSuperAdmin && selectedVendor) url += `&vendor_id=${selectedVendor}`;

            const response: any = await apiClient.get(url);
            if (response && response.regu_groups) {
                setGroups(response.regu_groups);
                setSummary(response.summary);
            } else {
                setGroups([]);
                setSummary(null);
            }
        } catch (error) {
            console.error("Failed to fetch monitoring data", error);
            setGroups([]);
            setSummary(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Auto refresh every minute
        return () => clearInterval(interval);
    }, [monitorDate, selectedCabang, selectedDept, selectedShift, selectedVendor]);

    return (
        <div>
            {/* Toolbar */}
            <div className="mb-6 bg-white dark:bg-boxdark p-4 rounded-lg shadow-sm border border-stroke dark:border-strokedark flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className={`grid grid-cols-1 gap-4 w-full xl:w-auto ${isSuperAdmin ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
                    <div>
                        <DatePicker
                            id="date-monitor"
                            placeholder="Pilih Tanggal"
                            defaultDate={monitorDate}
                            enableTime={false}
                            dateFormat="Y-m-d"
                            onChange={(dates: Date[], dateStr: string) => setMonitorDate(dateStr)}
                        />
                    </div>

                    {isSuperAdmin && (
                        <div>
                            <SearchableSelect
                                value={selectedVendor}
                                onChange={setSelectedVendor}
                                options={[
                                    { value: '', label: 'Semua Vendor' },
                                    ...vendorOptions
                                ]}
                                placeholder="Semua Vendor"
                            />
                        </div>
                    )}

                    <div>
                        <SearchableSelect
                            value={selectedCabang}
                            onChange={setSelectedCabang}
                            options={[
                                { value: '', label: 'Semua Cabang' },
                                ...cabangOptions.map(opt => ({ value: opt.kode_cabang, label: opt.nama_cabang }))
                            ]}
                            placeholder="Semua Cabang"
                        />
                    </div>

                    <div>
                        <SearchableSelect
                            value={selectedDept}
                            onChange={setSelectedDept}
                            options={[
                                { value: '', label: 'Semua Dept' },
                                ...deptOptions.map(opt => ({ value: opt.kode_dept, label: opt.nama_dept }))
                            ]}
                            placeholder="Semua Dept"
                        />
                    </div>

                    <div>
                        <SearchableSelect
                            value={selectedShift}
                            onChange={setSelectedShift}
                            options={[
                                { value: '', label: 'Semua Shift' },
                                ...shiftOptions.map(opt => ({ value: opt.kode_jam_kerja, label: opt.nama_jam_kerja }))
                            ]}
                            placeholder="Semua Shift"
                        />
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="flex items-center justify-between xl:justify-end gap-3 mt-4 xl:mt-0 w-full xl:w-auto min-w-0 overflow-hidden">
                    {summary && (
                        <div className="flex gap-2 text-xs xl:text-sm overflow-x-auto pb-1 xl:pb-0 scrollbar-hide flex-1 xl:flex-none">
                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-meta-4 px-3 py-1.5 rounded whitespace-nowrap shrink-0">
                                <User size={14} className="text-brand-500" />
                                <span className="font-bold">{summary.total_anggota}</span> Anggota
                            </div>
                            <div className="flex items-center gap-1.5 text-success bg-success/10 px-3 py-1.5 rounded border border-success/20 whitespace-nowrap shrink-0">
                                <CheckCircle size={14} />
                                <span className="font-bold">{summary.total_sudah_patroli}</span> Sudah
                            </div>
                            <div className="flex items-center gap-1.5 text-danger bg-danger/10 px-3 py-1.5 rounded border border-danger/20 whitespace-nowrap shrink-0">
                                <AlertTriangle size={14} />
                                <span className="font-bold">{summary.total_belum_patroli}</span> Belum
                            </div>
                            <div className="flex items-center gap-1.5 text-black dark:text-white bg-gray-50 dark:bg-meta-4 px-3 py-1.5 rounded whitespace-nowrap shrink-0">
                                <span className="font-bold">{summary.persen_slot}%</span> Kepatuhan
                            </div>
                        </div>
                    )}

                    <button onClick={fetchData} className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded transition text-gray-600 dark:text-gray-300">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {groups.map((group) => (
                    <div key={group.uid} className="bg-white dark:bg-boxdark rounded-lg shadow-sm border border-stroke dark:border-strokedark flex flex-col h-full overflow-hidden">
                        {/* Header */}
                        <div className={`px-4 py-3 border-b border-stroke dark:border-strokedark flex justify-between items-center ${group.status_level === 'aman' ? 'bg-success/5 dark:bg-success/10' : 'bg-danger/5 dark:bg-danger/10'
                            }`}>
                            <div>
                                <h3 className="font-bold text-black dark:text-white flex items-center gap-2">
                                    {group.nama_jam_kerja || group.kode_jam_kerja}
                                    {group.status_level === 'aman' ? (
                                        <span className="bg-success text-white text-[10px] px-2 py-0.5 rounded-full">Aman</span>
                                    ) : (
                                        <span className="bg-danger text-white text-[10px] px-2 py-0.5 rounded-full">Perlu Tindak</span>
                                    )}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {group.nama_cabang} • {group.jam_masuk?.substring(0, 5)} - {group.jam_pulang?.substring(0, 5)} • {group.shift_timing_label}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-black dark:text-white">{group.persen_slot}%</div>
                                <div className="text-[10px] text-gray-500">Kepatuhan Slot</div>
                            </div>
                        </div>

                        {/* Slots Visualization */}
                        <div className="px-4 py-3 border-b border-stroke dark:border-strokedark bg-gray-50/50 dark:bg-meta-4/30">
                            <div className="flex flex-wrap gap-1">
                                {group.hourly_slots.map((slot) => (
                                    <div
                                        key={slot.jam_ke}
                                        title={`Jam ke-${slot.jam_ke}: ${slot.rentang} (${slot.jumlah_event} kegiatan)`}
                                        className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold cursor-help transition hover:scale-110 ${slot.terpenuhi
                                            ? 'bg-success text-white'
                                            : group.shift_timing_status === 'sudah_berlalu' || (group.shift_timing_status === 'sedang_berlangsung' && slot.jam_ke === 1) // Logic Simplified
                                                ? 'bg-danger text-white'
                                                : 'bg-gray-200 dark:bg-meta-4 text-gray-400'
                                            }`}
                                    >
                                        {slot.jam_ke}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Body - Member List */}
                        <div className="p-0 flex-1 overflow-y-auto max-h-[400px]">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-meta-4">
                                    <tr>
                                        <th className="px-4 py-2">Anggota</th>
                                        <th className="px-4 py-2 text-center">Patroli</th>
                                        <th className="px-4 py-2 text-right">Terakhir</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.members.map((member) => (
                                        <tr key={member.nik} className="border-b border-stroke dark:border-strokedark last:border-0 hover:bg-gray-50 dark:hover:bg-meta-4/20 transition">
                                            <td className="px-4 py-2">
                                                <div className="font-semibold text-black dark:text-white truncate max-w-[150px]" title={member.nama_karyawan}>
                                                    {member.nama_karyawan}
                                                </div>
                                                <div className="text-xs text-gray-500">{member.nik}</div>
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <div className="flex flex-col items-center">
                                                    {member.sudah_patroli ? (
                                                        <span className="text-success flex items-center gap-1 text-xs font-medium bg-success/10 px-2 py-0.5 rounded-full">
                                                            <Check size={12} strokeWidth={3} /> {member.jumlah_sesi_patroli} Sesi
                                                        </span>
                                                    ) : (
                                                        <span className="text-danger flex items-center gap-1 text-xs font-medium bg-danger/10 px-2 py-0.5 rounded-full">
                                                            <X size={12} strokeWidth={3} /> Belum
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-right font-mono text-xs">
                                                {member.jam_patrol_terakhir ? (
                                                    <span className="text-black dark:text-white">{member.jam_patrol_terakhir.substring(0, 5)}</span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {group.members.length === 0 && (
                                <div className="p-4 text-center text-gray-400 text-sm">Tidak ada anggota yang dijadwalkan.</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {groups.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500 bg-white dark:bg-boxdark rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                    <p>Tidak ada jadwal regu aktif untuk filter yang dipilih.</p>
                </div>
            )}
        </div>
    );
}

export default withPermission(SecurityTeamsPage, { permissions: ['monitoringpatrol.index'] });
