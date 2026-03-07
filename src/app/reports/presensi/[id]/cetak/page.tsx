'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Printer, ArrowLeft } from 'lucide-react';

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

export default function CetakLaporanPresensiKaryawan() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const nik = params?.id as string;
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    const [data, setData] = useState<PresensiDetailItem[]>([]);
    const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [vendorConfig, setVendorConfig] = useState<{ nama?: string | null, logo?: string | null, penandatangan_nama?: string | null, penandatangan_jabatan?: string | null, signatories?: { nama: string, jabatan: string }[] }>({});

    const getImageUrl = (filename: string | null) => {
        if (!filename) return null;
        if (filename.startsWith('http')) return filename;
        return `${process.env.NEXT_PUBLIC_API_URL}/storage/uploads/absensi/${filename}`;
    };

    const getStatusBadge = (status: string) => {
        const s = status ? status.trim().toLowerCase() : '';
        let badgeClass = "text-gray-700";
        let label = status;

        if (s === 'h' || s === 'hadir') {
            badgeClass = "text-green-700";
            label = "Hadir";
        } else if (s === 'i' || s === 'izin') {
            badgeClass = "text-blue-700";
            label = "Izin";
        } else if (s === 's' || s === 'sakit') {
            badgeClass = "text-yellow-700";
            label = "Sakit";
        } else if (s === 'a' || s === 'alpha') {
            badgeClass = "text-red-700";
            label = "Alpha";
        } else if (s === 'c' || s === 'cuti') {
            badgeClass = "text-purple-700";
            label = "Cuti";
        } else if (s === 'libr' || s === 'lb' || s === 'libur') {
            badgeClass = "text-gray-500";
            label = "Libur";
        } else if (s === 'ta') {
            badgeClass = "text-gray-800";
            label = "TA";
        }

        return (
            <span className={clsx("font-bold text-[10px]", badgeClass)}>
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

                if (response.vendor_logo !== undefined || response.vendor_nama !== undefined) {
                    setVendorConfig({
                        nama: response.vendor_nama,
                        logo: response.vendor_logo,
                        penandatangan_nama: response.vendor_penandatangan_nama,
                        penandatangan_jabatan: response.vendor_penandatangan_jabatan,
                        signatories: response.vendor_signatories || []
                    });
                }

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
        if (nik) fetchData();
    }, [nik, startDate, endDate]);

    useEffect(() => {
        if (!loading && data.length > 0) {
            const timer = setTimeout(() => {
                window.print();
            }, 2500); // Beri cukup waktu (2.5 detik) agar seluruh gambar termuat penuh sebelum mesin print browser memblokir halaman
            return () => clearTimeout(timer);
        }
    }, [loading, data]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Memuat Laporan...</div>;
    }

    if (data.length === 0) {
        return <div className="flex items-center justify-center h-screen">Data tidak ditemukan pada periode ini.</div>;
    }

    return (
        <div className="bg-gray-100 min-h-screen p-8 print:p-0 print:bg-white text-black font-sans">
            <div className="max-w-4xl mx-auto bg-white shadow-lg p-8 print:shadow-none print:w-full print:p-0">
                {/* Actions - Hidden when printing */}
                <div className="flex justify-between mb-8 print:hidden">
                    <button
                        onClick={() => window.close()}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-4 h-4" /> Kembali
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-brand-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90"
                    >
                        <Printer className="w-4 h-4" /> Cetak Laporan
                    </button>
                </div>

                <div id="print-area">
                    {/* Header */}
                    <div className="flex mb-8 border-b-2 border-gray-800 pb-6 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img src={vendorConfig?.logo || "/images/logo/logo-kcd.png"} alt="Company Logo" className="h-16 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight uppercase">
                                    {vendorConfig?.nama || "PLATARAN INDONESIA"}
                                </h1>
                                <p className="text-sm text-gray-600 tracking-wide font-medium">Laporan Aktivitas Presensi</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-blue-800 uppercase tracking-widest bg-blue-50 px-4 py-1 rounded-full border border-blue-200 inline-block">Laporan Presensi</h2>
                            <p className="text-sm text-gray-600 mt-2 font-medium">Periode: {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}</p>
                        </div>
                    </div>

                    {/* Employee Info */}
                    <div className="flex items-center gap-6 mb-8">
                        <div>
                            <h3 className="text-xl font-extrabold text-gray-900 mb-1 tracking-tight">
                                {employee?.nama_karyawan || "Memuat..."}
                            </h3>
                            <p className="font-mono text-sm text-gray-500 mb-2">{employee?.nik || "-"}</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span><strong>Jabatan:</strong> {employee?.nama_jabatan || "-"}</span> |
                                <span><strong>Departemen:</strong> {employee?.nama_dept || "-"}</span> |
                                <span><strong>Cabang:</strong> {employee?.nama_cabang || "-"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Counters */}
                    <div className="grid grid-cols-5 gap-3 mb-8 text-center text-[10px] uppercase font-bold tracking-wider">
                        <div className="border border-gray-300 p-2 rounded-lg">
                            <div className="text-gray-500 mb-1">Total Hadir</div>
                            <div className="text-lg font-black text-green-700">{data.filter(d => ['h', 'hadir'].includes(d.status?.trim().toLowerCase())).length} hari</div>
                        </div>
                        <div className="border border-gray-300 p-2 rounded-lg">
                            <div className="text-gray-500 mb-1">Terlambat</div>
                            <div className="text-lg font-black text-orange-600">{data.filter(d => d.terlambat !== '-').length} kali</div>
                        </div>
                        <div className="border border-gray-300 p-2 rounded-lg">
                            <div className="text-gray-500 mb-1">Alpha</div>
                            <div className="text-lg font-black text-red-600">{data.filter(d => ['a', 'alpha'].includes(d.status?.trim().toLowerCase())).length} hari</div>
                        </div>
                        <div className="border border-gray-300 p-2 rounded-lg">
                            <div className="text-gray-500 mb-1">Izin/Cuti/Sakit</div>
                            <div className="text-lg font-black text-blue-700">{data.filter(d => ['i', 'c', 's', 'izin', 'cuti', 'sakit'].includes(d.status?.trim().toLowerCase())).length} hari</div>
                        </div>
                        <div className="border border-gray-300 p-2 rounded-lg">
                            <div className="text-gray-500 mb-1">TA</div>
                            <div className="text-lg font-black text-gray-800">{data.filter(d => ['ta', 'tidak absen'].includes(d.status?.trim().toLowerCase())).length} hari</div>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full text-xs text-left align-middle border-collapse border border-gray-300">
                        <thead className="bg-gray-100 text-gray-900 border-b-2 border-gray-400">
                            <tr>
                                <th className="px-2 py-2 border border-gray-300 text-center w-[5%]">No</th>
                                <th className="px-2 py-2 border border-gray-300 w-[15%]">Tanggal</th>
                                <th className="px-2 py-2 border border-gray-300 w-[15%]">Jadwal</th>
                                <th className="px-2 py-2 border border-gray-300 w-[20%]">Masuk</th>
                                <th className="px-2 py-2 border border-gray-300 w-[20%]">Pulang</th>
                                <th className="px-2 py-2 border border-gray-300 text-center w-[10%]">Keterlambatan</th>
                                <th className="px-2 py-2 border border-gray-300 text-center w-[15%]">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, key) => (
                                <tr key={key} className={key % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                    <td className="px-2 py-2 border border-gray-300 text-center font-medium my-no-break">
                                        {key + 1}
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 my-no-break">
                                        <div className="font-semibold text-gray-900 whitespace-nowrap">
                                            {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 my-no-break">
                                        <div className="font-semibold text-gray-900">{item.nama_jam_kerja || "-"}</div>
                                        <div className="text-[10px] text-gray-500 font-mono tracking-tighter whitespace-nowrap">{item.jam_masuk_jadwal} - {item.jam_pulang_jadwal}</div>
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 my-no-break">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium font-mono tracking-tight text-gray-900">{item.jam_in || "-"}</span>
                                            {item.foto_in && (
                                                <img
                                                    src={getImageUrl(item.foto_in) || undefined}
                                                    alt="In"
                                                    className="h-8 w-8 rounded object-cover border border-gray-300"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 my-no-break">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium font-mono tracking-tight text-gray-900">{item.jam_out || "-"}</span>
                                            {item.foto_out && (
                                                <img
                                                    src={getImageUrl(item.foto_out) || undefined}
                                                    alt="Out"
                                                    className="h-8 w-8 rounded object-cover border border-gray-300"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 text-center my-no-break">
                                        {item.terlambat !== "-" ? (
                                            <span className="text-orange-700 font-bold">{item.terlambat}</span>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 text-center my-no-break">
                                        <div className="flex flex-col items-center">
                                            {getStatusBadge(item.status)}
                                            {item.keterangan && <span className="text-[9px] text-gray-500 italic text-center leading-tight mt-0.5">{item.keterangan}</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Footer */}
                    <div className="flex mt-10 pt-6 justify-between text-sm break-inside-avoid px-2">
                        <div className="text-gray-600 font-medium">
                            <p>Dicetak pada: <span className="font-semibold text-gray-900">{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                            <p className="mt-1">Dicetak oleh: <span className="font-semibold text-gray-900">Admin System</span></p>
                        </div>
                        <div className="flex flex-row-reverse gap-20 text-center">
                            {vendorConfig?.signatories && vendorConfig.signatories.length > 0 ? (
                                vendorConfig.signatories.map((sig, idx) => (
                                    <div key={idx} className="flex flex-col items-center">
                                        <p className="text-gray-600 mb-20 font-medium">
                                            {idx === 0 ? "Mengetahui," : idx === vendorConfig.signatories!.length - 1 ? "Dibuat Oleh," : "Disetujui Oleh,"}
                                        </p>
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-gray-900 border-b border-gray-800 pb-1 mb-1 px-4">{sig.nama}</span>
                                            <span className="font-semibold text-gray-600">{sig.jabatan}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex flex-col items-center">
                                        <p className="text-gray-600 mb-20 font-medium">Mengetahui,</p>
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-gray-900 border-b border-gray-800 pb-1 mb-1 px-4">{vendorConfig?.penandatangan_nama || "Manager Operasional"}</span>
                                            <span className="font-semibold text-gray-600">{vendorConfig?.penandatangan_jabatan || "Manager Operasional"}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <p className="text-gray-600 mb-20 font-medium">Dibuat Oleh,</p>
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-gray-900 border-b border-gray-800 pb-1 mb-1 px-4">Tim HR / Admin</span>
                                            <span className="font-semibold text-gray-600">Admin</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait; 
                        margin: 15mm 10mm;
                    }
                    body {
                        background-color: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    /* Hide everything outside print area */
                    .sidebar, header, .header-area, nav, footer {
                        display: none !important;
                    }

                    main { padding: 0 !important; margin: 0 !important; }

                    .my-no-break {
                        page-break-inside: avoid !important;
                    }
                }
            `}</style>
        </div>
    );
}
