'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, Search, X, Save, Edit, Trash, ArrowLeft, ArrowRight, User, Eye, Calendar, Clock, MapPin } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import Image from 'next/image';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import SearchableSelect from '@/components/form/SearchableSelect';
import dynamic from 'next/dynamic';
import clsx from 'clsx';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />
});

type SafetyBriefingItem = {
    id: number;
    nik: string;
    keterangan: string;
    tanggal_jam: string;
    foto: string | null;
    created_at?: string;
    updated_at?: string;
    nama_karyawan?: string;
};

type KaryawanOption = {
    nik: string;
    nama_karyawan: string;
};

function SecuritySafetyBriefingPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<SafetyBriefingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [karyawanList, setKaryawanList] = useState<KaryawanOption[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<{
        id: number;
        nik: string;
        keterangan: string;
        tanggal_jam: string;
        foto: string;
    }>({
        id: 0,
        nik: '',
        keterangan: '',
        tanggal_jam: '',
        foto: ''
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Fetch Karyawan for dropdown
    const fetchKaryawan = async () => {
        try {
            const response: any = await apiClient.get('/master/karyawan?per_page=10000');
            if (response && response.data && Array.isArray(response.data)) {
                setKaryawanList(response.data);
            } else if (Array.isArray(response)) {
                setKaryawanList(response);
            }
        } catch (error) {
            console.error("Failed to fetch karyawan options", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/security/safety-briefings?';
            if (searchTerm) url += `search=${searchTerm}&`;
            if (dateStart) url += `date_start=${dateStart}&`;
            if (dateEnd) url += `date_end=${dateEnd}`;

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
        fetchKaryawan();
        fetchData();
    }, []);

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

    // Handlers
    const handleOpenCreate = () => {
        setErrorMsg('');
        setModalMode('create');
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const nowStr = now.toISOString().slice(0, 16);

        setFormData({
            id: 0,
            nik: '',
            keterangan: '',
            tanggal_jam: nowStr,
            foto: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: SafetyBriefingItem) => {
        setErrorMsg('');
        setModalMode('edit');
        const formatDbDate = (dbDate: string | null | undefined) => {
            if (!dbDate) return '';
            return dbDate.replace('T', ' ').substring(0, 16);
        };

        setFormData({
            id: item.id,
            nik: item.nik,
            keterangan: item.keterangan || '',
            tanggal_jam: formatDbDate(item.tanggal_jam),
            foto: item.foto || ''
        });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.nik || !formData.tanggal_jam || !formData.keterangan) {
            setErrorMsg('Harap isi Petugas, Tanggal Jam, dan Keterangan.');
            return;
        }

        setIsSubmitting(true);
        try {
            const fixSubmitDate = (dt: string | null | undefined) => {
                if (!dt) return null;
                return dt.replace('T', ' ') + (dt.length === 16 ? ':00' : '');
            };

            const payload = {
                ...formData,
                tanggal_jam: fixSubmitDate(formData.tanggal_jam),
                foto: formData.foto || null
            };

            if (modalMode === 'create') {
                await apiClient.post('/security/safety-briefings', payload);
            } else {
                await apiClient.put(`/security/safety-briefings/${editingId}`, payload);
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

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Apakah Anda Yakin?',
            text: `Data briefing ini akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/security/safety-briefings/${id}`);
            Swal.fire({
                title: 'Terhapus!',
                text: 'Data berhasil dihapus.',
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
            <PageBreadcrumb pageTitle="Safety Briefing" />

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
                        Daftar Safety Briefing
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('safety') && (
                            <button onClick={handleOpenCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                                <Plus className="h-4 w-4" />
                                <span>Tambah Data</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="relative col-span-2">
                        <input
                            type="text"
                            placeholder="Cari keterangan atau nama..."
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
                            placeholder="Dari Waktu"
                            defaultDate={dateStart}
                            enableTime
                            dateFormat="Y-m-d H:i"
                            onChange={(dates: Date[], dateStr: string) => setDateStart(dateStr)}
                        />
                    </div>
                    <div>
                        <DatePicker
                            id="date-end"
                            placeholder="Sampai Waktu"
                            defaultDate={dateEnd}
                            enableTime
                            dateFormat="Y-m-d H:i"
                            onChange={(dates: Date[], dateStr: string) => setDateEnd(dateStr)}
                        />
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Petugas / Pimpinan</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Waktu</th>
                                <th className="min-w-[250px] px-4 py-4 font-medium text-black dark:text-white">Keterangan</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Foto</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-10 w-10 text-brand-500 bg-brand-50 rounded-full flex items-center justify-center font-bold">
                                                    {item.nama_karyawan ? item.nama_karyawan.substring(0, 2).toUpperCase() : '??'}
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-black dark:text-white">{item.nama_karyawan}</h5>
                                                    <div className="text-xs text-gray-500">{item.nik}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-black dark:text-white text-sm font-medium">
                                                    {item.tanggal_jam ? new Date(item.tanggal_jam).toLocaleString('id-ID') : '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <p className="line-clamp-2">{item.keterangan || '-'}</p>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {item.foto ? (
                                                <div className="relative h-10 w-10 mx-auto rounded-full overflow-hidden border-2 border-white dark:border-boxdark shadow-sm bg-gray-200">
                                                    <Image
                                                        src={item.foto}
                                                        alt="Foto Briefing"
                                                        width={40}
                                                        height={40}
                                                        className="object-cover w-full h-full cursor-pointer hover:opacity-80 transition"
                                                        unoptimized
                                                        onClick={() => setPreviewImage(item.foto)}
                                                        onError={(e: any) => e.target.style.display = 'none'}
                                                    />
                                                </div>
                                            ) : <span className="text-xs text-gray-400">-</span>}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {canUpdate('safety') && (
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:text-yellow-500 text-yellow-400">
                                                        <Edit className="h-5 w-5" />
                                                    </button>
                                                )}
                                                {canDelete('safety') && (
                                                    <button onClick={() => handleDelete(item.id)} className="hover:text-red-500 text-red-500">
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

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center sticky top-0 bg-white dark:bg-boxdark z-10">
                            <h3 className="text-lg font-bold text-black dark:text-white">
                                {modalMode === 'create' ? 'Tambah Safety Briefing' : 'Edit Safety Briefing'}
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

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Waktu Briefing</label>
                                    <DatePicker
                                        id="form-tanggal-jam"
                                        placeholder="Pilih Waktu"
                                        defaultDate={formData.tanggal_jam}
                                        enableTime
                                        dateFormat="Y-m-d H:i"
                                        onChange={(dates: Date[], dateStr: string) => setFormData({ ...formData, tanggal_jam: dateStr })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Petugas / Pimpinan</label>
                                    <SearchableSelect
                                        options={karyawanList.map(k => ({ value: k.nik, label: `${k.nama_karyawan} (${k.nik})` }))}
                                        value={formData.nik}
                                        onChange={(val) => setFormData({ ...formData, nik: val })}
                                        placeholder="Pilih Petugas (Karyawan)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Foto Dokumentasi (URL)</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input text-black dark:text-white"
                                        placeholder="https://..."
                                        value={formData.foto}
                                        onChange={e => setFormData({ ...formData, foto: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Keterangan / Materi Briefing</label>
                                    <textarea
                                        rows={4}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input text-black dark:text-white"
                                        placeholder="Isi materi briefing..."
                                        value={formData.keterangan}
                                        onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                                    ></textarea>
                                </div>

                            </div>

                            <div className="px-6 py-4 bg-gray-50 dark:bg-meta-4/30 flex justify-end gap-3 border-t border-stroke dark:border-strokedark sticky bottom-0 z-10">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-black bg-white border border-stroke rounded-lg hover:bg-gray-50 dark:bg-meta-4 dark:text-white dark:border-strokedark">
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

export default withPermission(SecuritySafetyBriefingPage, { permissions: ['safety.index'] });
