'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, Search, X, Save, Edit, Trash, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';

type JamKerjaItem = {
    kode_jam_kerja: string;
    nama_jam_kerja: string;
    jam_masuk: string;
    jam_pulang: string;
    istirahat: string;
    total_jam: number;
    lintashari: string;
    jam_awal_istirahat?: string | null;
    jam_akhir_istirahat?: string | null;
    keterangan?: string;
    created_at?: string;
    updated_at?: string;
};

function MasterJamKerjaPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<JamKerjaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State (Client-side)
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<JamKerjaItem>({
        kode_jam_kerja: '',
        nama_jam_kerja: '',
        jam_masuk: '08:00',
        jam_pulang: '17:00',
        istirahat: 'N',
        total_jam: 8,
        lintashari: 'N',
        jam_awal_istirahat: '',
        jam_akhir_istirahat: '',
        keterangan: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get('/master/jamkerja');
            if (Array.isArray(response)) {
                setData(response);
            } else if (response.data && Array.isArray(response.data)) {
                setData(response.data);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch jam kerja", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter & Pagination Logic
    const filteredData = useMemo(() => {
        return data.filter(item =>
            item.nama_jam_kerja.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.kode_jam_kerja.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [filteredData, currentPage, perPage]);

    const totalPages = Math.ceil(filteredData.length / perPage);

    // Handlers
    const handleOpenCreate = () => {
        setErrorMsg('');
        setModalMode('create');
        setFormData({
            kode_jam_kerja: '',
            nama_jam_kerja: '',
            jam_masuk: '08:00',
            jam_pulang: '17:00',
            istirahat: 'N',
            total_jam: 9,
            lintashari: 'N',
            jam_awal_istirahat: '',
            jam_akhir_istirahat: '',
            keterangan: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: JamKerjaItem) => {
        setErrorMsg('');
        setModalMode('edit');
        setFormData({
            ...item,
            // Ensure nulls become empty strings for inputs
            jam_awal_istirahat: item.jam_awal_istirahat || '',
            jam_akhir_istirahat: item.jam_akhir_istirahat || '',
            keterangan: item.keterangan || ''
        });
        setEditingId(item.kode_jam_kerja);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.kode_jam_kerja || !formData.nama_jam_kerja || !formData.jam_masuk || !formData.jam_pulang) {
            setErrorMsg('Harap isi Kode, Nama, Jam Masuk, dan Jam Pulang.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Prepare payload - handle empty strings for optional times
            const payload = { ...formData };
            if (!payload.jam_awal_istirahat) delete payload.jam_awal_istirahat;
            if (!payload.jam_akhir_istirahat) delete payload.jam_akhir_istirahat;
            if (!payload.keterangan) delete payload.keterangan;

            if (modalMode === 'create') {
                await apiClient.post('/master/jamkerja', payload);
            } else {
                await apiClient.put(`/master/jamkerja/${editingId}`, payload);
            }
            setIsModalOpen(false);
            fetchData();
            Swal.fire({
                title: 'Berhasil!',
                text: modalMode === 'create' ? 'Data berhasil disimpan.' : 'Data berhasil diperbarui.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail || 'Terjadi kesalahan saat menyimpan.';
            setErrorMsg(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (kode: string) => {
        const result = await Swal.fire({
            title: 'Apakah Anda Yakin?',
            text: `Data jam kerja ${kode} akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/master/jamkerja/${kode}`);
            Swal.fire({
                title: 'Terhapus!',
                text: 'Data jam kerja berhasil dihapus.',
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
            <PageBreadcrumb pageTitle="Master Jam Kerja" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                        Daftar Jam Kerja
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('jamkerja') && (
                            <button onClick={handleOpenCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                            <Plus className="h-4 w-4" />
                            <span>Tambah Data</span>
                        </button>
                        )}
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative col-span-1 md:col-span-2">
                        <input
                            type="text"
                            placeholder="Cari jam kerja..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
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
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">Kode</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Nama Jam Kerja</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white text-center">Masuk - Pulang</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Durasi</th>
                                <th className="min-w-[80px] px-4 py-4 font-medium text-black dark:text-white text-center">Lintas Hari</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={idx} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex rounded bg-gray-100 px-2 py-1 text-sm font-medium text-black dark:bg-meta-4 dark:text-white">
                                                {item.kode_jam_kerja}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <h5 className="font-medium text-black dark:text-white text-sm">{item.nama_jam_kerja}</h5>
                                            <p className="text-xs text-gray-500">{item.keterangan}</p>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1 text-sm font-medium text-black dark:text-white">
                                                <Clock className="w-4 h-4 text-brand-500" />
                                                <span>{item.jam_masuk?.substring(0, 5)} - {item.jam_pulang?.substring(0, 5)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-sm font-semibold">{item.total_jam} Jam</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {item.lintashari === 'Y' ?
                                                <span className="inline-flex rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-xs font-semibold">Ya</span>
                                                : <span className="inline-flex rounded-full bg-gray-100 text-gray-500 px-3 py-1 text-xs font-semibold">Tidak</span>
                                            }
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {canUpdate('jamkerja') && (
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:text-yellow-500 text-gray-500 dark:text-gray-400">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                )}
                                                {canDelete('jamkerja') && (
                                                    <button onClick={() => handleDelete(item.kode_jam_kerja)} className="hover:text-red-500 text-gray-500 dark:text-gray-400">
                                                    <Trash className="h-4 w-4" />
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

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center sticky top-0 bg-white dark:bg-boxdark z-10">
                            <h3 className="text-lg font-bold text-black dark:text-white">
                                {modalMode === 'create' ? 'Tambah Jam Kerja' : 'Edit Jam Kerja'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-5 space-y-4">
                                {errorMsg && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                                        {errorMsg}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Kode</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input disabled:bg-gray-100 dark:disabled:bg-black/20"
                                            placeholder="Contoh: JK01"
                                            value={formData.kode_jam_kerja}
                                            onChange={e => setFormData({ ...formData, kode_jam_kerja: e.target.value })}
                                            maxLength={4}
                                            disabled={modalMode === 'edit'}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Nama Jam Kerja</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            placeholder="Contoh: Shift Pagi"
                                            value={formData.nama_jam_kerja}
                                            onChange={e => setFormData({ ...formData, nama_jam_kerja: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Jam Masuk</label>
                                        <input
                                            type="time"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.jam_masuk}
                                            onChange={e => setFormData({ ...formData, jam_masuk: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Jam Pulang</label>
                                        <input
                                            type="time"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.jam_pulang}
                                            onChange={e => setFormData({ ...formData, jam_pulang: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Total Jam Kerja</label>
                                        <input
                                            type="number"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.total_jam}
                                            onChange={e => setFormData({ ...formData, total_jam: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Lintas Hari</label>
                                        <select
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.lintashari}
                                            onChange={e => setFormData({ ...formData, lintashari: e.target.value })}
                                        >
                                            <option value="N">Tidak</option>
                                            <option value="Y">Ya</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="border-t border-stroke dark:border-strokedark pt-4 mt-2">
                                    <div className="flex items-center gap-2 mb-4">
                                        <input
                                            type="checkbox"
                                            id="istirahat"
                                            checked={formData.istirahat === 'Y'}
                                            onChange={e => setFormData({ ...formData, istirahat: e.target.checked ? 'Y' : 'N' })}
                                            className="w-4 h-4 text-brand-500"
                                        />
                                        <label htmlFor="istirahat" className="text-sm font-semibold text-black dark:text-white cursor-pointer select-none">
                                            Ada Jam Istirahat?
                                        </label>
                                    </div>

                                    {formData.istirahat === 'Y' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                            <div>
                                                <label className="block text-sm font-semibold text-black dark:text-white mb-2">Mulai Istirahat</label>
                                                <input
                                                    type="time"
                                                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                                    value={formData.jam_awal_istirahat || ''}
                                                    onChange={e => setFormData({ ...formData, jam_awal_istirahat: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-black dark:text-white mb-2">Selesai Istirahat</label>
                                                <input
                                                    type="time"
                                                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                                    value={formData.jam_akhir_istirahat || ''}
                                                    onChange={e => setFormData({ ...formData, jam_akhir_istirahat: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Keterangan</label>
                                    <textarea
                                        rows={2}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                        placeholder="Keterangan tambahan (opsional)"
                                        value={formData.keterangan}
                                        onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 dark:bg-meta-4/30 flex justify-end gap-3 border-t border-stroke dark:border-strokedark sticky bottom-0 z-10">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-black bg-white border border-stroke rounded-lg hover:bg-gray-50">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-opacity-90 flex items-center">
                                    {isSubmitting ? 'Menyimpan...' : <><Save className="w-4 h-4 mr-2" /> Simpan</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

// Protect page with permission
export default withPermission(MasterJamKerjaPage, {
    permissions: ['jamkerja.index']
});
