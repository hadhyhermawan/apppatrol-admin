'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Search, X, Save, Eye, Mail, ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';

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

export default function SecuritySuratPage() {
    const [activeTab, setActiveTab] = useState<'masuk' | 'keluar'>('masuk');
    const [data, setData] = useState<SuratItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State for Viewing Detail
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SuratItem | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = activeTab === 'masuk' ? '/security/surat-masuk?' : '/security/surat-keluar?';
            if (searchTerm) url += `search=${searchTerm}`;

            const response: any = await apiClient.get(url);
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]); // Refetch when tab changes

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleView = (item: SuratItem) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Data Surat" />

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

                <div className="mb-6">
                    <div className="relative max-w-md">
                        <input
                            type="text"
                            placeholder="Cari Nomor Surat, Perihal..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        />
                        <Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
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
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Petugas</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td></tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="font-medium text-black dark:text-white text-sm">{item.nomor_surat}</span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {new Date(item.tanggal_surat).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-black dark:text-white">
                                            {activeTab === 'masuk' ? item.asal_surat : item.tujuan_surat}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {item.perihal}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="flex flex-col">
                                                <span className="text-black dark:text-white font-medium">{item.nama_satpam || item.nik_satpam}</span>
                                                <span className="text-xs text-gray-500">{item.nik_satpam}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={() => handleView(item)}
                                                className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 text-brand-500 dark:hover:bg-meta-4"
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
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Penerima</label>
                                    <p className="font-medium text-black dark:text-white mt-1">
                                        {selectedItem.nama_penerima || '-'}
                                    </p>
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
                            </div>

                            {/* Images */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stroke dark:border-strokedark">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-2">Foto Surat</label>
                                    {selectedItem.foto ? (
                                        <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden border border-stroke">
                                            <img
                                                src={`http://localhost:8000/storage/${selectedItem.foto}`}
                                                alt="Foto Surat"
                                                className="w-full h-full object-cover"
                                                onError={(e) => (e.currentTarget.src = 'https://placehold.co/400?text=No+Image')}
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
                                        <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden border border-stroke">
                                            <img
                                                src={`http://localhost:8000/storage/${selectedItem.foto_penerima}`}
                                                alt="Foto Penerima"
                                                className="w-full h-full object-cover"
                                                onError={(e) => (e.currentTarget.src = 'https://placehold.co/400?text=No+Image')}
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
