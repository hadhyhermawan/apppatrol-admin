'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Search, RefreshCw, Printer, FileText } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { withPermission } from '@/hoc/withPermission';
import SearchableSelect from '@/components/form/SearchableSelect';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type TunjanganColumn = {
    kode: string;
    nama: string;
};

type LaporanGajiItem = {
    nik: string;
    nama_karyawan: string;
    nama_dept: string;
    nama_cabang: string;
    nama_jabatan: string;
    gaji_pokok: number;
    bpjs_kesehatan: number;
    bpjs_tenagakerja: number;
    penambah: number;
    pengurang: number;
    gaji_bersih: number;
    tunjangan_detail: Record<string, number>;
};

type OptionItem = { value: string; label: string };

function LaporanGajiPage() {
    const [data, setData] = useState<LaporanGajiItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [tunjanganCols, setTunjanganCols] = useState<TunjanganColumn[]>([]);

    const now = new Date();
    const [filterBulan, setFilterBulan] = useState(now.getMonth() + 1);
    const [filterTahun, setFilterTahun] = useState(now.getFullYear());

    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterCabang, setFilterCabang] = useState('');

    const [deptOptions, setDeptOptions] = useState<OptionItem[]>([]);
    const [cabangOptions, setCabangOptions] = useState<OptionItem[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(10);

    const bulanOptions = [
        { value: 1, label: 'Januari' },
        { value: 2, label: 'Februari' },
        { value: 3, label: 'Maret' },
        { value: 4, label: 'April' },
        { value: 5, label: 'Mei' },
        { value: 6, label: 'Juni' },
        { value: 7, label: 'Juli' },
        { value: 8, label: 'Agustus' },
        { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' },
        { value: 11, label: 'November' },
        { value: 12, label: 'Desember' },
    ];

    const tahunOptions = Array.from({ length: 5 }, (_, i) => ({
        value: now.getFullYear() - i,
        label: (now.getFullYear() - i).toString()
    }));

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [deptRes, cabangRes] = await Promise.all([
                    apiClient.get('/master/departemen/options'),
                    apiClient.get('/master/cabang/options')
                ]);

                if (Array.isArray(deptRes)) {
                    setDeptOptions(deptRes.map((d: any) => ({ value: d.kode_dept, label: d.nama_dept })));
                }

                if (Array.isArray(cabangRes)) {
                    setCabangOptions(cabangRes.map((c: any) => ({ value: c.kode_cabang, label: c.nama_cabang })));
                }
            } catch (e) {
                console.error("Failed load options", e);
            }
        };
        fetchOptions();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `/laporan/gaji?bulan=${filterBulan}&tahun=${filterTahun}`;
            if (filterCabang) url += `&kode_cabang=${filterCabang}`;
            if (filterDept) url += `&kode_dept=${filterDept}`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

            const response: any = await apiClient.get(url);
            if (response.status) {
                setData(response.data);
                setTunjanganCols(response.jenis_tunjangan || []);
            } else {
                setData([]);
                setTunjanganCols([]);
            }
        } catch (error) {
            console.error("Failed to fetch laporan gaji", error);
            setData([]);
            setTunjanganCols([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1);
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [filterBulan, filterTahun, filterDept, filterCabang, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return data.slice(start, start + perPage);
    }, [data, currentPage, perPage]);

    const totalPages = Math.ceil(data.length / perPage);

    const formatRupiah = (angka: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka || 0);
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Laporan Gaji Karyawan" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-brand-500" />
                        Laporan Rekapitulasi Gaji
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="flex flex-col">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">Bulan</label>
                        <select
                            value={filterBulan}
                            onChange={(e) => setFilterBulan(Number(e.target.value))}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4"
                        >
                            {bulanOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">Tahun</label>
                        <select
                            value={filterTahun}
                            onChange={(e) => setFilterTahun(Number(e.target.value))}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4"
                        >
                            {tahunOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Pencarian
                        </label>
                        <div className="relative h-[42px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Nama / NIK..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="h-full w-full rounded-lg border-[1.5px] border-stroke bg-transparent pl-10 pr-4 text-sm outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">Cabang</label>
                        <SearchableSelect
                            options={[{ value: "", label: "Semua Cabang" }, ...cabangOptions]}
                            value={filterCabang}
                            onChange={(val) => setFilterCabang(val)}
                            placeholder="Semua Cabang"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">Departemen</label>
                        <SearchableSelect
                            options={[{ value: "", label: "Semua Departemen" }, ...deptOptions]}
                            value={filterDept}
                            onChange={(val) => setFilterDept(val)}
                            placeholder="Semua Departemen"
                        />
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto min-w-[1500px]">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center w-[50px] sticky left-0 bg-gray-100 dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700">No</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white w-[250px] sticky left-[50px] bg-gray-100 dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700">Karyawan</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white border-b border-gray-200 dark:border-gray-700">Gaji Pokok</th>

                                {tunjanganCols.map(col => (
                                    <th key={col.kode} className="px-4 py-4 font-medium text-black dark:text-white border-b border-gray-200 dark:border-gray-700">
                                        Tunjangan<br /><span className="text-xs text-gray-500">{col.nama}</span>
                                    </th>
                                ))}

                                <th className="px-4 py-4 font-medium text-green-600 dark:text-green-400 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">(+) Penambah</th>
                                <th className="px-4 py-4 font-medium text-red-600 dark:text-red-400 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">(-) Pengurang</th>
                                <th className="px-4 py-4 font-medium text-red-600 dark:text-red-400 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">(-) BPJS Kes</th>
                                <th className="px-4 py-4 font-medium text-red-600 dark:text-red-400 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">(-) BPJS TK</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white border-b border-gray-200 dark:border-gray-700 font-bold bg-gray-50 dark:bg-meta-4 text-right">Gaji Bersih</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={10 + tunjanganCols.length} className="px-4 py-8 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={10 + tunjanganCols.length} className="px-4 py-8 text-center text-gray-500">Tidak ada data gaji ditemukan</td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={idx} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/10">
                                        <td className="px-4 py-4 text-center sticky left-0 bg-white dark:bg-boxdark z-0 border-b border-gray-200 dark:border-gray-700">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4 sticky left-[50px] bg-white dark:bg-boxdark z-0 border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-black dark:text-white text-sm">{item.nama_karyawan}</span>
                                                <span className="text-[10px] text-brand-500 font-medium">{item.nik}</span>
                                                <span className="text-[10px] text-gray-500">{item.nama_jabatan}</span>
                                                <span className="text-[10px] text-gray-400">{item.nama_dept} - {item.nama_cabang}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 font-medium">
                                            {formatRupiah(item.gaji_pokok)}
                                        </td>

                                        {tunjanganCols.map(col => (
                                            <td key={col.kode} className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                                                {formatRupiah(item.tunjangan_detail?.[col.kode] || 0)}
                                            </td>
                                        ))}

                                        <td className="px-4 py-4 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10 border-b border-gray-100 dark:border-gray-800">
                                            {formatRupiah(item.penambah)}
                                        </td>
                                        <td className="px-4 py-4 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10 border-b border-gray-100 dark:border-gray-800">
                                            {formatRupiah(item.pengurang)}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-red-600 dark:text-red-400 border-b border-gray-100 dark:border-gray-800">
                                            {formatRupiah(item.bpjs_kesehatan)}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-red-600 dark:text-red-400 border-b border-gray-100 dark:border-gray-800">
                                            {formatRupiah(item.bpjs_tenagakerja)}
                                        </td>
                                        <td className="px-4 py-4 font-bold text-black dark:text-white bg-gray-50 dark:bg-meta-4 text-right border-b border-gray-200 dark:border-gray-700">
                                            {formatRupiah(item.gaji_bersih)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {data.length > 0 && (
                    <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stroke pt-4 dark:border-strokedark">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, data.length)} dari {data.length} data
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

export default withPermission(LaporanGajiPage, {
    permissions: ['laporan.presensi'] // Using the same generalized permission as requested
});
