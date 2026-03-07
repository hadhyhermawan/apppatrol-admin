'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Search, Calendar, MapPin, ArrowLeft, ArrowRight, RefreshCw, Eye, Printer, X } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import SearchableSelect from '@/components/form/SearchableSelect';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import clsx from 'clsx';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />
});

type BarangItem = {
    id_barang: number;
    jenis_barang: string;
    dari: string;
    untuk: string;
    penerima: string | null;
    image: string | null;
    foto_keluar?: string | null;
    petugas_penerima?: string | null;
    petugas_keluar?: string | null;
    created_at: string | null;
    updated_at: string | null;
};

type OptionItem = { value: string; label: string };

function LaporanBarangPage() {
    const { isSuperAdmin, vendorId } = usePermissions();
    const [data, setData] = useState<BarangItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCabang, setFilterCabang] = useState('');
    const [filterVendor, setFilterVendor] = useState('');

    const [cabangOptions, setCabangOptions] = useState<OptionItem[]>([]);
    const [vendorOptions, setVendorOptions] = useState<OptionItem[]>([]);

    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const resetTime = (d: Date) => {
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (d: Date) => {
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - (offset * 60 * 1000));
        return local.toISOString().split('T')[0];
    };

    const [dateStart, setDateStart] = useState(formatDate(firstDay));
    const [dateEnd, setDateEnd] = useState(formatDate(lastDay));

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return data.slice(start, start + perPage);
    }, [data, currentPage, perPage]);

    const totalPages = Math.ceil(data.length / perPage);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const cabParams = new URLSearchParams();
                if (isSuperAdmin && filterVendor) {
                    cabParams.append('vendor_id', filterVendor);
                }

                const cabangRes: any = await apiClient.get(`/master/cabang?${cabParams.toString()}`);

                if (Array.isArray(cabangRes)) {
                    setCabangOptions(cabangRes.map(c => ({ value: c.kode_cabang, label: c.nama_cabang })));
                } else if (cabangRes && Array.isArray((cabangRes as any).data)) {
                    setCabangOptions((cabangRes as any).data.map((c: any) => ({ value: c.kode_cabang, label: c.nama_cabang })));
                }

                if (isSuperAdmin && vendorOptions.length === 0) {
                    const vendorRes: any = await apiClient.get('/vendors');
                    const vData = Array.isArray(vendorRes) ? vendorRes : (vendorRes?.data || []);
                    setVendorOptions(vData.map((v: any) => ({ value: String(v.id), label: v.nama_vendor })));
                }
            } catch (error) {
                console.error("Failed to fetch options", error);
            }
        };
        fetchOptions();
    }, [filterVendor, isSuperAdmin]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/security/barang?limit=5000&';
            if (searchTerm) url += `search=${searchTerm}&`;
            if (dateStart) url += `date_start=${dateStart} 00:00:00&`;
            // Add 23:59:59 to inclusion end date
            if (dateEnd) url += `date_end=${dateEnd} 23:59:59&`;
            if (filterCabang) url += `kode_cabang=${filterCabang}&`;
            if (isSuperAdmin && filterVendor) url += `vendor_id=${filterVendor}&`;

            const response: any = await apiClient.get(url);
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch safety briefing data", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 800);
        return () => clearTimeout(timer);
    }, [searchTerm, dateStart, dateEnd, filterCabang, filterVendor]);

    const handlePrintClick = () => {
        setIsPrinting(true);
        // The iframe onload could trigger print or the iframe itself handles the print
        // but since we are just toggling the iframe, we can reset it after a delay
        setTimeout(() => setIsPrinting(false), 15000);
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Laporan Buku Barang" />

            {previewImage && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in print:hidden"
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="max-h-[90vh] max-w-full rounded-lg shadow-2xl object-contain"
                    />
                    <button
                        className="absolute top-5 right-5 text-white bg-black/50 rounded-full p-2 hover:bg-white/20 transition-colors"
                        onClick={() => setPreviewImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 mb-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                        Laporan Buku Barang
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            onClick={handlePrintClick}
                            disabled={isPrinting}
                            className={clsx(
                                "inline-flex items-center justify-center gap-2.5 rounded-lg px-4 py-2 text-center font-medium text-white transition shadow-sm",
                                isPrinting ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-opacity-90"
                            )}>
                            {isPrinting ? (
                                <span className="flex items-center gap-1">
                                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-1"></span>
                                    Menyiapkan...
                                </span>
                            ) : (
                                <><Printer className="h-4 w-4" /> <span className="hidden sm:inline">Cetak Laporan</span></>
                            )}
                        </button>
                        {isPrinting && (
                            <iframe
                                src={`/reports/barang/cetak?startDate=${dateStart}&endDate=${dateEnd}&cabang=${filterCabang}&vendorId=${filterVendor}&search=${searchTerm}`}
                                style={{ position: 'absolute', width: '0', height: '0', border: 'none' }}
                                title="Print Frame"
                            />
                        )}
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
                    {isSuperAdmin && (
                        <div>
                            <SearchableSelect
                                options={[{ value: '', label: 'Semua Vendor' }, ...vendorOptions]}
                                value={filterVendor}
                                onChange={(val) => {
                                    setFilterVendor(val);
                                    setCurrentPage(1);
                                }}
                                placeholder="Semua Vendor"
                            />
                        </div>
                    )}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari keterangan..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        />
                        <Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                        <SearchableSelect
                            options={[{ value: '', label: 'Semua Cabang' }, ...cabangOptions]}
                            value={filterCabang}
                            onChange={val => {
                                setFilterCabang(val);
                                setCurrentPage(1);
                            }}
                            placeholder="Pilih Cabang"
                        />
                    </div>
                    <div>
                        <DatePicker
                            id="date-start"
                            placeholder="Dari Tanggal"
                            defaultDate={dateStart}
                            dateFormat="Y-m-d"
                            onChange={(dates: Date[], dateStr: string) => setDateStart(dateStr)}
                        />
                    </div>
                    <div>
                        <DatePicker
                            id="date-end"
                            placeholder="Sampai Tanggal"
                            defaultDate={dateEnd}
                            dateFormat="Y-m-d"
                            onChange={(dates: Date[], dateStr: string) => setDateEnd(dateStr)}
                        />
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Waktu Log</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Informasi Barang</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Asal & Tujuan</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white text-center">Aktivitas Foto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.id_barang} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">
                                                {(currentPage - 1) * perPage + idx + 1}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] uppercase font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">LOG</span>
                                                    <span className="text-black dark:text-white text-sm font-medium">
                                                        {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="font-bold text-black dark:text-white text-sm">{item.jenis_barang}</div>
                                                {item.penerima && (
                                                    <div className="text-xs text-gray-500 mt-1">Status Diterima: {item.penerima}</div>
                                                )}
                                                {item.petugas_penerima && (
                                                    <div className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-100 border-dashed">Petugas Penerima: {item.petugas_penerima}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="flex flex-col gap-2">
                                                <div>
                                                    <span className="text-[10px] text-gray-400 uppercase block mb-0.5">Dari</span>
                                                    <div className="text-sm font-semibold text-gray-800">{item.dari || '-'}</div>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-gray-400 uppercase block mb-0.5">Untuk</span>
                                                    <div className="text-sm font-semibold text-gray-800">{item.untuk || '-'}</div>
                                                </div>
                                                {item.petugas_keluar && (
                                                    <div className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-100 border-dashed">Petugas Keluar: {item.petugas_keluar}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="flex flex-col items-center">
                                                    {item.image ? (
                                                        <div className="relative h-12 w-12 rounded-lg overflow-hidden border-2 border-white dark:border-boxdark shadow-sm bg-gray-200">
                                                            <Image
                                                                src={item.image}
                                                                alt="Masuk"
                                                                fill
                                                                className="object-cover cursor-pointer hover:opacity-80 transition"
                                                                unoptimized
                                                                onClick={() => setPreviewImage(item.image)}
                                                                onError={(e: any) => e.target.style.display = 'none'}
                                                            />
                                                        </div>
                                                    ) : <span className="text-[10px] text-gray-400 italic">No Photo IN</span>}
                                                    <span className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Masuk</span>
                                                </div>

                                                <div className="w-px h-10 bg-gray-200 dark:bg-strokedark mx-1 hidden sm:block"></div>

                                                <div className="flex flex-col items-center">
                                                    {item.foto_keluar ? (
                                                        <div className="relative h-12 w-12 rounded-lg overflow-hidden border-2 border-white dark:border-boxdark shadow-sm bg-gray-200">
                                                            <Image
                                                                src={item.foto_keluar}
                                                                alt="Keluar"
                                                                fill
                                                                className="object-cover cursor-pointer hover:opacity-80 transition"
                                                                unoptimized
                                                                onClick={() => setPreviewImage(item.foto_keluar || null)}
                                                                onError={(e: any) => e.target.style.display = 'none'}
                                                            />
                                                        </div>
                                                    ) : <span className="text-[10px] text-gray-400 italic">No Photo OUT</span>}
                                                    <span className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Keluar</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data.length > 0 && (
                    <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stroke pt-4 dark:border-strokedark">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Menampilkan <span className="font-medium text-black dark:text-white">{(currentPage - 1) * perPage + 1}</span> - <span className="font-medium text-black dark:text-white">{Math.min(currentPage * perPage, data.length)}</span> dari <span className="font-medium text-black dark:text-white">{data.length}</span> data
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

export default withPermission(LaporanBarangPage, { permissions: [] });
