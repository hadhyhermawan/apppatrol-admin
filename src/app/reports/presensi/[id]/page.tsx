'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { MapPin, Eye, Printer, ArrowLeft, ArrowRight, X } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { withPermission } from '@/hoc/withPermission';
import clsx from 'clsx';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import idLocale from '@fullcalendar/core/locales/id';
import Link from 'next/link';

type PresensiDetailItem = {
    tanggal: string;
    jam_masuk: string | null;
    jam_pulang: string | null;
    jam_in: string | null;
    jam_out: string | null;
    foto_in: string | null;
    foto_out: string | null;
    lokasi_in: string | null;
    lokasi_out: string | null;
    status: string;
    keterangan: string | null;
    jam_kerja: string | null;
    terlambat: string;
    pulang_cepat: string;
    denda: number;
    lembur: number;
    total_jam: number;
    nama_jam_kerja: string | null;
    jam_masuk_jadwal: string | null;
    jam_pulang_jadwal: string | null;
};

type EmployeeInfo = {
    nik: string;
    nama_karyawan: string;
    nama_dept: string;
    nama_cabang: string;
    nama_jabatan: string;
    foto: string | null;
};

function LaporanDetailKaryawanPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const nik = params?.id as string;
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    const [data, setData] = useState<PresensiDetailItem[]>([]);
    const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrintClick = () => {
        setIsPrinting(true);
        // Reset the button state after a generous delay since print blocks JS execution.
        setTimeout(() => setIsPrinting(false), 15000);
    };

    const getImageUrl = (filename: string | null) => {
        if (!filename) return null;
        if (filename.startsWith('http')) return filename;
        return `${process.env.NEXT_PUBLIC_API_URL}/storage/uploads/absensi/${filename}`;
    };

    const getMapsUrl = (coords: string | null) => {
        if (!coords) return '#';
        return `https://www.google.com/maps?q=${coords}`;
    };

    const getStatusColors = (status: string) => {
        const s = status ? status.trim().toLowerCase() : '';
        if (s === 'h' || s === 'hadir') return '#10B981';
        if (s === 'i' || s === 'izin') return '#3B82F6';
        if (s === 's' || s === 'sakit') return '#EAB308';
        if (s === 'a' || s === 'alpha') return '#EF4444';
        if (s === 'c' || s === 'cuti') return '#8B5CF6';
        if (s === 'libr' || s === 'lb' || s === 'libur') return '#9CA3AF';
        if (s === 'ta') return '#6B7280';
        return '#6B7280';
    };

    const getStatusBadge = (status: string) => {
        const s = status ? status.trim().toLowerCase() : '';
        let badgeClass = "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400";
        let label = status;

        if (s === 'h' || s === 'hadir') {
            badgeClass = "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400";
            label = "Hadir";
        } else if (s === 'i' || s === 'izin') {
            badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
            label = "Izin";
        } else if (s === 's' || s === 'sakit') {
            badgeClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400";
            label = "Sakit";
        } else if (s === 'a' || s === 'alpha') {
            badgeClass = "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
            label = "Alpha";
        } else if (s === 'c' || s === 'cuti') {
            badgeClass = "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400";
            label = "Cuti";
        } else if (s === 'libr' || s === 'lb' || s === 'libur') {
            badgeClass = "bg-gray-100 text-gray-500 dark:bg-gray-700/20 dark:text-gray-400";
            label = "Libur";
        } else if (s === 'ta') {
            badgeClass = "bg-gray-200 text-gray-800 dark:bg-gray-600/20 dark:text-gray-300";
            label = "TA";
        }

        return (
            <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap", badgeClass)}>
                {label}
            </span>
        );
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const url = `/laporan/presensi?start_date=${startDate}&end_date=${endDate}&search=${nik}`;
            const response: any = await apiClient.get(url);

            if (response.status && response.data.length > 0) {
                const records = response.data;
                const sortedRecords = records.sort((a: any, b: any) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
                setData(sortedRecords);

                if (records.length > 0) {
                    const first = records[0];
                    setEmployee({
                        nik: first.nik,
                        nama_karyawan: first.nama_karyawan,
                        nama_dept: first.nama_dept,
                        nama_cabang: first.nama_cabang,
                        nama_jabatan: first.nama_jabatan || "-",
                        foto: first.foto_karyawan || null
                    });
                }
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch detail", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (nik) {
            fetchData();
        }
    }, [nik, startDate, endDate]);

    const getStatusLabel = (status: string) => {
        const s = status ? status.trim().toLowerCase() : '';
        if (s === 'h' || s === 'hadir') return 'Hadir';
        if (s === 'i' || s === 'izin') return 'Izin';
        if (s === 's' || s === 'sakit') return 'Sakit';
        if (s === 'a' || s === 'alpha') return 'Alpha';
        if (s === 'c' || s === 'cuti') return 'Cuti';
        if (s === 'libr' || s === 'lb' || s === 'libur') return 'Libur';
        if (s === 'ta') return 'TA';
        return status;
    };

    const events = data.map(item => ({
        title: `${getStatusLabel(item.status)} (${item.jam_in || '-'} - ${item.jam_out || '-'})`,
        start: item.tanggal,
        backgroundColor: getStatusColors(item.status),
        borderColor: getStatusColors(item.status),
        allDay: true,
        extendedProps: item
    }));

    return (
        <MainLayout>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <PageBreadcrumb pageTitle="Detail Presensi Karyawan" />
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 rounded-lg p-1 dark:bg-meta-4">
                        <button
                            onClick={() => setViewMode('table')}
                            className={clsx(
                                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                                viewMode === 'table'
                                    ? "bg-white text-black shadow-sm dark:bg-boxdark dark:text-white"
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            )}
                        >
                            Tabel
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={clsx(
                                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                                viewMode === 'calendar'
                                    ? "bg-white text-black shadow-sm dark:bg-boxdark dark:text-white"
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            )}
                        >
                            Kalender
                        </button>
                    </div>

                    <button
                        onClick={handlePrintClick}
                        disabled={isPrinting}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl transition shadow-sm",
                            isPrinting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                        )}
                    >
                        {isPrinting ? (
                            <span className="flex items-center gap-1"><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-1"></span> Menyiapkan...</span>
                        ) : (
                            <><Printer className="h-4 w-4" /> Cetak Laporan</>
                        )}
                    </button>
                    {isPrinting && (
                        <iframe
                            src={`/reports/presensi/${nik}/cetak?startDate=${startDate}&endDate=${endDate}`}
                            style={{ position: 'absolute', width: '0', height: '0', border: 'none' }}
                            title="Print Frame"
                        />
                    )}

                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 dark:bg-boxdark dark:text-gray-300 dark:border-strokedark dark:hover:bg-meta-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </button>
                </div>
            </div>

            {previewImage && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setPreviewImage(null)}>
                    <img src={previewImage} alt="Preview" className="max-h-[90vh] max-w-full rounded-lg shadow-2xl object-contain" />
                    <button className="absolute top-5 right-5 text-white bg-black/50 rounded-full p-2 hover:bg-white/20 transition" onClick={() => setPreviewImage(null)}>
                        <X className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* Profile Header */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 mb-6">
                <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-2xl bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-100 dark:border-strokedark dark:bg-meta-4">
                        <div className="w-full h-full flex items-center justify-center bg-brand-50 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                            <span className="text-3xl font-bold uppercase">{employee?.nama_karyawan?.charAt(0) || "U"}</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-extrabold text-black dark:text-white mb-1 tracking-tight">
                            {employee?.nama_karyawan || "Memuat..."}
                        </h3>
                        <p className="font-mono text-sm text-gray-500 dark:text-gray-400 mb-3">{employee?.nik || "-"}</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-gray-100 dark:bg-meta-4 border border-gray-200 dark:border-strokedark rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {employee?.nama_jabatan || "-"}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-meta-4 border border-gray-200 dark:border-strokedark rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {employee?.nama_dept || "-"}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-meta-4 border border-gray-200 dark:border-strokedark rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {employee?.nama_cabang || "-"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
                    <div className="bg-white dark:bg-boxdark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-strokedark flex flex-col justify-center items-center text-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Total Hadir</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-green-600 dark:text-green-500">{data.filter(d => ['h', 'hadir'].includes(d.status?.trim().toLowerCase())).length}</span>
                            <span className="text-xs font-medium text-gray-400">hari</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-boxdark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-strokedark flex flex-col justify-center items-center text-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Terlambat</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-orange-500">{data.filter(d => d.terlambat !== '-').length}</span>
                            <span className="text-xs font-medium text-gray-400">kali</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-boxdark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-strokedark flex flex-col justify-center items-center text-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Alpha</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-red-500">{data.filter(d => ['a', 'alpha'].includes(d.status?.trim().toLowerCase())).length}</span>
                            <span className="text-xs font-medium text-gray-400">hari</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-boxdark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-strokedark flex flex-col justify-center items-center text-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Izin/Cuti/Sakit</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-blue-600">{data.filter(d => ['i', 'c', 's', 'izin', 'cuti', 'sakit'].includes(d.status?.trim().toLowerCase())).length}</span>
                            <span className="text-xs font-medium text-gray-400">hari</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-boxdark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-strokedark flex flex-col justify-center items-center text-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1 flex flex-col items-center">
                            TA
                            <span className="text-[9px] font-medium capitalize tracking-normal text-gray-400 mt-0.5 leading-tight">(Tidak Absen Pulang)</span>
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-gray-800 dark:text-gray-300">{data.filter(d => ['ta', 'tidak absen'].includes(d.status?.trim().toLowerCase())).length}</span>
                            <span className="text-xs font-medium text-gray-400">hari</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Display */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 mb-6">
                {viewMode === 'calendar' ? (
                    <div className="calendar-wrapper">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,listMonth'
                            }}
                            initialDate={startDate}
                            events={events}
                            height="auto"
                            locale="id"
                            locales={[idLocale]}
                            buttonText={{
                                today: 'Hari Ini',
                                month: 'Bulan',
                                list: 'List'
                            }}
                        />
                    </div>
                ) : (
                    <div className="max-w-full overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead>
                                <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                    <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                    <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Tanggal</th>
                                    <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Jadwal</th>
                                    <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white border-l border-gray-200 dark:border-strokedark">Masuk</th>
                                    <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white border-l border-gray-200 dark:border-strokedark">Pulang</th>
                                    <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white text-center border-l border-gray-200 dark:border-strokedark">Terlambat</th>
                                    <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Memuat data presensi...</td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada data untuk periode ini.</td>
                                    </tr>
                                ) : (
                                    data.map((item, key) => (
                                        <tr key={key} className={clsx(
                                            "border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-colors align-top",
                                            item.jam_out === '-' || !item.jam_out ? "bg-amber-50/60 dark:bg-amber-900/10" : ""
                                        )}>
                                            <td className="px-4 py-4 text-center">
                                                <p className="text-black dark:text-white text-sm">{key + 1}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-semibold text-black dark:text-white text-sm">
                                                    {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium mt-0.5">
                                                    {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long' })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-medium text-black dark:text-white text-sm">{item.nama_jam_kerja || "-"}</div>
                                                <div className="text-xs text-brand-500 font-mono tracking-tighter mt-0.5 bg-brand-50 dark:bg-brand-500/20 w-fit px-1.5 rounded">{item.jam_masuk_jadwal} - {item.jam_pulang_jadwal}</div>
                                            </td>
                                            <td className="px-4 py-4 border-l border-gray-200 dark:border-strokedark">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-sm font-mono tracking-tight text-black dark:text-white">{item.jam_in || "-"}</span>
                                                        {item.foto_in && (
                                                            <div className="h-9 w-9 rounded-md border-2 border-white dark:border-boxdark overflow-hidden bg-gray-200 shadow-sm cursor-pointer hover:opacity-80 transition hover:scale-105" onClick={() => setPreviewImage(getImageUrl(item.foto_in))}>
                                                                <img src={getImageUrl(item.foto_in) || undefined} alt="In" className="h-full w-full object-cover" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {item.lokasi_in && (
                                                        <a href={getMapsUrl(item.lokasi_in)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-500 hover:underline w-fit">
                                                            <MapPin className="h-3 w-3" /> Peta Lokasi
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 border-l border-gray-200 dark:border-strokedark">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-sm font-mono tracking-tight text-black dark:text-white">{item.jam_out || "-"}</span>
                                                        {item.foto_out && (
                                                            <div className="h-9 w-9 rounded-md border-2 border-white dark:border-boxdark overflow-hidden bg-gray-200 shadow-sm cursor-pointer hover:opacity-80 transition hover:scale-105" onClick={() => setPreviewImage(getImageUrl(item.foto_out))}>
                                                                <img src={getImageUrl(item.foto_out) || undefined} alt="Out" className="h-full w-full object-cover" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {item.lokasi_out && (
                                                        <a href={getMapsUrl(item.lokasi_out)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-500 hover:underline w-fit">
                                                            <MapPin className="h-3 w-3" /> Peta Lokasi
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center border-l border-gray-200 dark:border-strokedark">
                                                {item.terlambat !== "-" ? (
                                                    <span className="text-orange-600 dark:text-orange-400 font-bold text-xs bg-orange-50 dark:bg-orange-500/20 px-2.5 py-1 rounded-md">{item.terlambat}</span>
                                                ) : (
                                                    <span className="text-gray-300 dark:text-gray-600">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    {getStatusBadge(item.status)}
                                                    {item.keterangan && <span className="text-[10px] text-gray-500 italic max-w-[120px] text-center leading-tight bg-gray-50 dark:bg-meta-4 p-1 rounded font-medium">{item.keterangan}</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .calendar-wrapper .fc {
                    --fc-border-color: #e5e7eb;
                    --fc-button-text-color: #374151;
                    --fc-button-bg-color: #f3f4f6;
                    --fc-button-border-color: #d1d5db;
                    --fc-button-hover-bg-color: #e5e7eb;
                    --fc-button-hover-border-color: #d1d5db;
                    --fc-button-active-bg-color: #d1d5db;
                    --fc-button-active-border-color: #9ca3af;
                }
                .dark .calendar-wrapper .fc {
                    --fc-border-color: #374151;
                    --fc-button-text-color: #e5e7eb;
                    --fc-button-bg-color: #1f2937;
                    --fc-button-border-color: #374151;
                    --fc-button-hover-bg-color: #374151;
                    --fc-button-hover-border-color: #4b5563;
                    --fc-button-active-bg-color: #4b5563;
                    --fc-button-active-border-color: #4b5563;
                    --fc-page-bg-color: transparent;
                    --fc-neutral-bg-color: rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </MainLayout>
    );
}

export default withPermission(LaporanDetailKaryawanPage, {
    permissions: ['presensi.index']
});
