'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Search, Calendar, MapPin, ArrowLeft, ArrowRight, RefreshCw, User, MoreHorizontal, Filter, Eye, Edit, Trash, X } from 'lucide-react';
import Swal from 'sweetalert2';
import clsx from 'clsx';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Image from 'next/image';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import dynamic from 'next/dynamic';
import SearchableSelect from '@/components/form/SearchableSelect';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />
});

type PresensiItem = {
    id: number;
    nik: string;
    nama_karyawan: string;
    nama_dept: string;
    nama_jam_kerja: string;
    jam_in: string;
    jam_out: string;
    foto_in: string | null;
    foto_out: string | null;
    lokasi_in: string | null;
    lokasi_out: string | null;
    status_kehadiran: string;
};

type OptionItem = { code: string; name: string };
type MasterOptions = {
    departemen: OptionItem[];
    // Other options if needed
};

function PresensiPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<PresensiItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [dateFilter, setDateFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [options, setOptions] = useState<MasterOptions>({ departemen: [] });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [totalItems, setTotalItems] = useState(0);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Fetch Options (Departments)
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res: any = await apiClient.get('/master/options');
                if (res) {
                    setOptions({
                        departemen: res.departemen || []
                    });
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
            let url = `/monitoring/presensi?page=${currentPage}&per_page=${perPage}`;
            if (dateFilter) url += `&date=${dateFilter}`;
            if (filterDept) url += `&dept_code=${filterDept}`;

            // Note: Search term might need backend support if not already present. 
            // The python endpoint currently doesn't seem to have 'search' param in the snippet shown earlier, 
            // but we'll include it in client-side filtering or assume backend might support it later.
            // For now, based on previous snippet, Python backend supports: date, dept_code, page, per_page.
            // We will filter client-side for search term if backend doesn't support it, 
            // OR we can add it to backend. Given the instruction is "content layout", I will focus on layout 
            // and perform client-side filtering for search if needed, but optimally passing it to API is better.
            // Let's stick to what's available or simple client filtering for search if API doesn't support it yet.
            // Actually, the previous Python code didn't have `search` param.

            const response: any = await apiClient.get(url);
            if (response.status) {
                setData(response.data);
                if (response.meta) {
                    setTotalPages(response.meta.total_pages);
                    setTotalItems(response.meta.total_items);
                }
            } else {
                console.error("API Error:", response.message);
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch presensi", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateFilter, currentPage, perPage, filterDept]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [dateFilter, filterDept]);

    // Client-side filtering for search (Name/NIK) since backend might not have it yet
    const filteredData = data.filter(item =>
        item.nama_karyawan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nik.includes(searchTerm) ||
        item.nama_dept.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper Status Badge
    const getStatusBadge = (status: string) => {
        const s = status ? status.toLowerCase() : '';
        let badgeClass = "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400";
        let label = status;

        if (s === 'h' || s === 'hadir') {
            badgeClass = "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400";
            label = "Hadir";
        } else if (s === 'i' || s === 'izin') {
            badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
            label = "Izin";
        } else if (s === 's' || s === 'sakit') {
            badgeClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400";
            label = "Sakit";
        } else if (s === 'a' || s === 'alpha') {
            badgeClass = "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
            label = "Alpha";
        }

        return (
            <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-medium", badgeClass)}>
                {label}
            </span>
        );
    };

    // Helper Image URL
    // Backend now returns full URLs, so just return as-is
    const getImageUrl = (filename: string | null) => {
        if (!filename) return null;
        return filename;
    };

    // Helper Maps URL
    const getMapsUrl = (coords: string | null) => {
        if (!coords) return '#';
        return `https://www.google.com/maps?q=${coords}`;
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Apakah Anda Yakin?',
            text: `Data presensi ini akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/monitoring/presensi/${id}`);
            Swal.fire({
                title: 'Terhapus!',
                text: 'Data presensi berhasil dihapus.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            fetchData();
        } catch (error: any) {
            console.error(error);
            Swal.fire('Gagal!', error.response?.data?.detail || "Gagal menghapus data.", 'error');
        }
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Monitoring Presensi" />

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
                        Daftar Presensi
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative col-span-1 md:col-span-2">
                        <input
                            type="text"
                            placeholder="Cari karyawan..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        />
                        <Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                    </div>

                    <DatePicker
                        id="date-filter"
                        placeholder="Filter Tanggal"
                        defaultDate={dateFilter}
                        onChange={(dates: Date[], dateStr: string) => setDateFilter(dateStr)}
                    />

                    <SearchableSelect
                        options={[{ value: "", label: "Semua Departemen" }, ...options.departemen.map(o => ({ value: o.code, label: o.name }))]}
                        value={filterDept}
                        onChange={(val) => setFilterDept(val)}
                        placeholder="Semua Departemen"
                    />
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Karyawan</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Shift</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Jam Masuk</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Jam Pulang</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white text-center">Bukti Foto</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td>
                                </tr>
                            ) : (
                                filteredData.map((item, idx) => (
                                    <tr key={idx} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/10">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-10 w-10 text-brand-500 bg-brand-50 rounded-full flex items-center justify-center font-bold">
                                                    {item.nama_karyawan ? item.nama_karyawan.substring(0, 2).toUpperCase() : '??'}
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-black dark:text-white text-sm">{item.nama_karyawan}</h5>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <span>{item.nik}</span>
                                                        <span>•</span>
                                                        <span>{item.nama_dept}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-block rounded bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-black dark:bg-meta-4 dark:text-white">
                                                {item.nama_jam_kerja}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-black dark:text-white text-sm font-medium">{item.jam_in}</span>
                                                {item.lokasi_in && (
                                                    <a
                                                        href={getMapsUrl(item.lokasi_in)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-xs text-brand-500 hover:underline"
                                                    >
                                                        <MapPin className="h-3 w-3" />
                                                        Lokasi
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={clsx("text-sm font-medium", item.jam_out === '-' ? "text-gray-400" : "text-black dark:text-white")}>
                                                    {item.jam_out}
                                                </span>
                                                {item.lokasi_out && (
                                                    <a
                                                        href={getMapsUrl(item.lokasi_out)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-xs text-brand-500 hover:underline"
                                                    >
                                                        <MapPin className="h-3 w-3" />
                                                        Lokasi
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center -space-x-2">
                                                {item.foto_in && (
                                                    <div className="relative h-10 w-10 rounded-full border-2 border-white dark:border-boxdark overflow-hidden bg-gray-200">
                                                        <Image
                                                            src={getImageUrl(item.foto_in) || ""}
                                                            alt="In"
                                                            width={40}
                                                            height={40}
                                                            className="h-full w-full object-cover cursor-pointer hover:opacity-80 transition"
                                                            unoptimized
                                                            onError={(e: any) => e.target.style.display = 'none'}
                                                            onClick={() => setPreviewImage(getImageUrl(item.foto_in))}
                                                        />
                                                    </div>
                                                )}
                                                {item.foto_out && (
                                                    <div className="relative h-10 w-10 rounded-full border-2 border-white dark:border-boxdark overflow-hidden bg-gray-200">
                                                        <Image
                                                            src={getImageUrl(item.foto_out) || ""}
                                                            alt="Out"
                                                            width={40}
                                                            height={40}
                                                            className="h-full w-full object-cover cursor-pointer hover:opacity-80 transition"
                                                            unoptimized
                                                            onError={(e: any) => e.target.style.display = 'none'}
                                                            onClick={() => setPreviewImage(getImageUrl(item.foto_out))}
                                                        />
                                                    </div>
                                                )}
                                                {!item.foto_in && !item.foto_out && (
                                                    <span className="text-xs text-gray-500 font-medium">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {getStatusBadge(item.status_kehadiran)}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <a href={`https://k3guard.com/presensi/${item.id}`} title="Detail" className="hover:text-blue-500 text-blue-400">
                                                    <Eye className="h-5 w-5" />
                                                </a>
                                                <button title="Edit" className="hover:text-yellow-500 text-yellow-400">
                                                    <Edit className="h-5 w-5" />
                                                </button>
                                                {canDelete('presensi') && (
                                                    <button onClick={() => handleDelete(item.id)} title="Hapus" className="hover:text-red-500 text-red-500">
                                                        <Trash className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stroke pt-4 dark:border-strokedark">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Menampilkan <span className="font-medium text-black dark:text-white">{filteredData.length > 0 ? (currentPage - 1) * perPage + 1 : 0}</span> - <span className="font-medium text-black dark:text-white">{Math.min(currentPage * perPage, totalItems)}</span> dari <span className="font-medium text-black dark:text-white">{totalItems}</span> data
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                            className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || loading}
                            className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout >
    );
}

// Protect page with permission
export default withPermission(PresensiPage, {
    permissions: ['presensi.index']
});
