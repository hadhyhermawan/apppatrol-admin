'use client';

import { useState, useEffect, Suspense } from 'react';
import apiClient from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { Check, X, CheckCircle, AlertTriangle, User } from 'lucide-react';

const UNITS = [
    { code: 'UCS', name: 'Unit Cleaning Service', short: 'UCS' },
    { code: 'UDV', name: 'Unit Driver', short: 'UDV' },
    { code: 'UK3', name: 'Unit K3L dan Keamanan', short: 'UK3' },
];

function CetakLaporanMonitoringContent() {
    const searchParams = useSearchParams();

    const unit = searchParams.get('unit') || 'UCS';
    const viewMode = searchParams.get('viewMode') || 'personal';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const search = searchParams.get('search') || '';
    const cabang = searchParams.get('cabang') || '';
    const vendorId = searchParams.get('vendorId') || '';

    const [data, setData] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [vendorConfig, setVendorConfig] = useState<any>({});

    const getImageUrl = (filename: string | null) => {
        if (!filename) return null;
        let url = filename;
        if (!filename.startsWith('http')) {
            url = `${process.env.NEXT_PUBLIC_API_URL}/storage/uploads/absensi/${filename}`;
        }
        const lastDotIndex = url.lastIndexOf('.');
        if (lastDotIndex > url.lastIndexOf('/')) {
            return url.substring(0, lastDotIndex) + '_thumb.jpg';
        }
        return url;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (vendorId) {
                try {
                    const vendorRes: any = await apiClient.get(`/vendors/${vendorId}/profile`);
                    if (vendorRes) {
                        setVendorConfig({
                            nama: vendorRes.nama_vendor,
                            logo: vendorRes.logo,
                            penandatangan_nama: vendorRes.penandatangan_nama,
                            penandatangan_jabatan: vendorRes.penandatangan_jabatan,
                            signatories: vendorRes.signatories || []
                        });
                    }
                } catch (e) {
                    console.error("Failed to fetch vendor", e);
                }
            }

            if (unit === 'UK3') {
                if (viewMode === 'regu') {
                    let url = `/monitoring-regu?tanggal=${startDate || new Date().toISOString().slice(0, 10)}`;
                    if (cabang) url += `&kode_cabang=${cabang}`;
                    if (vendorId) url += `&vendor_id=${vendorId}`;

                    const response: any = await apiClient.get(url);
                    if (response && response.regu_groups) {
                        setGroups(response.regu_groups);
                        setSummary(response.summary);

                        if (response.vendor_logo !== undefined || response.vendor_nama !== undefined) {
                            setVendorConfig({
                                nama: response.vendor_nama,
                                logo: response.vendor_logo,
                                penandatangan_nama: response.vendor_penandatangan_nama,
                                penandatangan_jabatan: response.vendor_penandatangan_jabatan,
                                signatories: response.vendor_signatories || []
                            });
                        }
                    }
                } else {
                    let url = '/security/patrol?';
                    if (search) url += `search=${search}&`;
                    if (startDate) url += `date_start=${startDate}&`;
                    if (endDate) url += `date_end=${endDate}&`;
                    if (vendorId) url += `vendor_id=${vendorId}&`;

                    const response: any = await apiClient.get(url);
                    if (Array.isArray(response)) {
                        setData(response);
                    }
                }
            } else {
                let url = `/security/tasks?kode_dept=${unit}&`;
                if (search) url += `search=${search}&`;
                if (startDate) url += `date_start=${startDate}&`;
                if (endDate) url += `date_end=${endDate}&`;
                if (vendorId) url += `vendor_id=${vendorId}&`;

                const response: any = await apiClient.get(url);
                if (Array.isArray(response)) {
                    setData(response);
                }
            }
        } catch (error) {
            console.error("Failed to fetch detail", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [unit, viewMode, startDate, endDate, search, cabang, vendorId]);

    useEffect(() => {
        if (!loading && (data.length > 0 || groups.length > 0)) {
            let timer: NodeJS.Timeout;

            // Allow up to 0.8 seconds for regular loads
            timer = setTimeout(() => {
                window.print();
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [loading, data, groups]);

    const unitName = UNITS.find(u => u.code === unit)?.name || '';

    if (loading) {
        return <div className="flex items-center justify-center p-8">Memuat Laporan...</div>;
    }

    if (data.length === 0 && groups.length === 0) {
        return <div className="flex items-center justify-center p-8">Data tidak ditemukan.</div>;
    }

    return (
        <div className="bg-white min-h-screen text-black font-sans print:p-0">
            <div className="w-full">
                {/* Header */}
                <div className="flex mb-6 border-b-2 border-gray-800 pb-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={vendorConfig?.logo || "/images/logo/logo-kcd.png"} alt="Company Logo" className="h-12 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight uppercase">
                                {vendorConfig?.nama || "PLATARAN INDONESIA"}
                            </h1>
                            <p className="text-sm text-gray-600 tracking-wide font-medium">Laporan TUGAS MONITORING</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-bold text-blue-800 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200 inline-block">Monitoring {unitName}</h2>
                        <p className="text-xs text-gray-600 mt-2 font-medium">
                            {viewMode === 'regu'
                                ? `Tanggal: ${startDate || new Date().toISOString().slice(0, 10)}`
                                : `Periode: ${startDate || '-'} s/d ${endDate || '-'}`
                            }
                        </p>
                    </div>
                </div>

                {viewMode === 'regu' ? (
                    <div className="space-y-6">
                        {summary && (
                            <div className="flex flex-wrap gap-4 justify-between bg-gray-50 border border-gray-200 p-4 rounded-lg mb-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <User className="text-blue-500 w-5 h-5" />
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Total Anggota</p>
                                        <p className="font-bold">{summary.total_anggota}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="text-green-600 w-5 h-5" />
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Sudah Patroli</p>
                                        <p className="font-bold text-green-700">{summary.total_sudah_patroli}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="text-red-600 w-5 h-5" />
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Belum Patroli</p>
                                        <p className="font-bold text-red-700">{summary.total_belum_patroli}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Kepatuhan</p>
                                    <p className="font-bold text-blue-700 text-lg">{summary.persen_slot}%</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {groups.map((group) => (
                                <div key={group.uid} className="border border-gray-300 rounded-lg break-inside-avoid shadow-sm mb-4">
                                    <div className={`px-3 py-2 border-b border-gray-300 flex justify-between items-center ${group.status_level === 'aman' ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1">
                                                {group.nama_jam_kerja || group.kode_jam_kerja}
                                                {group.status_level === 'aman' ? (
                                                    <span className="text-[9px] bg-green-600 text-white px-1.5 py-0.5 rounded uppercase">Aman</span>
                                                ) : (
                                                    <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded uppercase">Perlu Tindak</span>
                                                )}
                                            </h3>
                                            <p className="text-[10px] text-gray-600 mt-0.5">
                                                {group.nama_cabang} • {group.jam_masuk?.substring(0, 5)} - {group.jam_pulang?.substring(0, 5)}
                                            </p>
                                        </div>
                                        <div className="text-right text-xs font-bold text-gray-900">
                                            {group.persen_slot}%<div className="text-[8px] font-normal text-gray-500">Slot Valid</div>
                                        </div>
                                    </div>

                                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-300 flex flex-wrap gap-1">
                                        {group.hourly_slots.map((slot: any) => (
                                            <div
                                                key={slot.jam_ke}
                                                className={clsx(
                                                    "w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold border",
                                                    slot.terpenuhi ? "bg-green-600 text-white border-green-700" :
                                                        (group.shift_timing_status === 'sudah_berlalu' || (group.shift_timing_status === 'sedang_berlangsung' && slot.jam_ke === 1))
                                                            ? "bg-red-500 text-white border-red-600" : "bg-gray-100 text-gray-400 border-gray-200"
                                                )}
                                            >
                                                {slot.jam_ke}
                                            </div>
                                        ))}
                                    </div>

                                    <table className="w-full text-xs text-left m-0">
                                        <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-300">
                                            <tr>
                                                <th className="px-3 py-1.5">Anggota</th>
                                                <th className="px-3 py-1.5 text-center">Status</th>
                                                <th className="px-3 py-1.5 text-right">Terakhir</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.members.map((member: any) => (
                                                <tr key={member.nik} className="border-b border-gray-200 last:border-0">
                                                    <td className="px-3 py-1.5 font-medium text-gray-900 leading-tight">
                                                        {member.nama_karyawan}
                                                        <div className="text-[9px] text-gray-500 font-mono mt-0.5">{member.nik}</div>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-center">
                                                        {member.sudah_patroli ? (
                                                            <span className="text-green-700 text-[10px] font-bold">
                                                                {member.jumlah_sesi_patroli} Sesi
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-600 text-[10px] font-bold">Belum</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right font-mono text-[10px]">
                                                        {member.jam_patrol_terakhir ? member.jam_patrol_terakhir.substring(0, 5) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <table className="w-full text-xs text-left align-middle border-collapse border border-gray-300">
                        <thead className="bg-gray-100 text-gray-900 border-b-2 border-gray-400">
                            <tr>
                                <th className="px-2 py-2 border border-gray-300 text-center w-[5%]">No</th>
                                <th className="px-2 py-2 border border-gray-300">Petugas</th>
                                <th className="px-2 py-2 border border-gray-300 w-[15%]">Tanggal</th>
                                <th className="px-2 py-2 border border-gray-300 w-[15%]">Jam & Shift</th>
                                <th className="px-2 py-2 border border-gray-300 text-center w-[15%]">Status</th>
                                <th className="px-2 py-2 border border-gray-300 text-center w-[15%]">Bukti</th>
                                {unit === 'UK3' && (
                                    <th className="px-2 py-2 border border-gray-300 text-center w-[25%]">Rute Patroli</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, key) => (
                                <tr key={item.id} className={key % 2 === 0 ? "bg-white border-b border-gray-300" : "bg-gray-50 border-b border-gray-300"}>
                                    <td className="px-2 py-2 border border-gray-300 text-center font-medium my-no-break">
                                        {key + 1}
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 my-no-break">
                                        <div className="font-bold text-gray-900">{item.nama_petugas || item.nik}</div>
                                        <div className="text-[10px] text-gray-500 font-mono tracking-tight">{item.nik}</div>
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 my-no-break">
                                        <span className="font-medium">
                                            {new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' })}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 my-no-break">
                                        <div className="font-bold font-mono tracking-tight text-gray-900">{item.jam_tugas || item.jam_patrol || '-'}</div>
                                        <div className="text-[10px] text-gray-500">{item.nama_jam_kerja || item.kode_jam_kerja || '-'}</div>
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 text-center my-no-break">
                                        <span className="font-bold text-[10px] uppercase">
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 text-center my-no-break">
                                        {item.foto_absen ? (
                                            <div className="flex justify-center">
                                                <img
                                                    src={getImageUrl(item.foto_absen) || undefined}
                                                    alt="Bukti Task"
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="h-10 w-10 object-cover rounded border border-gray-300"
                                                    onError={(e) => {
                                                        const target = e.currentTarget;
                                                        if (target.src.includes('_thumb.jpg') && item.foto_absen) {
                                                            const fallbackUrl = item.foto_absen.startsWith('http') ? item.foto_absen : `${process.env.NEXT_PUBLIC_API_URL}/storage/uploads/absensi/${item.foto_absen}`;
                                                            if (target.src !== fallbackUrl) {
                                                                target.src = fallbackUrl;
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-[10px]">-</span>
                                        )}
                                    </td>
                                    {unit === 'UK3' && (
                                        <td className="px-2 py-2 border border-gray-300">
                                            <div className="flex flex-wrap gap-1 items-start justify-start">
                                                {item.patrol_points && item.patrol_points.length > 0 ? item.patrol_points.map((pt: any, idx_pt: number) => (
                                                    pt.foto ? (
                                                        <div key={idx_pt} className="flex flex-col items-center justify-center p-0.5 border border-gray-200 rounded">
                                                            <img
                                                                src={getImageUrl(pt.foto) || undefined}
                                                                loading="lazy"
                                                                decoding="async"
                                                                className="h-8 w-8 rounded object-cover"
                                                                onError={(e) => {
                                                                    const target = e.currentTarget;
                                                                    if (target.src.includes('_thumb.jpg') && pt.foto) {
                                                                        const fallbackUrl = pt.foto.startsWith('http') ? pt.foto : `${process.env.NEXT_PUBLIC_API_URL}/storage/uploads/absensi/${pt.foto}`;
                                                                        if (target.src !== fallbackUrl) {
                                                                            target.src = fallbackUrl;
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <span className="text-[7px] text-gray-500 max-w-[32px] truncate mt-0.5 inline-block text-center">{pt.nama_titik}</span>
                                                        </div>
                                                    ) : (
                                                        <div key={idx_pt} className="flex flex-col items-center justify-center p-0.5 border border-gray-200 rounded opacity-50">
                                                            <div className="h-8 w-8 text-[8px] flex items-center justify-center text-gray-400 font-bold bg-gray-50 border border-dashed border-gray-300 rounded">?</div>
                                                            <span className="text-[7px] text-gray-400 max-w-[32px] truncate mt-0.5 inline-block text-center">{pt.nama_titik}</span>
                                                        </div>
                                                    )
                                                )) : <span className="text-[9px] text-gray-400 italic py-2 inline-block">Tidak ada rute patroli.</span>}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Footer Signatures */}
                <div className="flex mt-10 pt-6 justify-between text-sm break-inside-avoid px-2">
                    <div className="text-gray-600 font-medium text-xs">
                        <p>Dicetak pada: <span className="font-semibold text-gray-900">{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                        <p className="mt-1">Dicetak oleh: <span className="font-semibold text-gray-900">Admin System</span></p>
                    </div>
                    <div className="flex flex-row-reverse gap-20 text-center text-xs">
                        {vendorConfig?.signatories && vendorConfig.signatories.length > 0 ? (
                            vendorConfig.signatories.map((sig: any, idx: number) => (
                                <div key={idx} className="flex flex-col items-center">
                                    <p className="text-gray-600 mb-16 font-medium">
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
                                    <p className="text-gray-600 mb-16 font-medium">Mengetahui,</p>
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-gray-900 border-b border-gray-800 pb-1 mb-1 px-4">{vendorConfig?.penandatangan_nama || "Manager Operasional"}</span>
                                        <span className="font-semibold text-gray-600">{vendorConfig?.penandatangan_jabatan || "Manager Operasional"}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <p className="text-gray-600 mb-16 font-medium">Dibuat Oleh,</p>
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

                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            <button
                onClick={() => window.print()}
                className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg no-print z-50 flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Cetak Laporan
            </button>
        </div>
    );
}

export default function CetakLaporanMonitoring() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-8">Memuat Laporan...</div>}>
            <CetakLaporanMonitoringContent />
        </Suspense>
    );
}
