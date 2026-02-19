'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Plus, Search, Trash2, Edit, RefreshCw, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import SearchableSelect from '@/components/form/SearchableSelect';
import dynamic from 'next/dynamic';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />
});

type HariLibur = {
    kode_libur: string;
    tanggal: string;
    kode_cabang: string;
    keterangan: string;
    nama_cabang: string;
};

type BranchOption = {
    kode_cabang: string;
    nama_cabang: string;
};

function HariLiburPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<HariLibur[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCabang, setSearchCabang] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(10);

    // Modal & Form States
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
        tanggal: '',
        kode_cabang: '',
        keterangan: ''
    });

    // Options
    const [cabangOptions, setCabangOptions] = useState<BranchOption[]>([]);

    useEffect(() => {
        fetchData();
    }, [searchCabang, dateFrom, dateTo]);

    useEffect(() => {
        fetchCabang();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchCabang) params.append('kode_cabang', searchCabang);
            if (dateFrom) params.append('dari', dateFrom);
            if (dateTo) params.append('sampai', dateTo);

            const res: any = await apiClient.get(`/settings/hari-libur?${params.toString()}`);
            setData(Array.isArray(res) ? res : []);
        } catch (error) {
            console.error(error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCabang = async () => {
        try {
            const res = await apiClient.get('/master/cabang/options');
            setCabangOptions(res as any);
        } catch (error) {
            console.error("Failed cabang", error);
        }
    };

    // Filter & Pagination
    const filteredData = useMemo(() => {
        return data.filter(item =>
            item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.nama_cabang.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.kode_libur.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [filteredData, currentPage, perPage]);

    const totalPages = Math.ceil(filteredData.length / perPage);

    const handleCreate = () => {
        setIsEditing(false);
        setFormData({
            tanggal: '',
            kode_cabang: '',
            keterangan: ''
        });
        setShowModal(true);
    };

    const handleEdit = async (id: string) => {
        try {
            const res: any = await apiClient.get(`/settings/hari-libur/${id}`);
            setFormData({
                tanggal: res.tanggal,
                kode_cabang: res.kode_cabang,
                keterangan: res.keterangan
            });
            setCurrentId(id);
            setIsEditing(true);
            setShowModal(true);
        } catch (error) {
            Swal.fire('Error', 'Gagal memuat data', 'error');
        }
    };

    const handleDelete = (id: string) => {
        Swal.fire({
            title: 'Hapus Data?',
            text: "Data hari libur ini akan dihapus!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/settings/hari-libur/${id}`);
                    Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
                    fetchData();
                } catch (error) {
                    Swal.fire('Gagal!', 'Gagal menghapus data.', 'error');
                }
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentId) {
                await apiClient.put(`/settings/hari-libur/${currentId}`, formData);
            } else {
                await apiClient.post('/settings/hari-libur', formData);
            }

            setShowModal(false);
            Swal.fire('Berhasil', 'Data berhasil disimpan', 'success');
            fetchData();
        } catch (error: any) {
            Swal.fire('Gagal', error.response?.data?.detail || 'Gagal menyimpan data', 'error');
        }
    };

    const formatTanggal = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Hari Libur" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-brand-500" />
                        Management Hari Libur
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('harilibur') && (
                            <button onClick={handleCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                                <Plus className="h-4 w-4" />
                                <span>Tambah Libur</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari keterangan atau cabang..."
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
                            options={cabangOptions.map(c => ({ value: c.kode_cabang, label: c.nama_cabang }))}
                            value={searchCabang}
                            onChange={(val) => setSearchCabang(val)}
                            placeholder="Semua Cabang"
                        />
                    </div>
                    <div>
                        <div>
                            <DatePicker
                                id="date-from"
                                placeholder="Dari Tanggal"
                                defaultDate={dateFrom}
                                onChange={(dates: Date[], dateStr: string) => setDateFrom(dateStr)}
                            />
                        </div>
                        <div>
                            <DatePicker
                                id="date-to"
                                placeholder="Sampai Tanggal"
                                defaultDate={dateTo}
                                onChange={(dates: Date[], dateStr: string) => setDateTo(dateStr)}
                            />
                        </div>
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">Kode</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Tanggal</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Cabang</th>
                                <th className="min-w-[250px] px-4 py-4 font-medium text-black dark:text-white">Keterangan</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Tidak ada data.</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.kode_libur} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex rounded-full bg-gray-100 text-gray-800 px-3 py-1 text-xs font-semibold dark:bg-meta-4 dark:text-gray-300">
                                                {item.kode_libur}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-brand-500" />
                                                <h5 className="font-semibold text-black dark:text-white text-sm">{formatTanggal(item.tanggal)}</h5>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.nama_cabang}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.keterangan}</p>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(item.kode_libur)} className="hover:text-yellow-500 text-gray-500 dark:text-gray-400" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {canDelete('harilibur') && (
                                                    <button onClick={() => handleDelete(item.kode_libur)} className="hover:text-red-500 text-gray-500 dark:text-gray-400" title="Hapus">
                                                        <Trash2 className="h-4 w-4" />
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
                {filteredData.length > 0 && (
                    <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stroke pt-4 dark:border-strokedark">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, filteredData.length)} dari {filteredData.length} data
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-999999 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl dark:bg-boxdark">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white text-2xl font-bold">✕</button>
                        <h3 className="mb-6 text-2xl font-bold text-black dark:text-white flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-brand-500" />
                            {isEditing ? 'Edit Hari Libur' : 'Tambah Hari Libur'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-6 mb-6">
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white font-medium">Tanggal Libur</label>
                                    <DatePicker
                                        id="form-tanggal"
                                        placeholder="Pilih Tanggal"
                                        defaultDate={formData.tanggal}
                                        onChange={(dates: Date[], dateStr: string) => setFormData({ ...formData, tanggal: dateStr })}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white font-medium">Cabang</label>
                                    <SearchableSelect
                                        options={cabangOptions.map(c => ({ value: c.kode_cabang, label: c.nama_cabang }))}
                                        value={formData.kode_cabang}
                                        onChange={(val) => setFormData({ ...formData, kode_cabang: val })}
                                        placeholder="Pilih Cabang"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white font-medium">Keterangan</label>
                                    <textarea
                                        value={formData.keterangan}
                                        onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                        rows={4}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-brand-500"
                                        placeholder="Contoh: Libur Tahun Baru"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark">
                                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg bg-gray-200 px-6 py-2.5 font-medium text-black hover:bg-gray-300 transition">Batal</button>
                                <button type="submit" className="rounded-lg bg-brand-500 px-6 py-2.5 font-medium text-white hover:bg-opacity-90 transition shadow-sm">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

// Protect page with permission
export default withPermission(HariLiburPage, {
    permissions: ['harilibur.index']
});
