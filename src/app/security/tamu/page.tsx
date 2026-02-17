'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, Search, X, Save, Edit, Trash, ArrowLeft, ArrowRight, UserCheck, Clock } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';

type TamuItem = {
    id_tamu: number;
    nama: string;
    alamat: string | null;
    jenis_id: string | null;
    no_telp: string | null;
    perusahaan: string | null;
    bertemu_dengan: string | null;
    dengan_perjanjian: string | null;
    keperluan: string | null;
    jenis_kendaraan: string | null;
    no_pol: string | null;
    foto: string | null;
    foto_keluar: string | null;
    barcode_kartu: string | null;
    jam_masuk: string | null;
    jam_keluar: string | null;
    nik_satpam: string | null;
    nik_satpam_keluar: string | null;
    nama_satpam_masuk?: string;
};

type KaryawanOption = {
    nik: string;
    nama_karyawan: string;
};

function SecurityTamuPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<TamuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [karyawanList, setKaryawanList] = useState<KaryawanOption[]>([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<{
        id_tamu: number;
        nama: string;
        alamat: string;
        no_telp: string;
        perusahaan: string;
        bertemu_dengan: string;
        dengan_perjanjian: string;
        keperluan: string;
        jenis_kendaraan: string;
        no_pol: string;
        jam_masuk: string;
        jam_keluar: string;
        nik_satpam: string;
        nik_satpam_keluar: string;
        foto: string;
        foto_keluar: string;
    }>({
        id_tamu: 0,
        nama: '',
        alamat: '',
        no_telp: '',
        perusahaan: '',
        bertemu_dengan: '',
        dengan_perjanjian: 'TIDAK',
        keperluan: '',
        jenis_kendaraan: 'PEJALAN KAKI',
        no_pol: '',
        jam_masuk: '',
        jam_keluar: '',
        nik_satpam: '',
        nik_satpam_keluar: '',
        foto: '',
        foto_keluar: ''
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Fetch Karyawan
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
            let url = '/security/tamu?';
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
            console.error("Failed to fetch tamu data", error);
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
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const nowStr = now.toISOString().slice(0, 16);

        setFormData({
            id_tamu: 0,
            nama: '',
            alamat: '',
            no_telp: '',
            perusahaan: '',
            bertemu_dengan: '',
            dengan_perjanjian: 'TIDAK',
            keperluan: '',
            jenis_kendaraan: 'PEJALAN KAKI',
            no_pol: '',
            jam_masuk: nowStr,
            jam_keluar: '',
            nik_satpam: '',
            nik_satpam_keluar: '',
            foto: '',
            foto_keluar: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: TamuItem) => {
        setErrorMsg('');
        setModalMode('edit');
        setFormData({
            id_tamu: item.id_tamu,
            nama: item.nama,
            alamat: item.alamat || '',
            no_telp: item.no_telp || '',
            perusahaan: item.perusahaan || '',
            bertemu_dengan: item.bertemu_dengan || '',
            dengan_perjanjian: item.dengan_perjanjian || 'TIDAK',
            keperluan: item.keperluan || '',
            jenis_kendaraan: item.jenis_kendaraan || 'PEJALAN KAKI',
            no_pol: item.no_pol || '',
            jam_masuk: item.jam_masuk ? new Date(item.jam_masuk).toISOString().slice(0, 16) : '',
            jam_keluar: item.jam_keluar ? new Date(item.jam_keluar).toISOString().slice(0, 16) : '',
            nik_satpam: item.nik_satpam || '',
            nik_satpam_keluar: item.nik_satpam_keluar || '',
            foto: item.foto || '',
            foto_keluar: item.foto_keluar || ''
        });
        setEditingId(item.id_tamu);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.nama || !formData.jam_masuk) {
            setErrorMsg('Harap isi Nama dan Jam Masuk.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                nik_satpam: formData.nik_satpam || null,
                nik_satpam_keluar: formData.nik_satpam_keluar || null,
                jam_keluar: formData.jam_keluar || null,
                foto: formData.foto || null,
                foto_keluar: formData.foto_keluar || null,
                alamat: formData.alamat || null,
                no_telp: formData.no_telp || null,
                perusahaan: formData.perusahaan || null,
                bertemu_dengan: formData.bertemu_dengan || null,
                keperluan: formData.keperluan || null,
                no_pol: formData.no_pol || null
            };

            if (modalMode === 'create') {
                await apiClient.post('/security/tamu', payload);
            } else {
                await apiClient.put(`/security/tamu/${editingId}`, payload);
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
            text: `Data tamu ini akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/security/tamu/${id}`);
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
            <PageBreadcrumb pageTitle="Buku Tamu (Visitor)" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                        Daftar Tamu
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('tamu') && (
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
                            placeholder="Cari nama, perusahaan, keperluan..."
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
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Tamu & Perusahaan</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Waktu Berkunjung</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Keperluan</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
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
                                    <tr key={item.id_tamu} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div>
                                                <h5 className="font-semibold text-black dark:text-white text-sm">{item.nama}</h5>
                                                {item.perusahaan && <p className="text-xs text-gray-500">{item.perusahaan}</p>}
                                                {item.bertemu_dengan && <p className="text-xs text-brand-600 mt-1">Bertemu: {item.bertemu_dengan}</p>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-green-600 font-medium">In: {item.jam_masuk ? new Date(item.jam_masuk).toLocaleString('id-ID') : '-'}</span>
                                                {item.jam_keluar && <span className="text-red-600 font-medium">Out: {new Date(item.jam_keluar).toLocaleString('id-ID')}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <p className="line-clamp-2">{item.keperluan || '-'}</p>
                                            <div className="mt-1 flex gap-2">
                                                <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                                                    {item.jenis_kendaraan}
                                                </span>
                                                {item.dengan_perjanjian === 'YA' && (
                                                    <span className="inline-flex rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                                        Janji
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center gap-1">
                                                {item.foto ? (
                                                    <a href={item.foto} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:scale-105 transition">
                                                        <UserCheck size={18} />
                                                    </a>
                                                ) : <span className="text-gray-300"><UserCheck size={18} /></span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {canUpdate('tamu') && (
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:text-yellow-500 text-gray-500 dark:text-gray-400">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                )}
                                                {canDelete('tamu') && (
                                                    <button onClick={() => handleDelete(item.id_tamu)} className="hover:text-red-500 text-gray-500 dark:text-gray-400">
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
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-4xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center sticky top-0 bg-white dark:bg-boxdark z-10">
                            <h3 className="text-lg font-bold text-black dark:text-white">
                                {modalMode === 'create' ? 'Input Buku Tamu' : 'Edit Data Tamu'}
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
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Nama Tamu <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            placeholder="Nama Lengkap"
                                            value={formData.nama}
                                            onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Perusahaan / Instansi</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            placeholder="Asal Perusahaan"
                                            value={formData.perusahaan}
                                            onChange={e => setFormData({ ...formData, perusahaan: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Nomor Telepon</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.no_telp}
                                            onChange={e => setFormData({ ...formData, no_telp: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Alamat</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.alamat}
                                            onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Bertemu Dengan</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            placeholder="Nama Karyawan/Departemen"
                                            value={formData.bertemu_dengan}
                                            onChange={e => setFormData({ ...formData, bertemu_dengan: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Dengan Perjanjian?</label>
                                        <select
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.dengan_perjanjian}
                                            onChange={e => setFormData({ ...formData, dengan_perjanjian: e.target.value })}
                                        >
                                            <option value="TIDAK">Tidak</option>
                                            <option value="YA">Ya</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Keperluan</label>
                                    <textarea
                                        rows={2}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                        placeholder="Jelaskan keperluan kunjungan..."
                                        value={formData.keperluan}
                                        onChange={e => setFormData({ ...formData, keperluan: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-stroke dark:border-strokedark pt-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Jenis Kendaraan</label>
                                        <select
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.jenis_kendaraan}
                                            onChange={e => setFormData({ ...formData, jenis_kendaraan: e.target.value })}
                                        >
                                            <option value="PEJALAN KAKI">Pejalan Kaki</option>
                                            <option value="RODA 2">Roda 2 (Motor)</option>
                                            <option value="RODA 4">Roda 4 (Mobil)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Nomor Polisi</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            placeholder="Nomor Polisi (jika berkendara)"
                                            value={formData.no_pol}
                                            onChange={e => setFormData({ ...formData, no_pol: e.target.value })}
                                            disabled={formData.jenis_kendaraan === 'PEJALAN KAKI'}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-stroke dark:border-strokedark pt-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Waktu Masuk <span className="text-red-500">*</span></label>
                                        <input
                                            type="datetime-local"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.jam_masuk}
                                            onChange={e => setFormData({ ...formData, jam_masuk: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Petugas Masuk (Satpam)</label>
                                        <select
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.nik_satpam}
                                            onChange={e => setFormData({ ...formData, nik_satpam: e.target.value })}
                                        >
                                            <option value="">Pilih Petugas</option>
                                            {karyawanList.map(k => (
                                                <option key={k.nik} value={k.nik}>{k.nama_karyawan}</option>
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
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-stroke dark:border-strokedark pt-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Waktu Keluar</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.jam_keluar}
                                            onChange={e => setFormData({ ...formData, jam_keluar: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Petugas Keluar (Satpam)</label>
                                        <select
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.nik_satpam_keluar}
                                            onChange={e => setFormData({ ...formData, nik_satpam_keluar: e.target.value })}
                                        >
                                            <option value="">Pilih Petugas</option>
                                            {karyawanList.map(k => (
                                                <option key={k.nik} value={k.nik}>{k.nama_karyawan}</option>
                                            ))}
                                        </select>
                                    </div>
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
export default withPermission(SecurityTamuPage, {
    permissions: ['tamu.index']
});
