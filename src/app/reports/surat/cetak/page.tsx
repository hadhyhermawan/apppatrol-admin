'use client';

import { useState, useEffect, Suspense } from 'react';
import apiClient from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';

type SuratItem = {
    id: number;
    nomor_surat: string;
    tanggal_surat: string | null;
    asal_surat?: string | null;
    tujuan_surat: string | null;
    perihal: string | null;
    foto: string | null;
    foto_penerima?: string | null;
    nama_satpam?: string | null;
    nama_satpam_pengantar?: string | null;
    nama_penerima?: string | null;
    no_penerima?: string | null;
    status_surat?: string | null;
    status_penerimaan?: string | null;
    tanggal_diterima?: string | null;
};

function CetakLaporanSuratContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];
    const filterVendor = searchParams.get('vendorId') || '';
    const filterCabang = searchParams.get('cabang') || '';
    const searchTerm = searchParams.get('search') || '';

    const tipeSurat = searchParams.get('tipe') || 'masuk';

    const [data, setData] = useState<SuratItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [vendorConfig, setVendorConfig] = useState<{ nama_vendor?: string | null, logo?: string | null, penandatangan_nama?: string | null, penandatangan_jabatan?: string | null, signatories?: { nama: string, jabatan: string }[] }>({});

    const getImageUrl = (filename: string | null) => {
        if (!filename) return null;
        if (filename.startsWith('http')) return filename;
        return `${process.env.NEXT_PUBLIC_API_URL}/storage/uploads/briefing/${filename}`; // Actually the get URL from python is absolute, so it will start with http
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = tipeSurat === 'masuk' ? '/security/surat-masuk?limit=5000&' : '/security/surat-keluar?limit=5000&';
            if (searchTerm) url += `search=${searchTerm}&`;
            if (startDate) url += `date_start=${startDate} 00:00:00&`;
            if (endDate) url += `date_end=${endDate} 23:59:59&`;
            if (filterCabang) url += `kode_cabang=${filterCabang}&`;
            if (filterVendor) url += `vendor_id=${filterVendor}&`;

            const response: any = await apiClient.get(url);
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }

            // Fetch vendor config if there is a vendor filter
            if (filterVendor) {
                const vendorRes: any = await apiClient.get(`/vendors/${filterVendor}/profile`);
                if (vendorRes && vendorRes.id) {
                    setVendorConfig(vendorRes);
                }
            } else {
                // If no specific vendor, maybe we can fetch the user's vendor from /auth/me or it stays default
                const authRes: any = await apiClient.get('/auth/me');
                if (authRes.vendor_id) {
                    const vRes: any = await apiClient.get(`/vendors/${authRes.vendor_id}/profile`);
                    if (vRes && vRes.id) {
                        setVendorConfig(vRes);
                    }
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
    }, [startDate, endDate, filterVendor, filterCabang, searchTerm]);

    useEffect(() => {
        if (!loading && data.length > 0) {
            const timer = setTimeout(() => {
                window.print();
            }, 2500); // Give images time to load
            return () => clearTimeout(timer);
        }
    }, [loading, data]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen font-sans text-gray-600">Memuat Laporan...</div>;
    }

    if (data.length === 0) {
        return <div className="flex items-center justify-center h-screen font-sans text-gray-600">Data tidak ditemukan pada periode ini.</div>;
    }

    return (
        <div className="bg-gray-100 min-h-screen p-8 print:p-0 print:bg-white text-black font-sans">
            <div className="max-w-5xl mx-auto bg-white shadow-lg p-8 print:shadow-none print:w-full print:max-w-full print:p-4">
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
                        className="bg-brand-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90 transition"
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
                                    {vendorConfig?.nama_vendor || "PLATARAN INDONESIA"}
                                </h1>
                                <p className="text-sm text-gray-600 tracking-wide font-medium">Laporan Aktivitas Security</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-blue-800 uppercase tracking-widest bg-blue-50 px-4 py-1 rounded-full border border-blue-200 inline-block">Surat Keluar Masuk</h2>
                            <p className="text-sm text-gray-600 mt-2 font-medium">Periode: {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Riwayat Surat {tipeSurat === 'masuk' ? 'Masuk' : 'Keluar'} </h3>
                        <p className="text-sm text-gray-500">Menampilkan {data.length} rekaman data.</p>
                    </div>

                    {/* Table */}
                    <table className="w-full text-xs text-left align-middle border-collapse border border-gray-300">
                        <thead className="bg-gray-100 text-gray-900 border-b-2 border-gray-400">
                            <tr>
                                <th className="px-3 py-2 border border-gray-300 text-center w-[5%] font-semibold">No</th>
                                <th className="px-3 py-2 border border-gray-300 w-[15%] font-semibold">Waktu & Info Surat</th>
                                <th className="px-3 py-2 border border-gray-300 w-[20%] font-semibold">Masuk / Keluar</th>
                                <th className="px-3 py-2 border border-gray-300 w-[30%] font-semibold">Penerima & Petugas</th>
                                <th className="px-3 py-2 border border-gray-300 text-center w-[15%] font-semibold">Bukti Foto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, key) => (
                                <tr key={item.id} className={key % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                    <td className="px-3 py-3 border border-gray-300 text-center font-medium my-no-break">
                                        {key + 1}
                                    </td>
                                    <td className="px-3 py-3 border border-gray-300 my-no-break align-top">
                                        <div className="flex flex-col gap-1">
                                            <div>
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${tipeSurat === 'masuk' ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-orange-700 bg-orange-50 border-orange-200'}`}>
                                                    {tipeSurat === 'masuk' ? 'MASUK' : 'KELUAR'}
                                                </span>
                                                <div className="font-semibold text-gray-900 mt-0.5 whitespace-nowrap">
                                                    {item.tanggal_surat ? new Date(item.tanggal_surat).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                                </div>
                                                <div className="text-[10px] text-gray-600 font-mono tracking-tighter whitespace-nowrap">
                                                    {item.tanggal_surat ? new Date(item.tanggal_surat).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </div>
                                            </div>
                                            <div className="text-xs font-semibold text-gray-800 mt-2 uppercase">{item.nomor_surat || '-'}</div>
                                            <p className="text-xs text-gray-600 font-medium whitespace-pre-wrap mt-1">{item.perihal || '-'}</p>
                                        </div>
                                    </td>

                                    <td className="px-3 py-3 border border-gray-300 my-no-break align-top">
                                        <div className="flex flex-col gap-3">
                                            {tipeSurat === 'masuk' && (
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 border-b border-gray-200 max-w-fit">Asal Surat</div>
                                                    <div className="font-semibold text-gray-900 leading-tight">{item.asal_surat || '-'}</div>
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5 border-b border-gray-200 max-w-fit">Tujuan Surat</div>
                                                <div className="font-semibold text-gray-900 leading-tight">{item.tujuan_surat || '-'}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-3 py-3 border border-gray-300 my-no-break align-top">
                                        <div className="flex flex-col gap-1 text-xs">
                                            {item.nama_penerima && (
                                                <div className="font-bold text-gray-800">Penerima: {item.nama_penerima}</div>
                                            )}
                                            {item.no_penerima && (
                                                <div className="text-gray-500">HP: {item.no_penerima}</div>
                                            )}
                                            {item.tanggal_diterima && (
                                                <div className="text-[10px] text-gray-500">Diterima: {new Date(item.tanggal_diterima).toLocaleString("id-ID")}</div>
                                            )}

                                            <div className="mt-2 pt-2 border-t border-gray-200 border-dashed">
                                                {item.nama_satpam && (
                                                    <div className="text-[10px] text-gray-600">Petugas Jaga: <span className="font-medium text-gray-800">{item.nama_satpam}</span></div>
                                                )}
                                                {item.nama_satpam_pengantar && (
                                                    <div className="text-[10px] text-gray-600">Pengantar: <span className="font-medium text-gray-800">{item.nama_satpam_pengantar}</span></div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 border border-gray-300 text-center my-no-break align-top">
                                        <div className="flex flex-col gap-2 items-center">
                                            {item.foto ? (
                                                <div className="flex flex-col items-center">
                                                    <img
                                                        src={item.foto}
                                                        alt="Bukti Surat"
                                                        className="w-16 h-16 object-cover bg-gray-100 border border-gray-200 rounded p-1 shadow-sm"
                                                        onError={(e: any) => e.target.style.display = 'none'}
                                                    />
                                                    <span className="text-[9px] text-gray-500 mt-1">Surat</span>
                                                </div>
                                            ) : <span className="text-gray-300 italic text-[10px]">No File</span>}

                                            {item.foto_penerima ? (
                                                <div className="flex flex-col items-center pt-2 border-t border-gray-100 w-full">
                                                    <img
                                                        src={item.foto_penerima}
                                                        alt="Bukti Penerima"
                                                        className="w-16 h-16 object-cover bg-gray-100 border border-gray-200 rounded p-1 shadow-sm"
                                                        onError={(e: any) => e.target.style.display = 'none'}
                                                    />
                                                    <span className="text-[9px] text-gray-500 mt-1">Penerima</span>
                                                </div>
                                            ) : <span className="text-gray-300 italic text-[10px] pt-2 border-t border-gray-100 w-full">No File</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Footer / Signatures */}
                    <div className="flex mt-12 pt-6 justify-between text-sm break-inside-avoid px-2">
                        <div className="text-gray-600 font-medium">
                            <p>Dicetak pada: <span className="font-semibold text-gray-900">{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                            <p className="mt-1">Dicetak oleh: <span className="font-semibold text-gray-900">Admin System</span></p>
                        </div>
                        <div className="flex flex-row-reverse gap-20 text-center">
                            {vendorConfig?.signatories && vendorConfig.signatories.length > 0 ? (
                                vendorConfig.signatories.map((sig: any, idx: number) => (
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

export default function CetakLaporanSurat() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen font-sans text-gray-600">Memuat Laporan...</div>}>
            <CetakLaporanSuratContent />
        </Suspense>
    );
}
