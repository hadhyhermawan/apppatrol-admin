'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, Search, X, Save, Edit, Trash, ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import SearchableSelect from '@/components/form/SearchableSelect';

type DeptTaskPointItem = {
    id: number;
    kode_cabang: string;
    kode_dept: string;
    nama_titik: string;
    urutan: number;
    radius: number;
    is_active: number;
    latitude: number | null;
    longitude: number | null;
    created_at?: string;
    updated_at?: string;
};

type OptionItem = { code: string; name: string };

function MasterDeptTaskPointPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<DeptTaskPointItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [cabangOptions, setCabangOptions] = useState<OptionItem[]>([]);
    const [deptOptions, setDeptOptions] = useState<OptionItem[]>([]);

    const [filterCabang, setFilterCabang] = useState('');
    const [filterDept, setFilterDept] = useState('');

    // Pagination State (Client-side)
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<DeptTaskPointItem>({
        id: 0,
        kode_cabang: '',
        kode_dept: '',
        nama_titik: '',
        urutan: 1,
        radius: 30,
        is_active: 1,
        latitude: null,
        longitude: null
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchOptions = async () => {
        try {
            const resOpts: any = await apiClient.get('/master/options');
            if (resOpts) {
                setCabangOptions(resOpts.cabang || []);
                setDeptOptions(resOpts.departemen || []);
            }
        } catch (error) {
            console.error("Failed to fetch options", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/master/dept-task-points?';
            if (filterCabang) url += `kode_cabang=${filterCabang}&`;
            if (filterDept) url += `kode_dept=${filterDept}&`;
            if (searchTerm) url += `search=${searchTerm}`;

            const response: any = await apiClient.get(url);
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch department task points", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOptions();
    }, []);

    useEffect(() => {
        fetchData();
    }, [filterCabang, filterDept, searchTerm]);

    // Pagination Logic only since Search is serverside/filtered
    // Actually SearchTerm triggers fetchData, so filteredData is effectively same as data
    // But pagination is client side for the fetched batch.

    // UseMemo for paginated data
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return data.slice(start, start + perPage);
    }, [data, currentPage, perPage]);

    const totalPages = Math.ceil(data.length / perPage);

    // Handlers
    const handleOpenCreate = () => {
        setErrorMsg('');
        setModalMode('create');
        setFormData({
            id: 0,
            kode_cabang: '',
            kode_dept: '',
            nama_titik: '',
            urutan: 1,
            radius: 30,
            is_active: 1,
            latitude: null,
            longitude: null
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: DeptTaskPointItem) => {
        setErrorMsg('');
        setModalMode('edit');
        setFormData({ ...item });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.kode_cabang || !formData.kode_dept || !formData.nama_titik) {
            setErrorMsg('Harap isi Cabang, Departemen, dan Nama Titik.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                // Ensure number types
                urutan: Number(formData.urutan),
                radius: Number(formData.radius),
                is_active: Number(formData.is_active),
                latitude: formData.latitude ? Number(formData.latitude) : null,
                longitude: formData.longitude ? Number(formData.longitude) : null,
            };

            if (modalMode === 'create') {
                await apiClient.post('/master/dept-task-points', payload);
            } else {
                await apiClient.put(`/master/dept-task-points/${editingId}`, payload);
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
            text: `Data titik tugas ini akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/master/dept-task-points/${id}`);
            Swal.fire({
                title: 'Terhapus!',
                text: 'Data titik tugas berhasil dihapus.',
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
            <PageBreadcrumb pageTitle="Data Titik Tugas Departemen" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                        Daftar Titik Tugas
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('depttaskpoint') && (
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
                            placeholder="Cari nama titik..."
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
                            options={[{ value: "", label: "Semua Cabang" }, ...cabangOptions.map(opt => ({ value: opt.code, label: opt.name }))]}
                            value={filterCabang}
                            onChange={(val) => setFilterCabang(val)}
                            placeholder="Semua Cabang"
                        />
                    </div>
                    <div>
                        <SearchableSelect
                            options={[{ value: "", label: "Semua Departemen" }, ...deptOptions.map(opt => ({ value: opt.code, label: opt.name }))]}
                            value={filterDept}
                            onChange={(val) => setFilterDept(val)}
                            placeholder="Semua Departemen"
                        />
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Nama Titik</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Cabang/Dept</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Lokasi (Lat, Long)</th>
                                <th className="min-w-[80px] px-4 py-4 font-medium text-black dark:text-white text-center">Radius</th>
                                <th className="min-w-[80px] px-4 py-4 font-medium text-black dark:text-white text-center">Urutan</th>
                                <th className="min-w-[80px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex bg-brand-500/10 h-10 w-10 min-w-10 items-center justify-center rounded-full text-brand-500">
                                                    <MapPin size={20} />
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-black dark:text-white text-sm">{item.nama_titik}</h5>
                                                    <p className="text-xs text-gray-500">ID: {item.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Cab:</span> {item.kode_cabang || '-'}
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Dept:</span> {item.kode_dept || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center text-sm">
                                            {item.latitude && item.longitude ? (
                                                <span className="bg-gray-100 text-gray-600 rounded px-2 py-1 text-xs">
                                                    {item.latitude}, {item.longitude}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-sm">{item.radius} m</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 text-xs rounded-full font-bold">{item.urutan}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {item.is_active ?
                                                <span className="inline-flex rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold">Aktif</span>
                                                : <span className="inline-flex rounded-full bg-gray-100 text-gray-500 px-3 py-1 text-xs font-semibold">Non-Aktif</span>
                                            }
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {canUpdate('depttaskpoint') && (
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:text-yellow-500 text-gray-500 dark:text-gray-400">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {canDelete('depttaskpoint') && (
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
                                {modalMode === 'create' ? 'Tambah Titik Tugas' : 'Edit Titik Tugas'}
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
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Cabang</label>
                                        <SearchableSelect
                                            options={cabangOptions.map(opt => ({ value: opt.code, label: opt.name }))}
                                            value={formData.kode_cabang}
                                            onChange={(val) => setFormData({ ...formData, kode_cabang: val })}
                                            placeholder="Pilih Cabang"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Departemen</label>
                                        <SearchableSelect
                                            options={deptOptions.map(opt => ({ value: opt.code, label: opt.name }))}
                                            value={formData.kode_dept}
                                            onChange={(val) => setFormData({ ...formData, kode_dept: val })}
                                            placeholder="Pilih Departemen"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Nama Titik Tugas</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                        placeholder="Nama Titik"
                                        value={formData.nama_titik}
                                        onChange={e => setFormData({ ...formData, nama_titik: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.latitude || ''}
                                            onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.longitude || ''}
                                            onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Urutan</label>
                                        <input
                                            type="number"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.urutan}
                                            onChange={e => setFormData({ ...formData, urutan: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Radius (meter)</label>
                                        <input
                                            type="number"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.radius}
                                            onChange={e => setFormData({ ...formData, radius: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-3 cursor-pointer select-none">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={!!formData.is_active}
                                                onChange={e => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                                            />
                                            <div className={`block w-14 h-8 rounded-full transition ${formData.is_active ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${formData.is_active ? 'translate-x-6' : ''}`}></div>
                                        </div>
                                        <span className="text-sm font-semibold text-black dark:text-white">
                                            Status Aktif
                                        </span>
                                    </label>
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
export default withPermission(MasterDeptTaskPointPage, {
    permissions: ['depttaskpoint.index']
});
