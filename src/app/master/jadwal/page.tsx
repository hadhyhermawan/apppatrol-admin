'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, RefreshCw, Search, X, Save, Edit, Trash, ArrowLeft, ArrowRight, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';

type PatrolScheduleItem = {
    id: number;
    kode_jam_kerja: string;
    start_time: string;
    end_time: string;
    kode_dept: string | null;
    kode_cabang: string | null;
    is_active: number;
    created_at?: string;
    updated_at?: string;
};

type OptionItem = { code: string; name: string };
// Custom JamKerja option type since master options response has different structure maybe?
// Let's assume master/options returns basic lists.
// Or we can fetch jamkerja list separately.

function MasterJadwalTugasPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<PatrolScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [cabangOptions, setCabangOptions] = useState<OptionItem[]>([]);
    const [deptOptions, setDeptOptions] = useState<OptionItem[]>([]);
    const [jamKerjaOptions, setJamKerjaOptions] = useState<any[]>([]);

    const [filterCabang, setFilterCabang] = useState('');
    const [filterDept, setFilterDept] = useState('');

    // Pagination State (Client-side)
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [formData, setFormData] = useState<{
        kode_jam_kerja: string;
        start_time: string;
        end_time: string;
        kode_dept: string;
        kode_cabang: string;
        is_active: number;
    }>({
        kode_jam_kerja: '',
        start_time: '',
        end_time: '',
        kode_dept: '',
        kode_cabang: '',
        is_active: 1
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

            // Fetch Jam Kerja separately as it might not be in standard options
            const resJK: any = await apiClient.get('/master/jamkerja');
            if (Array.isArray(resJK)) {
                setJamKerjaOptions(resJK);
            }
        } catch (error) {
            console.error("Failed to fetch options", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/master/patrol-schedules?';
            if (filterCabang) url += `kode_cabang=${filterCabang}&`;
            if (filterDept) url += `kode_dept=${filterDept}`;

            const response: any = await apiClient.get(url);
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch jadwal tugas", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOptions();
    }, []);

    useEffect(() => {
        fetchData();
    }, [filterCabang, filterDept]);

    // Filter & Pagination Logic
    const filteredData = useMemo(() => {
        // Just search by jam kerja code or dept/cabang if visible
        return data.filter(item =>
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
            start_time: '08:00',
            end_time: '16:00',
            kode_dept: '',
            kode_cabang: '',
            is_active: 1
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: PatrolScheduleItem) => {
        setErrorMsg('');
        setModalMode('edit');
        setFormData({
            kode_jam_kerja: item.kode_jam_kerja,
            start_time: item.start_time,
            end_time: item.end_time,
            kode_dept: item.kode_dept || '',
            kode_cabang: item.kode_cabang || '',
            is_active: item.is_active
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

        if (!formData.kode_jam_kerja || !formData.start_time || !formData.end_time) {
            setErrorMsg('Harap isi Jam Kerja, Waktu Mulai, dan Waktu Selesai.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Convert empty strings to null for payload if necessary, 
            // but backend Pydantic Optional[str] = None usually handles omitted fields or None.
            // But if we send empty string "", request model might take it as "".
            // API expects Optional[str]. We should send null if empty.

            const payload = {
                ...formData,
                kode_dept: formData.kode_dept === '' ? null : formData.kode_dept,
                kode_cabang: formData.kode_cabang === '' ? null : formData.kode_cabang
            };

            if (modalMode === 'create') {
                await apiClient.post('/master/patrol-schedules', payload);
            } else {
                await apiClient.put(`/master/patrol-schedules/${editingId}`, payload);
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
            text: `Data jadwal ini akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/master/patrol-schedules/${id}`);
            Swal.fire({
                title: 'Terhapus!',
                text: 'Data jadwal berhasil dihapus.',
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

    const getJamKerjaName = (kode: string) => {
        const jk = jamKerjaOptions.find(j => j.kode_jam_kerja === kode);
        return jk ? `${jk.nama_jam_kerja} (${kode})` : kode;
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Data Jadwal Tugas" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                        Daftar Jadwal Tugas
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('jadwal') && (
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
                            placeholder="Cari kode jam kerja..."
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
                        <select
                            value={filterCabang}
                            onChange={(e) => setFilterCabang(e.target.value)}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        >
                            <option value="">Semua Cabang</option>
                            {cabangOptions.map((opt) => (
                                <option key={opt.code} value={opt.code}>{opt.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        >
                            <option value="">Semua Departemen</option>
                            {deptOptions.map((opt) => (
                                <option key={opt.code} value={opt.code}>{opt.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Jam Kerja</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white text-center">Waktu Tugas</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">Cabang/Dept</th>
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
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="font-medium text-black dark:text-white block">
                                                {getJamKerjaName(item.kode_jam_kerja)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1 text-sm font-medium text-black dark:text-white">
                                                <Clock className="w-4 h-4 text-brand-500" />
                                                <span>{item.start_time?.substring(0, 5)} - {item.end_time?.substring(0, 5)}</span>
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
                                        <td className="px-4 py-4 text-center">
                                            {item.is_active ?
                                                <span className="inline-flex rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold">Aktif</span>
                                                : <span className="inline-flex rounded-full bg-gray-100 text-gray-500 px-3 py-1 text-xs font-semibold">Non-Aktif</span>
                                            }
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {canUpdate('jadwal') && (
                                                    <button onClick={() => handleOpenEdit(item)} className="hover:text-yellow-500 text-gray-500 dark:text-gray-400">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                )}
                                                {canDelete('jadwal') && (
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
                                {modalMode === 'create' ? 'Tambah Jadwal Tugas' : 'Edit Jadwal Tugas'}
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
                                    <label className="block text-sm font-semibold text-black dark:text-white mb-2">Pilih Jam Kerja</label>
                                    <select
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                        value={formData.kode_jam_kerja}
                                        onChange={e => setFormData({ ...formData, kode_jam_kerja: e.target.value })}
                                    >
                                        <option value="">Pilih Jam Kerja</option>
                                        {jamKerjaOptions.map(jk => (
                                            <option key={jk.kode_jam_kerja} value={jk.kode_jam_kerja}>
                                                {jk.nama_jam_kerja} ({jk.kode_jam_kerja}) - {jk.jam_masuk?.substring(0, 5)} s/d {jk.jam_pulang?.substring(0, 5)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Waktu Mulai Tugas</label>
                                        <input
                                            type="time"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.start_time}
                                            onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Waktu Selesai Tugas</label>
                                        <input
                                            type="time"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.end_time}
                                            onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Cabang (Opsional)</label>
                                        <select
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.kode_cabang}
                                            onChange={e => setFormData({ ...formData, kode_cabang: e.target.value })}
                                        >
                                            <option value="">Semua Cabang</option>
                                            {cabangOptions.map(opt => (
                                                <option key={opt.code} value={opt.code}>{opt.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Departemen (Opsional)</label>
                                        <select
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.kode_dept}
                                            onChange={e => setFormData({ ...formData, kode_dept: e.target.value })}
                                        >
                                            <option value="">Semua Departemen</option>
                                            {deptOptions.map(opt => (
                                                <option key={opt.code} value={opt.code}>{opt.name}</option>
                                            ))}
                                        </select>
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
export default withPermission(MasterJadwalTugasPage, {
    permissions: ['jadwal.index']
});
