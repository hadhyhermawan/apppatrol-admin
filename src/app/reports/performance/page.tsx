'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Search, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { withPermission } from '@/hoc/withPermission';
import dynamic from 'next/dynamic';
import SearchableSelect from '@/components/form/SearchableSelect';
import clsx from 'clsx';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />
});

type PerformanceReportItem = {
    nik: string;
    nama_karyawan: string;
    nama_dept: string;
    nama_cabang: string;
    hadir: number;
    tugas_patroli: number;
    safety_briefing: number;
    tamu: number;
    barang: number;
    turlalin: number;
    surat: number;
    pelanggaran: number;
};

type OptionItem = { value: string; label: string };

function LaporanPerformancePage() {
    const [data, setData] = useState<PerformanceReportItem[]>([]);
    const [loading, setLoading] = useState(false);

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(formatDate(firstDay));
    const [endDate, setEndDate] = useState(formatDate(lastDay));
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterCabang, setFilterCabang] = useState('');

    const [deptOptions, setDeptOptions] = useState<OptionItem[]>([]);
    const [cabangOptions, setCabangOptions] = useState<OptionItem[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(20);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return data.slice(start, start + perPage);
    }, [data, currentPage, perPage]);

    const totalPages = Math.ceil(data.length / perPage);

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
            let url = `/laporan/performance?start_date=${startDate}&end_date=${endDate}`;
            if (filterCabang) url += `&kode_cabang=${filterCabang}`;
            if (filterDept) url += `&kode_dept=${filterDept}`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

            const response: any = await apiClient.get(url);
            if (response.status) {
                setData(response.data);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch laporan", error);
            setData([]);
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
    }, [filterDept, filterCabang, searchTerm, startDate, endDate]);

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Laporan Performance" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                        Laporan Performance Karyawan
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    <div className="flex flex-col">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Pencarian
                        </label>
                        <div className="relative h-[42px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Cari Nama / NIK..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="h-full w-full rounded-lg border-[1.5px] border-stroke bg-transparent pl-10 pr-4 text-sm outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Cabang
                        </label>
                        <SearchableSelect
                            options={[{ value: "", label: "Semua Cabang" }, ...cabangOptions]}
                            value={filterCabang}
                            onChange={(val) => setFilterCabang(val)}
                            placeholder="Semua Cabang"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Departemen
                        </label>
                        <SearchableSelect
                            options={[{ value: "", label: "Semua Departemen" }, ...deptOptions]}
                            value={filterDept}
                            onChange={(val) => setFilterDept(val)}
                            placeholder="Semua Departemen"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Dari Tanggal
                        </label>
                        <div>
                            <DatePicker
                                id="date-start"
                                placeholder="Dari Tanggal"
                                defaultDate={startDate}
                                onChange={(dates: Date[], dateStr: string) => setStartDate(dateStr)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                            Sampai Tanggal
                        </label>
                        <div>
                            <DatePicker
                                id="date-end"
                                placeholder="Sampai Tanggal"
                                defaultDate={endDate}
                                onChange={(dates: Date[], dateStr: string) => setEndDate(dateStr)}
                            />
                        </div>
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto min-w-[1200px]">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center w-[50px]">No</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Karyawan</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Hadir</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Tugas Patroli</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Safety Briefing</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Buku Tamu</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Log Barang</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Turlalin</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Surat</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center text-red-500">Pelanggaran</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={idx} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/10">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-black dark:text-white text-sm">{item.nama_karyawan}</span>
                                                <span className="text-xs text-brand-500">{item.nik}</span>
                                                <span className="text-xs text-gray-500">{item.nama_dept} - {item.nama_cabang}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-400">
                                                {item.hadir}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center font-medium text-black dark:text-white">{item.tugas_patroli}</td>
                                        <td className="px-4 py-4 text-center font-medium text-black dark:text-white">{item.safety_briefing}</td>
                                        <td className="px-4 py-4 text-center font-medium text-black dark:text-white">{item.tamu}</td>
                                        <td className="px-4 py-4 text-center font-medium text-black dark:text-white">{item.barang}</td>
                                        <td className="px-4 py-4 text-center font-medium text-black dark:text-white">{item.turlalin}</td>
                                        <td className="px-4 py-4 text-center font-medium text-black dark:text-white">{item.surat}</td>
                                        <td className="px-4 py-4 text-center font-medium text-red-500">{item.pelanggaran}</td>
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

export default withPermission(LaporanPerformancePage, { permissions: ['laporan.index'] });
