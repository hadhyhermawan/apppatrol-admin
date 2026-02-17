'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';

type SlipRecapItem = {
    nik: string;
    nama_karyawan: string;
    jabatan: string;
    gaji_pokok: number;
    tunjangan: number;
    bpjs_kesehatan: number;
    bpjs_tenagakerja: number;
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

export default function CetakSlipGajiPage() {
    const params = useParams();
    const router = useRouter();
    const kode = params.kode as string;
    const nik = params.nik as string;

    const [header, setHeader] = useState<SlipHeader | null>(null);
    const [data, setData] = useState<SlipRecapItem | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const headerRes: any = await apiClient.get(`/payroll/slip-gaji/${kode}`);
            setHeader(headerRes);

            const recapRes: any = await apiClient.get(`/payroll/slip-gaji/${kode}/recap?nik=${nik}`);
            if (Array.isArray(recapRes) && recapRes.length > 0) {
                setData(recapRes[0]);
            } else {
                setData(null);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (kode && nik) {
            fetchData();
        }
    }, [kode, nik]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Memuat Slip Gaji...</div>;
    }

    if (!data || !header) {
        return <div className="flex items-center justify-center h-screen">Data tidak ditemukan.</div>;
    }

    const totalPenerimaan = data.gaji_pokok + data.tunjangan + data.penambah;
    const totalPotongan = data.bpjs_kesehatan + data.bpjs_tenagakerja + data.pengurang;

    return (
        <div className="bg-gray-100 min-h-screen p-8 print:p-0 print:bg-white text-black">
            <div className="max-w-3xl mx-auto bg-white shadow-lg p-8 print:shadow-none print:w-full">

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
                        <Printer className="w-4 h-4" /> Cetak Slip
                    </button>
                </div>

                {/* Slip Header */}
                <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                    <h1 className="text-2xl font-bold uppercase tracking-wider">PT. K3GUARD</h1>
                    <p className="text-sm">Jalan Contoh No. 123, Jakarta Selatan</p>
                    <h2 className="text-xl font-bold mt-4 underline">SLIP GAJI KARYAWAN</h2>
                    <p className="text-sm mt-1">Periode: {new Date(0, header.bulan - 1).toLocaleString('id-ID', { month: 'long' })} {header.tahun}</p>
                </div>

                {/* Employee Info */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                        <table>
                            <tbody>
                                <tr>
                                    <td className="pr-4 py-1">NIK</td>
                                    <td className="font-semibold">: {data.nik}</td>
                                </tr>
                                <tr>
                                    <td className="pr-4 py-1">Nama</td>
                                    <td className="font-semibold">: {data.nama_karyawan}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <table>
                            <tbody>
                                <tr>
                                    <td className="pr-4 py-1">Jabatan</td>
                                    <td className="font-semibold">: {data.jabatan}</td>
                                </tr>
                                <tr>
                                    <td className="pr-4 py-1">Status</td>
                                    <td className="font-semibold">: Karyawan Tetap</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Salary Details */}
                <div className="grid grid-cols-2 gap-8 mb-6">
                    {/* Penerimaan */}
                    <div>
                        <h3 className="font-bold border-b border-gray-400 mb-2 pb-1">PENERIMAAN</h3>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="py-1">Gaji Pokok</td>
                                    <td className="text-right">{formatCurrency(data.gaji_pokok)}</td>
                                </tr>
                                <tr>
                                    <td className="py-1">Tunjangan</td>
                                    <td className="text-right">{formatCurrency(data.tunjangan)}</td>
                                </tr>
                                {data.penambah > 0 && (
                                    <tr>
                                        <td className="py-1">Penyesuaian (+)</td>
                                        <td className="text-right">{formatCurrency(data.penambah)}</td>
                                    </tr>
                                )}
                                <tr className="font-bold border-t border-gray-300">
                                    <td className="py-2">Total Penerimaan</td>
                                    <td className="text-right py-2">{formatCurrency(totalPenerimaan)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Potongan */}
                    <div>
                        <h3 className="font-bold border-b border-gray-400 mb-2 pb-1">POTONGAN</h3>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="py-1">BPJS Kesehatan</td>
                                    <td className="text-right">{formatCurrency(data.bpjs_kesehatan)}</td>
                                </tr>
                                <tr>
                                    <td className="py-1">BPJS Ketenagakerjaan</td>
                                    <td className="text-right">{formatCurrency(data.bpjs_tenagakerja)}</td>
                                </tr>
                                {data.pengurang > 0 && (
                                    <tr>
                                        <td className="py-1">Penyesuaian (-)</td>
                                        <td className="text-right">{formatCurrency(data.pengurang)}</td>
                                    </tr>
                                )}
                                <tr className="font-bold border-t border-gray-300">
                                    <td className="py-2">Total Potongan</td>
                                    <td className="text-right py-2">{formatCurrency(totalPotongan)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Net Salary */}
                <div className="border bg-gray-50 border-gray-300 p-4 mb-8">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">GAJI BERSIH (TAKE HOME PAY)</span>
                        <span className="text-2xl font-bold">{formatCurrency(data.gaji_bersih)}</span>
                    </div>
                    <p className="text-xs italic mt-2 text-gray-500">* Gaji bersih merupakan total penerimaan dikurangi total potongan.</p>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 mt-12 text-center text-sm break-inside-avoid">
                    <div>
                        <p className="mb-16">Penerima,</p>
                        <p className="font-bold underline">{data.nama_karyawan}</p>
                    </div>
                    <div>
                        <p className="mb-16">Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />Keuangan / HRD,</p>
                        <p className="font-bold underline">Admin K3Guard</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
