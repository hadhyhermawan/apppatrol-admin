'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, ArrowLeft, Printer, FileText, Search } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

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

export default function DetailSlipGajiPage() {
    const params = useParams();
    const router = useRouter();
    const kode = params.kode as string;

    const [header, setHeader] = useState<SlipHeader | null>(null);
    const [data, setData] = useState<SlipRecapItem[]>([]);
    const [originalData, setOriginalData] = useState<SlipRecapItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHeader = async () => {
        try {
            const response: any = await apiClient.get(`/payroll/slip-gaji/${kode}`);
            setHeader(response);
        } catch (error) {
            console.error("Failed to fetch header", error);
            Swal.fire('Error', 'Data slip gaji tidak ditemukan', 'error').then(() => router.back());
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get(`/payroll/slip-gaji/${kode}/recap`);
            if (Array.isArray(response)) {
                setData(response);
                setOriginalData(response);
            } else {
                setData([]);
                setOriginalData([]);
            }
        } catch (error) {
            console.error("Failed to fetch recap", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (kode) {
            fetchHeader();
            fetchData();
        }
    }, [kode]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const getMonthName = (month: number) => {
        return new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' });
    };

    const handlePrint = () => {
        window.print();
    };

    if (!header) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Rekapitulasi Gaji" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 print:border-none print:shadow-none print:p-0">

                {/* Header Information */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Link href="/payroll/slip-gaji" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                <ArrowLeft className="w-5 h-5 text-gray-500" />
                            </Link>
                            <div>
                                <h2 className="text-xl font-bold text-black dark:text-white">
                                    Rekap Gaji Periode {getMonthName(header.bulan)} {header.tahun}
                                </h2>
                                <p className="text-sm text-gray-500 font-mono">{header.kode_slip_gaji}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <button className="absolute left-0 top-1/2 -translate-y-1/2 pl-3">
                                <Search className="h-4 w-4 text-gray-500" />
                            </button>
                            <input
                                type="text"
                                placeholder="Cari karyawan..."
                                className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 text-black outline-none focus:border-brand-500 focus-visible:shadow-none dark:border-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500"
                                onChange={(e) => {
                                    const term = e.target.value.toLowerCase();
                                    // Implement basic client-side filtering if needed or trigger fetch
                                    // For now just console log as placeholder for complex logic
                                    // In real app, better to filtre 'data' state directly
                                    if (term === '') setData(originalData);
                                    else setData(originalData.filter(item => item.nama_karyawan.toLowerCase().includes(term) || item.nik.includes(term)));
                                }}
                            />
                        </div>
                        <button onClick={fetchData} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button onClick={handlePrint} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-gray-600 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                            <Printer className="h-4 w-4" />
                            <span>Cetak Rekap</span>
                        </button>
                    </div>
                </div>

                <div className="hidden print:block mb-8 text-center">
                    <h1 className="text-2xl font-bold text-black">REKAPITULASI GAJI KARYAWAN</h1>
                    <p className="text-lg">Periode: {getMonthName(header.bulan)} {header.tahun}</p>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800 print:bg-gray-200 print:text-black">
                                <th className="px-3 py-3 font-medium text-black dark:text-white border border-gray-300">NIK</th>
                                <th className="px-3 py-3 font-medium text-black dark:text-white border border-gray-300">Nama</th>
                                <th className="px-3 py-3 font-medium text-black dark:text-white border border-gray-300 text-right">Gaji Pokok</th>
                                <th className="px-3 py-3 font-medium text-black dark:text-white border border-gray-300 text-right">Tunjangan</th>
                                <th className="px-3 py-3 font-medium text-black dark:text-white border border-gray-300 text-right">BPJS (-)</th>
                                <th className="px-3 py-3 font-medium text-black dark:text-white border border-gray-300 text-right">Penyesuaian (+/-)</th>
                                <th className="px-3 py-3 font-medium text-black dark:text-white border border-gray-300 text-right font-bold">Gaji Bersih</th>
                                <th className="px-3 py-3 font-medium text-black dark:text-white border border-gray-300 text-center print:hidden">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-500 border border-gray-300">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-500 border border-gray-300">Tidak ada karyawan ditemukan.</td></tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.nik}>
                                        <td className="px-3 py-2 text-black dark:text-white font-mono text-xs border border-gray-200 dark:border-gray-700">
                                            {item.nik}
                                        </td>
                                        <td className="px-3 py-2 text-black dark:text-white border border-gray-200 dark:border-gray-700">
                                            <div className="font-semibold">{item.nama_karyawan}</div>
                                            <div className="text-xs text-gray-500">{item.jabatan}</div>
                                        </td>
                                        <td className="px-3 py-2 text-right text-black dark:text-white border border-gray-200 dark:border-gray-700">
                                            {formatCurrency(item.gaji_pokok)}
                                        </td>
                                        <td className="px-3 py-2 text-right text-black dark:text-white border border-gray-200 dark:border-gray-700">
                                            {formatCurrency(item.tunjangan)}
                                        </td>
                                        <td className="px-3 py-2 text-right text-red-600 border border-gray-200 dark:border-gray-700">
                                            {formatCurrency(item.bpjs_kesehatan + item.bpjs_tenagakerja)}
                                        </td>
                                        <td className="px-3 py-2 text-right text-black dark:text-white border border-gray-200 dark:border-gray-700">
                                            {formatCurrency(item.penambah - item.pengurang)}
                                        </td>
                                        <td className="px-3 py-2 text-right font-bold text-green-700 dark:text-green-400 border border-gray-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/10">
                                            {formatCurrency(item.gaji_bersih)}
                                        </td>
                                        <td className="px-3 py-2 text-center border border-gray-200 dark:border-gray-700 print:hidden">
                                            <Link
                                                href={`/payroll/slip-gaji/${kode}/cetak/${item.nik}`}
                                                target="_blank"
                                                className="inline-flex items-center justify-center p-2 rounded-lg bg-brand-500 text-white hover:bg-opacity-90 transition"
                                                title="Cetak Slip"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {data.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 font-bold text-black dark:text-white print:bg-gray-100">
                                    <td colSpan={2} className="px-3 py-3 text-right border border-gray-200">Total:</td>
                                    <td className="px-3 py-3 text-right border border-gray-200">{formatCurrency(data.reduce((s, i) => s + i.gaji_pokok, 0))}</td>
                                    <td className="px-3 py-3 text-right border border-gray-200">{formatCurrency(data.reduce((s, i) => s + i.tunjangan, 0))}</td>
                                    <td className="px-3 py-3 text-right border border-gray-200 text-red-600">{formatCurrency(data.reduce((s, i) => s + i.bpjs_kesehatan + i.bpjs_tenagakerja, 0))}</td>
                                    <td className="px-3 py-3 text-right border border-gray-200">{formatCurrency(data.reduce((s, i) => s + i.penambah - i.pengurang, 0))}</td>
                                    <td className="px-3 py-3 text-right border border-gray-200 text-green-700">{formatCurrency(data.reduce((s, i) => s + i.gaji_bersih, 0))}</td>
                                    <td className="print:hidden border border-gray-200"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                <div className="mt-8 hidden print:block">
                    <div className="flex justify-end pr-10">
                        <div className="text-center">
                            <p className="mb-16">Mengetahui,</p>
                            <p className="font-bold underline">Manager HRD</p>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
