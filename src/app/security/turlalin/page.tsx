'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, Search, X, Save, Edit, Trash, ArrowLeft, ArrowRight, User, Eye } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import Image from 'next/image';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';

type TurlalinItem = {
    id: number;
    nomor_polisi: string;
    jam_masuk: string;
    nik: string;
    keterangan: string | null;
    foto: string | null;
    jam_keluar: string | null;
    nik_keluar: string | null;
    foto_keluar: string | null;
    created_at?: string;
    updated_at?: string;
    nama_guard_masuk?: string;
    nama_guard_keluar?: string;
};

type KaryawanOption = {
    nik: string;
    nama_karyawan: string;
};

function SecurityTurlalinPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<TurlalinItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [karyawanList, setKaryawanList] = useState<KaryawanOption[]>([]);

    // Pagination State (Client-side initially, since API limits to 100)
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<{
        id: number;
        nomor_polisi: string;
        jam_masuk: string;
        nik: string;
        keterangan: string;
        foto: string;
        jam_keluar: string;
        nik_keluar: string;
        foto_keluar: string;
    }>({
        id: 0,
        nomor_polisi: '',
        jam_masuk: '',
        nik: '',
        keterangan: '',
        foto: '',
        jam_keluar: '',
        nik_keluar: '',
        foto_keluar: ''
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Fetch Karyawan for dropdown
    const fetchKaryawan = async () => {
        try {
            // Trying to fetch full list or paginate? usually /master/karyawan with large limit or search if needed.
            // Assuming this returns a list in `data` field of response object based on KaryawanListResponse seen earlier.
            const response: any = await apiClient.get('/master/karyawan?per_page=10000'); // Fetch enough for selection
            // The response structure from master.py is { status: boolean, data: [], meta: {} }
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
            let url = '/security/turlalin?';
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
            console.error("Failed to fetch turlalin data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKaryawan();
        fetchData();
    }, []); // Initial load

    // Use effect to re-fetch when filters change (debounced search could be better but let's keep simple)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
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
        // Default jam_masuk to now
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const nowStr = now.toISOString().slice(0, 16);

        setFormData({
            id: 0,
            nomor_polisi: '',
            jam_masuk: nowStr,
            nik: '', // Should be logged in user ideally, but admin selects
            keterangan: '',
            foto: '',
            jam_keluar: '',
            nik_keluar: '',
            foto_keluar: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: TurlalinItem) => {
        setErrorMsg('');
        setModalMode('edit');
        setFormData({
            id: item.id,
            nomor_polisi: item.nomor_polisi,
            jam_masuk: item.jam_masuk ? new Date(item.jam_masuk).toISOString().slice(0, 16) : '',
            nik: item.nik,
            keterangan: item.keterangan || '',
            foto: item.foto || '',
            jam_keluar: item.jam_keluar ? new Date(item.jam_keluar).toISOString().slice(0, 16) : '',
            nik_keluar: item.nik_keluar || '',
            foto_keluar: item.foto_keluar || ''
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

        if (!formData.nomor_polisi || !formData.jam_masuk || !formData.nik) {
            setErrorMsg('Harap isi Nomor Polisi, Jam Masuk, dan Petugas Masuk.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                jam_keluar: formData.jam_keluar || null,
                nik_keluar: formData.nik_keluar || null,
                foto: formData.foto || null,
                foto_keluar: formData.foto_keluar || null,
                keterangan: formData.keterangan || null
            };

            if (modalMode === 'create') {
                await apiClient.post('/security/turlalin', payload);
            } else {
                await apiClient.put(`/security/turlalin/${editingId}`, payload);
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
            text: `Data ini akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/security/turlalin/${id}`);
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
            <PageBreadcrumb pageTitle="Pengaturan Lalu Lintas (Turlalin)" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                        Daftar Turlalin
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('turlalin') && (
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
                            placeholder="Cari nomor polisi..."
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
                        <input
                            type="datetime-local"
                            value={dateStart}
                            onChange={e => setDateStart(e.target.value)}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500 text-sm"
                        />
                    </div>
                    <div>
                        <input
                            type="datetime-local"
                            value={dateEnd}
                            onChange={e => setDateEnd(e.target.value)}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500 text-sm"
                        />
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Nomor Polisi</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Waktu Masuk / Keluar</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Petugas Jaga</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Keterangan</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Foto</th>
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
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <h5 className="font-bold text-black dark:text-white">{item.nomor_polisi}</h5>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm">
                                                <div className="text-green-600 font-medium">In: {item.jam_masuk ? new Date(item.jam_masuk).toLocaleString('id-ID') : '-'}</div>
                                                {item.jam_keluar && (
                                                    <div className="text-red-600 font-medium mt-1">Out: {new Date(item.jam_keluar).toLocaleString('id-ID')}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div><span className="text-gray-500 text-xs">Masuk:</span> {item.nama_guard_masuk || item.nik}</div>
                                            {item.nik_keluar && (
                                                <div className="mt-1"><span className="text-gray-500 text-xs">Keluar:</span> {item.nama_guard_keluar || item.nik_keluar}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <p className="line-clamp-2">{item.keterangan || '-'}</p>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                {item.foto ? (
                                                    <a href={item.foto} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline text-xs flex items-center justify-center">
                                                        <User className="w-4 h-4" /> In
                                                    </a>
                                                ) : <span className="text-xs text-gray-400">No Img</span>}
                                                {item.foto_keluar && (
                                                    <a href={item.foto_keluar} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline text-xs flex items-center justify-center">
                                                        <User className="w-4 h-4" /> Out
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {canUpdate('turlalin') && (
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:text-yellow-500 text-gray-500 dark:text-gray-400">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                )}
                                                {canDelete('turlalin') && (
                                                    <button onClick={() => handleDelete(item.id)} className="hover:text-red-500 text-gray-500 dark:text-gray-400">
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

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center sticky top-0 bg-white dark:bg-boxdark z-10">
                            <h3 className="text-lg font-bold text-black dark:text-white">
                                {modalMode === 'create' ? 'Tambah Data Turlalin' : 'Edit Data Turlalin'}
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Nomor Polisi</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            placeholder="Contoh: B 1234 ABC"
                                            value={formData.nomor_polisi}
                                            onChange={e => setFormData({ ...formData, nomor_polisi: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Jam Masuk</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.jam_masuk}
                                            onChange={e => setFormData({ ...formData, jam_masuk: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Petugas Masuk</label>
                                    <select
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                        value={formData.nik}
                                        onChange={e => setFormData({ ...formData, nik: e.target.value })}
                                    >
                                        <option value="">Pilih Petugas (Karyawan)</option>
                                        {karyawanList.map(k => (
                                            <option key={k.nik} value={k.nik}>{k.nama_karyawan} ({k.nik})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Foto Masuk (URL)</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                        placeholder="https://..."
                                        value={formData.foto}
                                        onChange={e => setFormData({ ...formData, foto: e.target.value })}
                                    />
                                </div>

                                <div className="border-t border-stroke dark:border-strokedark pt-4 mt-2">
                                    <h4 className="font-semibold text-gray-500 mb-3 text-sm uppercase">Data Keluar (Opsional)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-black dark:text-white mb-2">Jam Keluar</label>
                                            <input
                                                type="datetime-local"
                                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                                value={formData.jam_keluar}
                                                onChange={e => setFormData({ ...formData, jam_keluar: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-black dark:text-white mb-2">Petugas Keluar</label>
                                            <select
                                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                                value={formData.nik_keluar}
                                                onChange={e => setFormData({ ...formData, nik_keluar: e.target.value })}
                                            >
                                                <option value="">Pilih Petugas</option>
                                                {karyawanList.map(k => (
                                                    <option key={k.nik} value={k.nik}>{k.nama_karyawan} ({k.nik})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Foto Keluar (URL)</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            placeholder="https://..."
                                            value={formData.foto_keluar}
                                            onChange={e => setFormData({ ...formData, foto_keluar: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Keterangan</label>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                        placeholder="Keterangan tambahan..."
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
export default withPermission(SecurityTurlalinPage, {
    permissions: ['turlalin.index']
});
