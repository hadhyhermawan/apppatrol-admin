'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, Search, X, Save, Edit, Trash, ArrowLeft, ArrowRight, MoreHorizontal } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import clsx from 'clsx';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import SearchableSelect from '@/components/form/SearchableSelect';
import DepartemenBoard from './DepartemenBoard';

type DepartemenItem = {
    kode_dept: string;
    nama_dept: string;
    vendor_id?: number | null;
    android_shortcuts?: string[];
    android_menus?: string[];
    created_at?: string;
    updated_at?: string;
};

const AVAILABLE_SHORTCUTS = [
    { value: "safetybrieifing", label: "Briefing" },
    { value: "patroli", label: "Patroli Reader" },
    { value: "walkie_Receiver", label: "Walkie Talkie" },
    { value: "monitoring", label: "Monitoring Area" },
    { value: "darurat", label: "Tombol Darurat" },
    { value: "turlalin", label: "Turlalin" },
    { value: "barang", label: "Logistik / Barang" },
    { value: "surat", label: "Persuratan" },
    { value: "tamu", label: "Tamu" },
    { value: "barrier_gate", label: "Barrier Gate" },
    { value: "department_task", label: "Tugas Dept (Sapu/Bersih)" },
    { value: "lainnya", label: "Menu Lainnya" }
];

const AVAILABLE_MENUS = [
    { value: "Jadwal Kerja", label: "Jadwal Kerja" },
    { value: "Patroli", label: "Menu Patroli Bawah" },
    { value: "KPI", label: "KPI" },
    { value: "Izin", label: "Perizinan" }
];

