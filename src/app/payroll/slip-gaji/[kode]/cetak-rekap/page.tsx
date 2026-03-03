'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';

type SlipRecapItem = {
    nik: string;
    nama_karyawan: string;
    jabatan: string;
    gaji_pokok: number;
    tunjangan: number;
    bpjs_kesehatan: number;
    bpjs_tenagakerja: number;
    pph21_bulanan: number;
    penambah: number;
    pengurang: number;
    gaji_bersih: number;
};

type SlipHeader = {
    kode_slip_gaji: string;
    bulan: number;
    tahun: number;
    status: number;
};

export default function CetakRekapGajiPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const kode = params.kode as string;
    const vendorIdParam = searchParams.get('vendor_id');

    const [data, setData] = useState<SlipRecapItem[]>([]);
    const [header, setHeader] = useState<SlipHeader | null>(null);
    const [loading, setLoading] = useState(true);
    const [vendorConfig, setVendorConfig] = useState<any>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const headerRes: any = await apiClient.get(`/payroll/slip-gaji/${kode}`);
            setHeader(headerRes);

            const recapParams = new URLSearchParams();
            if (vendorIdParam) recapParams.append('vendor_id', vendorIdParam);
            const recapRes: any = await apiClient.get(`/payroll/slip-gaji/${kode}/recap?${recapParams.toString()}`);
            if (Array.isArray(recapRes)) {
                setData(recapRes);

                if (recapRes.length > 0) {
                    const row = recapRes[0];
                    if (row.vendor_nama !== undefined) {
                        setVendorConfig({
                            nama: row.vendor_nama,
                            logo: row.vendor_logo,
                            penandatangan_nama: row.vendor_penandatangan_nama,
                            penandatangan_jabatan: row.vendor_penandatangan_jabatan,
                            signatories: row.vendor_signatories || []
                        });
                    }
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
        if (kode) fetchData();
    }, [kode, vendorIdParam]);

    useEffect(() => {
        if (!loading && data.length > 0 && header) {
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, data, header]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const getMonthName = (month: number) => {
        return new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' });
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Memuat Rekap Gaji...</div>;
    }

    if (data.length === 0 || !header) {
        return <div className="flex items-center justify-center h-screen">Data tidak ditemukan pada periode ini.</div>;
    }

    const totalGajiBersih = data.reduce((acc, curr) => acc + curr.gaji_bersih, 0);

    return (
        <div className="bg-gray-100 min-h-screen p-8 print:p-0 print:bg-white text-black font-sans w-full">
            <div className="w-full mx-auto bg-white shadow-lg p-8 print:shadow-none print:w-full print:p-0">
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
                                <p className="text-sm text-gray-600 tracking-wide font-medium">Rekapitulasi Gaji Karyawan</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-blue-800 uppercase tracking-widest bg-blue-50 px-4 py-1 rounded-full border border-blue-200 inline-block">Slip Recap</h2>
                            <p className="text-sm text-gray-600 mt-2 font-medium">Periode: {getMonthName(header.bulan)} {header.tahun}</p>
                            <p className="text-xs text-gray-500 font-mono mt-1">{header.kode_slip_gaji}</p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex items-center gap-6 mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1 tracking-tight">
                                Total Data: {data.length} Karyawan
                            </h3>
                            <p className="text-sm text-gray-500">Rekapitulasi bersih: <strong className="text-green-700">{formatCurrency(totalGajiBersih)}</strong></p>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full text-xs text-left align-middle border-collapse border border-gray-300">
                        <thead className="bg-gray-100 text-gray-900 border-b-2 border-gray-400">
                            <tr>
                                <th className="px-2 py-2 border border-gray-300 text-center w-[5%]">No</th>
                                <th className="px-2 py-2 border border-gray-300 w-[15%]">NIK</th>
                                <th className="px-2 py-2 border border-gray-300 w-[20%]">Nama Karyawan</th>
                                <th className="px-2 py-2 border border-gray-300 text-right w-[15%]">Gaji Pokok</th>
                                <th className="px-2 py-2 border border-gray-300 text-right w-[15%]">Tunjangan</th>
                                <th className="px-2 py-2 border border-gray-300 text-right w-[15%]">BPJS (-)</th>
                                <th className="px-2 py-2 border border-gray-300 text-right w-[15%]">PPh 21 (-)</th>
                                <th className="px-2 py-2 border border-gray-300 text-right w-[15%]">Penyesuaian (+/-)</th>
                                <th className="px-2 py-2 border border-gray-300 text-right w-[15%] font-bold">Gaji Bersih</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, key) => (
                                <tr key={item.nik} className={key % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                    <td className="px-2 py-2 border border-gray-300 text-center font-medium my-no-break">
                                        {key + 1}
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 my-no-break">
                                        <div className="font-mono text-xs">{item.nik}</div>
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 my-no-break">
                                        <div className="font-semibold text-gray-900">{item.nama_karyawan}</div>
                                        <div className="text-[10px] text-gray-500">{item.jabatan}</div>
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 text-right my-no-break">
                                        {formatCurrency(item.gaji_pokok)}
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 text-right my-no-break">
                                        {formatCurrency(item.tunjangan)}
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 text-right text-red-600 my-no-break">
                                        {formatCurrency(item.bpjs_kesehatan + item.bpjs_tenagakerja)}
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 text-right text-red-600 my-no-break">
                                        {formatCurrency(item.pph21_bulanan || 0)}
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 text-right my-no-break">
                                        {formatCurrency(item.penambah - item.pengurang)}
                                    </td>
                                    <td className="px-2 py-2 border border-gray-300 text-right text-green-700 font-bold bg-green-50/50 print:bg-transparent my-no-break">
                                        {formatCurrency(item.gaji_bersih)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                                <td colSpan={3} className="px-2 py-3 border border-gray-300 text-right">TOTAL</td>
                                <td className="px-2 py-3 border border-gray-300 text-right">{formatCurrency(data.reduce((a, b) => a + b.gaji_pokok, 0))}</td>
                                <td className="px-2 py-3 border border-gray-300 text-right">{formatCurrency(data.reduce((a, b) => a + b.tunjangan, 0))}</td>
                                <td className="px-2 py-3 border border-gray-300 text-right text-red-600">{formatCurrency(data.reduce((a, b) => a + (b.bpjs_kesehatan + b.bpjs_tenagakerja), 0))}</td>
                                <td className="px-2 py-3 border border-gray-300 text-right text-red-600">{formatCurrency(data.reduce((a, b) => a + (b.pph21_bulanan || 0), 0))}</td>
                                <td className="px-2 py-3 border border-gray-300 text-right">{formatCurrency(data.reduce((a, b) => a + (b.penambah - b.pengurang), 0))}</td>
                                <td className="px-2 py-3 border border-gray-300 text-right text-green-700">{formatCurrency(totalGajiBersih)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Footer / Signatures */}
                    <div className="flex mt-10 pt-6 justify-between text-sm break-inside-avoid px-2">
                        <div className="text-gray-600 font-medium">
                            <p>Dicetak pada: <span className="font-semibold text-gray-900">{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                            <p className="mt-1">Dicetak oleh: <span className="font-semibold text-gray-900">Admin System</span></p>
                        </div>
                        <div className="flex flex-row-reverse gap-20 text-center print:gap-14">
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
