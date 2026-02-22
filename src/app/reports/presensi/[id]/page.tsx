'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Search, MapPin, Eye, Printer, ArrowLeft } from 'lucide-react';
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

    // NIK from URL param
    const nik = params?.id as string;

    // Date Range from Query Params
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    const [data, setData] = useState<PresensiDetailItem[]>([]);
    const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

    const getImageUrl = (filename: string | null) => {
        if (!filename) return null;
        if (filename.startsWith('http')) return filename;
        return `/api/storage/uploads/absensi/${filename}`;
    };

    const getProfileUrl = (filename: string | null) => {
        if (!filename) return "/images/user/user-01.png"; // Placeholder
        if (filename.startsWith('http')) return filename;
        return `/api/storage/uploads/karyawan/${filename}`;
    };

    const getMapsUrl = (coords: string | null) => {
        if (!coords) return '#';
        return `https://www.google.com/maps?q=${coords}`;
    };

    const getStatusColors = (status: string) => {
        const s = status ? status.toLowerCase() : '';
        if (s === 'h' || s === 'hadir') return '#10B981'; // Green
        if (s === 'i' || s === 'izin') return '#3B82F6'; // Blue
        if (s === 's' || s === 'sakit') return '#EAB308'; // Yellow
        if (s === 'a' || s === 'alpha') return '#EF4444'; // Red
        if (s === 'c' || s === 'cuti') return '#8B5CF6'; // Purple
        return '#6B7280'; // Gray
    };

    const getStatusBadge = (status: string) => {
        const s = status ? status.toLowerCase() : '';
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
        }

        return (
            <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-medium", badgeClass)}>
                {label}
            </span>
        );
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Use existing presensi endpoint but filter by search=NIK
            const url = `/laporan/presensi?start_date=${startDate}&end_date=${endDate}&search=${nik}`;
            const response: any = await apiClient.get(url);

            if (response.status && response.data.length > 0) {
                // The API returns a list of presensi records.
                // We need to extract employee info from the first record if available, 
                // OR we might need a separate endpoint for employee details if presensi is empty.
                // However, the user is clicking from a list where data exists, so likely presensi exists or at least employee exists.
                // But wait, if an employee has NO attendance, the list won't return anything for them?
                // The Search logic in backend filters by Name or NIK. 

                const records = response.data;
                setData(records);

                if (records.length > 0) {
                    const first = records[0];
                    setEmployee({
                        nik: first.nik,
                        nama_karyawan: first.nama_karyawan,
                        nama_dept: first.nama_dept,
                        nama_cabang: first.nama_cabang,
                        nama_jabatan: first.nama_jabatan || "-", // Add jabatan to DTO if missing
                        foto: first.foto_karyawan || null // Add foto to DTO if missing
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
        const s = status ? status.toLowerCase() : '';
        if (s === 'h' || s === 'hadir') return 'Hadir';
        if (s === 'i' || s === 'izin') return 'Izin';
        if (s === 's' || s === 'sakit') return 'Sakit';
        if (s === 'a' || s === 'alpha') return 'Alpha';
        if (s === 'c' || s === 'cuti') return 'Cuti';
        return status;
    };

    // Calendar Events
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
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between screen-only">
                <PageBreadcrumb pageTitle="Detail Presensi Karyawan" />
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 rounded-lg p-1 dark:bg-meta-4">
                        <button
                            onClick={() => setViewMode('table')}
                            className={clsx(
                                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
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
                                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                viewMode === 'calendar'
                                    ? "bg-white text-black shadow-sm dark:bg-boxdark dark:text-white"
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            )}
                        >
                            Kalender
                        </button>
                    </div>

                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-opacity-90 transition shadow-sm"
                    >
                        <Printer className="h-4 w-4" />
                        Cetak
                    </button>

                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-boxdark dark:text-gray-300 dark:border-strokedark dark:hover:bg-meta-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </button>
                </div>
            </div>

            {previewImage && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="max-h-[90vh] max-w-full rounded-lg shadow-2xl object-contain"
                    />
                </div>
            )}

            <div id="print-area">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
                    {/* Employee Card */}
                    <div className="md:col-span-3 rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                        <div className="flex flex-col md:flex-row gap-6 mb-6 items-center md:items-start">
                            {/* Photo Placeholder */}
                            <div className="h-24 w-24 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                {/* <img src={getProfileUrl(employee?.foto)} alt="Profile" className="w-full h-full object-cover"/> */}
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <span className="text-2xl font-bold">{employee?.nama_karyawan?.charAt(0) || "U"}</span>
                                </div>
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-semibold text-black dark:text-white mb-1">
                                    {employee?.nama_karyawan || "Memuat..."}
                                </h3>
                                <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="space-y-1">
                                        <p><span className="font-semibold">NIK:</span> {employee?.nik || "-"}</p>
                                        <p><span className="font-semibold">Jabatan:</span> {employee?.nama_jabatan || "-"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p><span className="font-semibold">Departemen:</span> {employee?.nama_dept || "-"}</p>
                                        <p><span className="font-semibold">Cabang:</span> {employee?.nama_cabang || "-"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p><span className="font-semibold">Periode:</span> {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {viewMode === 'calendar' ? (
                    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1 print:shadow-none print:border-none">
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
                            eventClick={(info) => {
                                // Optional: Show modal or alert
                                alert(`Status: ${info.event.title}\nTanggal: ${info.event.start?.toLocaleDateString('id-ID')}`);
                            }}
                        />
                    </div>
                ) : (
                    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1 print:shadow-none print:border-none">
                        <div className="max-w-full overflow-x-auto">
                            <table className="w-full table-auto text-sm print:text-xs">
                                <thead>
                                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                        <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                        <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Tanggal</th>
                                        <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Jadwal</th>
                                        <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">Masuk</th>
                                        <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">Pulang</th>
                                        <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Terlambat</th>
                                        <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Memuat data...</td>
                                        </tr>
                                    ) : data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada data presensi pada periode ini.</td>
                                        </tr>
                                    ) : (
                                        data.map((item, key) => (
                                            <tr key={key} className="border-b border-[#eee] dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/10">
                                                <td className="px-4 py-3 text-center border-r border-[#eee] dark:border-strokedark">
                                                    {key + 1}
                                                </td>
                                                <td className="px-4 py-3 border-r border-[#eee] dark:border-strokedark">
                                                    <p className="text-black dark:text-white">
                                                        {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 border-r border-[#eee] dark:border-strokedark">
                                                    <div className="flex flex-col text-xs">
                                                        <span className="font-semibold text-black dark:text-white">{item.nama_jam_kerja || "-"}</span>
                                                        <span>{item.jam_masuk_jadwal} - {item.jam_pulang_jadwal}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 border-r border-[#eee] dark:border-strokedark">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium text-black dark:text-white">{item.jam_in || "-"}</span>
                                                        {item.foto_in && (
                                                            <button onClick={() => setPreviewImage(getImageUrl(item.foto_in))} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                                                <Eye size={12} /> Foto
                                                            </button>
                                                        )}
                                                        {item.lokasi_in && (
                                                            <a href={getMapsUrl(item.lokasi_in)} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                                                <MapPin size={12} /> Peta
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 border-r border-[#eee] dark:border-strokedark">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium text-black dark:text-white">{item.jam_out || "-"}</span>
                                                        {item.foto_out && (
                                                            <button onClick={() => setPreviewImage(getImageUrl(item.foto_out))} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                                                <Eye size={12} /> Foto
                                                            </button>
                                                        )}
                                                        {item.lokasi_out && (
                                                            <a href={getMapsUrl(item.lokasi_out)} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                                                <MapPin size={12} /> Peta
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center border-r border-[#eee] dark:border-strokedark">
                                                    {item.terlambat !== "-" ? (
                                                        <span className="text-red-500 text-xs font-semibold">{item.terlambat}</span>
                                                    ) : (
                                                        <span className="text-green-500 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {getStatusBadge(item.status)}
                                                    {item.keterangan && <p className="text-xs text-gray-500 mt-1 italic">{item.keterangan}</p>}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {data.length > 0 && (
                                    <tfoot>
                                        <tr className="bg-gray-100 dark:bg-meta-4 font-semibold">
                                            <td colSpan={2} className="px-4 py-3 text-right">Total Kehadiran:</td>
                                            <td className="px-4 py-3 text-center text-brand-500">
                                                {data.filter(d => d.status === 'h').length} Hari
                                            </td>
                                            <td colSpan={2} className="px-4 py-3 text-right">Total Terlambat:</td>
                                            <td className="px-4 py-3 text-center text-red-500">
                                                {data.filter(d => d.terlambat !== '-').length} Kali
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4; 
                        margin: 10mm;
                    }
                    body * {
                        visibility: hidden;
                    }
                    /* Select the main content wrapper we want to print */
                    #print-area, #print-area * {
                        visibility: visible;
                    }
                    #print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    
                    /* Hide non-printable elements */
                    header, aside, .sidebar, .header-area, button, a {
                        display: none !important;
                    }
                    
                    /* Reset backgrounds and shadows for clean print */
                    .shadow-default, .shadow-2xl {
                        box-shadow: none !important;
                    }
                    .bg-white, .dark\:bg-boxdark {
                        background-color: white !important;
                    }
                    .border-stroke, .dark\:border-strokedark {
                        border: 1px solid #ddd !important;
                    }
                     /* Force table details */
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        font-size: 10pt !important;
                    }
                    th, td {
                        border: 1px solid #000 !important;
                        padding: 4px !important;
                        color: black !important;
                    }
                    thead th {
                        background-color: #f0f0f0 !important;
                        -webkit-print-color-adjust: exact; 
                    }
                }
            `}</style>
        </MainLayout >
    );
}

export default withPermission(LaporanDetailKaryawanPage, {
    permissions: ['presensi.index']
});