function MasterDepartemenPage() {
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = usePermissions();
    const [data, setData] = useState<DepartemenItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVendor, setFilterVendor] = useState('');
    const [vendorOptions, setVendorOptions] = useState<{ value: string, label: string }[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

    // Pagination State (Client-side)
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<DepartemenItem>({ kode_dept: '', nama_dept: '', vendor_id: null, android_shortcuts: [], android_menus: [] });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/master/departemen';
            if (isSuperAdmin && filterVendor) {
                url += `?vendor_id=${filterVendor}`;
            }
            const response: any = await apiClient.get(url);
            // Check response structure
            if (Array.isArray(response)) {
                setData(response);
            } else if (response.data && Array.isArray(response.data)) {
                setData(response.data);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch departemen", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        if (isSuperAdmin) {
            try {
                const res: any = await apiClient.get('/vendors');
                const vData = Array.isArray(res) ? res : (res?.data || []);
                setVendorOptions(vData.map((v: any) => ({ value: String(v.id), label: v.nama_vendor })));
            } catch (error) {
                console.error("Failed to fetch vendors", error);
            }
        }
    };

    useEffect(() => {
        fetchData();
        fetchVendors();
    }, [isSuperAdmin, filterVendor]);

    // Filter & Pagination Logic
    const filteredData = useMemo(() => {
        return data.filter(item =>
            item.nama_dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.kode_dept.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [filteredData, currentPage, perPage]);

    const totalPages = Math.ceil(filteredData.length / perPage);

    // Handlers
    const handleToggleShortcut = (val: string) => {
        setFormData(prev => {
            const list = prev.android_shortcuts || [];
            if (list.includes(val)) {
                return { ...prev, android_shortcuts: list.filter(i => i !== val) };
            }
            return { ...prev, android_shortcuts: [...list, val] };
        });
    };

    const handleToggleMenu = (val: string) => {
        setFormData(prev => {
            const list = prev.android_menus || [];
            if (list.includes(val)) {
                return { ...prev, android_menus: list.filter(i => i !== val) };
            }
            return { ...prev, android_menus: [...list, val] };
        });
    };

    const handleOpenCreate = () => {
        setErrorMsg('');
        setModalMode('create');
        setFormData({ kode_dept: '', nama_dept: '', vendor_id: null, android_shortcuts: [], android_menus: [] });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: DepartemenItem) => {
        setErrorMsg('');
        setModalMode('edit');
        setFormData({
            kode_dept: item.kode_dept,
            nama_dept: item.nama_dept,
            vendor_id: item.vendor_id || null,
            android_shortcuts: item.android_shortcuts || [],
            android_menus: item.android_menus || []
        });
        setEditingId(item.kode_dept);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (!formData.kode_dept.trim() || !formData.nama_dept.trim()) {
            setErrorMsg('Harap isi semua kolom wajib.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (modalMode === 'create') {
                await apiClient.post('/master/departemen', formData);
            } else {
                await apiClient.put(`/master/departemen/${editingId}`, formData);
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

    const handleDelete = async (kode_dept: string) => {
        const result = await Swal.fire({
            title: 'Apakah Anda Yakin?',
            text: `Data departemen ${kode_dept} akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/master/departemen/${kode_dept}`);
            Swal.fire({
                title: 'Terhapus!',
                text: 'Data departemen berhasil dihapus.',
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
            <PageBreadcrumb pageTitle="Data Departemen" />

            <div className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 ${viewMode === 'board' ? 'pb-0' : ''}`}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-black dark:text-white">
                            Daftar Departemen
                        </h2>
                        {isSuperAdmin && (
                            <div className="flex bg-gray-100 p-1.5 rounded-lg dark:bg-meta-4/50 shadow-inner">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={clsx("px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200", viewMode === 'list' ? "bg-white text-brand-500 shadow-sm dark:bg-boxdark" : "text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white")}
                                >
                                    List View
                                </button>
                                <button
                                    onClick={() => {
                                        setViewMode('board');
                                        setSearchTerm('');
                                    }}
                                    className={clsx("px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200", viewMode === 'board' ? "bg-white text-brand-500 shadow-sm dark:bg-boxdark" : "text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white")}
                                >
                                    Board View
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {isSuperAdmin && canCreate('departemen') && (
                            <button onClick={handleOpenCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                                <Plus className="h-4 w-4" />
                                <span>Tambah Data</span>
                            </button>
                        )}
                    </div>
                </div>

                {viewMode === 'list' ? (
                    <>
                        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="relative col-span-1 md:col-span-2">
                                <input
                                    type="text"
                                    placeholder="Cari departemen..."
                                    value={searchTerm}
                                    onChange={e => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1); // Reset page on search
                                    }}
                                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                                />
                                <Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                            </div>
                            {isSuperAdmin && (
                                <div>
                                    <SearchableSelect
                                        options={[{ value: '', label: 'Semua Vendor' }, ...vendorOptions]}
                                        value={filterVendor}
                                        onChange={val => setFilterVendor(val)}
                                        placeholder="Semua Vendor"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="max-w-full overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                        <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                        <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Kode Dept</th>
                                        <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Nama Departemen</th>
                                        <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                                    ) : paginatedData.length === 0 ? (
                                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td></tr>
                                    ) : (
                                        paginatedData.map((item, idx) => (
                                            <tr key={idx} className="border-b border-stroke dark:border-strokedark">
                                                <td className="px-4 py-4 text-center">
                                                    <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="inline-flex rounded bg-gray-100 px-2 py-1 text-sm font-medium text-black dark:bg-meta-4 dark:text-white">
                                                        {item.kode_dept}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <h5 className="font-medium text-black dark:text-white text-sm">{item.nama_dept}</h5>
                                                        {!item.vendor_id && (
                                                            <span className="inline-block rounded bg-blue-100 px-2 flex-shrink-0 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 tracking-wider">GLOBAL</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {canUpdate('departemen') && (isSuperAdmin || !!item.vendor_id) && (
                                                            <button onClick={() => handleOpenEdit(item)} className="hover:text-brand-500 text-gray-500 dark:text-gray-400 transition-colors">
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        {canDelete('departemen') && (isSuperAdmin || !!item.vendor_id) && (
                                                            <button onClick={() => handleDelete(item.kode_dept)} className="hover:text-red-500 text-gray-500 dark:text-gray-400 transition-colors">
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
                    </>
                ) : (
                    <div className="mt-6 border-t border-stroke pt-6 dark:border-strokedark -mx-5 px-5 sm:-mx-6 sm:px-6">
                        <DepartemenBoard
                            data={filteredData}
                            vendors={vendorOptions}
                            onUpdate={fetchData}
                        />
                    </div>
                )}
            </div>

            {/* MODAL (Kept internal for simplicity and matching existing structure) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center">
                            <h3 className="text-lg font-bold text-black dark:text-white">
                                {modalMode === 'create' ? 'Tambah Departemen' : 'Edit Departemen'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-5 space-y-4">
                                {errorMsg && (
                                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30">
                                        {errorMsg}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Kode Departemen</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500 disabled:bg-gray-100 dark:disabled:bg-black/20"
                                        placeholder="Contoh: IT"
                                        value={formData.kode_dept}
                                        onChange={e => setFormData({ ...formData, kode_dept: e.target.value })}
                                        maxLength={3}
                                        disabled={modalMode === 'edit'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Nama Departemen</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                        placeholder="Contoh: Information Technology"
                                        value={formData.nama_dept}
                                        onChange={e => setFormData({ ...formData, nama_dept: e.target.value })}
                                    />
                                </div>
                                {isSuperAdmin && (
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Pilih Vendor (Opsional)</label>
                                        <select
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                            value={formData.vendor_id || ''}
                                            onChange={e => setFormData({ ...formData, vendor_id: e.target.value ? parseInt(e.target.value) : null })}
                                        >
                                            <option value="">-- Tanpa Vendor --</option>
                                            {vendorOptions.map(v => (
                                                <option key={v.value} value={v.value}>{v.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="border-t border-stroke pt-4 mt-2 dark:border-strokedark">
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-3">Hak Akses Modul Android (Shortcut Grid)</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {AVAILABLE_SHORTCUTS.map(sc => (
                                            <label key={sc.value} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-boxdark rounded">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                                                    checked={(formData.android_shortcuts || []).includes(sc.value)}
                                                    onChange={() => handleToggleShortcut(sc.value)}
                                                />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{sc.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-stroke pt-4 mt-2 dark:border-strokedark">
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-3">Hak Akses Menu Utama (Pilar Bawah)</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {AVAILABLE_MENUS.map(mn => (
                                            <label key={mn.value} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-boxdark rounded">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                                                    checked={(formData.android_menus || []).includes(mn.value)}
                                                    onChange={() => handleToggleMenu(mn.value)}
                                                />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mn.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 bg-gray-50 dark:bg-meta-4/30 flex justify-end gap-3 border-t border-stroke dark:border-strokedark">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-sm font-medium text-black dark:text-white bg-white dark:bg-meta-4 border border-stroke dark:border-strokedark rounded-lg hover:bg-gray-50 dark:hover:bg-opacity-90 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-opacity-90 transition flex items-center shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <span className="animate-spin mr-2 border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Simpan
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
export default withPermission(MasterDepartemenPage, {
    permissions: ['departemen.index']
});
