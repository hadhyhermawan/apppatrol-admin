'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Search, X, Eye, FileText, ArrowUpRight, ArrowDownLeft, Calendar, ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Image from 'next/image';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import dynamic from 'next/dynamic';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />
});

type SuratItem = {
    id: number;
    nomor_surat: string;
    tanggal_surat: string;
    asal_surat?: string;
    tujuan_surat: string;
    perihal: string;
    nik_satpam: string;
    nama_satpam?: string;
    foto?: string;
    foto_penerima?: string;
    nama_penerima?: string;
    status_surat?: string;
    status_penerimaan?: string;
    tanggal_diterima?: string;
};

function SecuritySuratPage() {
    // const { canCreate, canUpdate, canDelete } = usePermissions();
    const [activeTab, setActiveTab] = useState<'masuk' | 'keluar'>('masuk');
    const [data, setData] = useState<SuratItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SuratItem | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = activeTab === 'masuk' ? '/security/surat-masuk?' : '/security/surat-keluar?';
            if (searchTerm) url += `search=${searchTerm}&`;
            if (dateStart) url += `date_start=${dateStart}&`;
            if (dateEnd) url += `date_end=${dateEnd}&`;

            const response: any = await apiClient.get(url);
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
        fetchData();
    }, [activeTab]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 800);
        return () => clearTimeout(timer);
    }, [searchTerm, dateStart, dateEnd]);

    // Pagination Logic
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return data.slice(start, start + perPage);
    }, [data, currentPage, perPage]);

    const totalPages = Math.ceil(data.length / perPage);

    const handleView = (item: SuratItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Data Surat" />

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
                    <button
                        className="absolute top-5 right-5 text-white bg-black/50 rounded-full p-2 hover:bg-white/20 transition-colors"
                        onClick={() => setPreviewImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                        Monitoring Surat
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* TABS */}
                <div className="mb-6 border-b border-stroke dark:border-strokedark">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('masuk')}
                            className={`pb-4 text-sm font-medium hover:text-brand-500 border-b-2 transition-colors ${activeTab === 'masuk'
                                ? 'border-brand-500 text-brand-500'
                                : 'border-transparent text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <ArrowDownLeft className="w-4 h-4" />
                                Surat Masuk
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('keluar')}
                            className={`pb-4 text-sm font-medium hover:text-brand-500 border-b-2 transition-colors ${activeTab === 'keluar'
                                ? 'border-brand-500 text-brand-500'
                                : 'border-transparent text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4" />
                                Surat Keluar
                            </div>
                        </button>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="relative col-span-2">
                        <input
                            type="text"
                            placeholder="Cari Nomor Surat, Perihal..."
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
                        <DatePicker
                            id="date-start"
                            placeholder="Dari Tanggal"
                            defaultDate={dateStart}
                            enableTime={false}
                            dateFormat="Y-m-d"
                            onChange={(dates: Date[], dateStr: string) => setDateStart(dateStr)}
                        />
                    </div>
                    <div>
                        <DatePicker
                            id="date-end"
                            placeholder="Sampai Tanggal"
                            defaultDate={dateEnd}
                            enableTime={false}
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
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Nomor Surat</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Tanggal</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">
                                    {activeTab === 'masuk' ? 'Asal / Pengirim' : 'Tujuan / Penerima'}
                                </th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Perihal</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Foto</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex bg-blue-100 h-10 w-10 min-w-10 items-center justify-center rounded-full text-blue-600">
                                                    <Mail size={20} />
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-black dark:text-white text-sm">{item.nomor_surat}</h5>
                                                    <p className="text-xs text-brand-500">{item.status_surat}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-black dark:text-white font-medium">
                                                    {new Date(item.tanggal_surat).toLocaleDateString('id-ID')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-black dark:text-white">
                                            {activeTab === 'masuk' ? item.asal_surat : item.tujuan_surat}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {item.perihal}
                                        </td>
                                        <td className="px-4 py-4 text-center text-sm">
                                            <div className="flex items-center justify-center -space-x-2">
                                                {item.foto && (
                                                    <div className="relative h-10 w-10 rounded-full border-2 border-white dark:border-boxdark overflow-hidden bg-gray-200" title="Foto Surat">
                                                        <Image
                                                            src={item.foto}
                                                            alt="Foto Surat"
                                                            width={40}
                                                            height={40}
                                                            className="h-full w-full object-cover cursor-pointer hover:opacity-80 transition"
                                                            unoptimized
                                                            onClick={() => setPreviewImage(item.foto || null)}
                                                            onError={(e: any) => e.target.style.display = 'none'}
                                                        />
                                                    </div>
                                                )}
                                                {!item.foto && (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={() => handleView(item)}
                                                className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 text-brand-500 dark:hover:bg-meta-4 transition"
                                                title="Lihat Detail"
                                            >
                                                <Eye className="h-5 w-5" />
                                            </button>
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

            {/* MODAL Detail */}
            {isModalOpen && selectedItem && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-white dark:bg-boxdark sticky top-0 z-10">
                            <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Detail Surat {activeTab === 'masuk' ? 'Masuk' : 'Keluar'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Nomor Surat</label>
                                    <p className="font-medium text-black dark:text-white mt-1">{selectedItem.nomor_surat}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tanggal</label>
                                    <p className="font-medium text-black dark:text-white mt-1">
                                        {new Date(selectedItem.tanggal_surat).toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                    {activeTab === 'masuk' ? 'Asal Surat' : 'Tujuan Surat'}
                                </label>
                                <p className="font-medium text-black dark:text-white mt-1 text-lg">
                                    {activeTab === 'masuk' ? selectedItem.asal_surat : selectedItem.tujuan_surat}
                                </p>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Perihal</label>
                                <div className="p-3 bg-gray-50 dark:bg-meta-4 rounded-lg mt-1 border border-stroke dark:border-strokedark">
                                    <p className="text-black dark:text-white">{selectedItem.perihal}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Petugas</label>
                                    <p className="font-medium text-black dark:text-white mt-1">
                                        {selectedItem.nama_satpam || selectedItem.nik_satpam}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Penerima</label>
                                    <p className="font-medium text-black dark:text-white mt-1">
                                        {selectedItem.nama_penerima || '-'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Status</label>
                                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${(selectedItem.status_penerimaan === 'DITERIMA' || selectedItem.status_surat === 'SELESAI')
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {selectedItem.status_penerimaan || selectedItem.status_surat}
                                </span>
                            </div>

                            {/* Images */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stroke dark:border-strokedark">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-2">Foto Surat</label>
                                    {selectedItem.foto ? (
                                        <div
                                            className="aspect-square rounded-lg bg-gray-100 overflow-hidden border border-stroke cursor-pointer hover:opacity-90 transition"
                                            onClick={() => setPreviewImage(selectedItem.foto || null)}
                                        >
                                            <Image
                                                src={selectedItem.foto}
                                                alt="Foto Surat"
                                                width={400}
                                                height={400}
                                                className="w-full h-full object-cover"
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                            No Image
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-2">Foto Penerima</label>
                                    {selectedItem.foto_penerima ? (
                                        <div
                                            className="aspect-square rounded-lg bg-gray-100 overflow-hidden border border-stroke cursor-pointer hover:opacity-90 transition"
                                            onClick={() => setPreviewImage(selectedItem.foto_penerima || null)}
                                        >
                                            <Image
                                                src={selectedItem.foto_penerima}
                                                alt="Foto Penerima"
                                                width={400}
                                                height={400}
                                                className="w-full h-full object-cover"
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                            No Image
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 dark:bg-meta-4/30 border-t border-stroke dark:border-strokedark flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-black bg-white border border-stroke rounded-lg hover:bg-gray-50"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

export default withPermission(SecuritySuratPage, {
    permissions: ['surat.index']
});
