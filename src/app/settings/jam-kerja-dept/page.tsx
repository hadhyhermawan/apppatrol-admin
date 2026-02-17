'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Plus, Search, Trash2, Edit, RefreshCw, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';

type JamKerjaDept = {
    kode_jk_dept: string;
    kode_cabang: string;
    kode_dept: string;
    nama_cabang: string;
    nama_dept: string;
};

type JamKerjaOption = {
    kode_jam_kerja: string;
    nama_jam_kerja: string;
    jam_masuk: string;
    jam_pulang: string;
};

type BranchOption = {
    kode_cabang: string;
    nama_cabang: string;
};

type DeptOption = {
    kode_dept: string;
    nama_dept: string;
};


function JamKerjaDeptPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<JamKerjaDept[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchCabang, setSearchCabang] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(10);

    // Modal & Form States
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);

    // Form Data
    const days = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'];
    const [formData, setFormData] = useState<{
        kode_cabang: string;
        kode_dept: string;
        kode_jam_kerja: string[];
    }>({
        kode_cabang: '',
        kode_dept: '',
        kode_jam_kerja: Array(7).fill('')
    });

    // Options
    const [jamKerjaOptions, setJamKerjaOptions] = useState<JamKerjaOption[]>([]);
    const [cabangOptions, setCabangOptions] = useState<BranchOption[]>([]);
    const [deptOptions, setDeptOptions] = useState<DeptOption[]>([]);

    useEffect(() => {
        fetchData();
        fetchOptions();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchCabang) params.append('kode_cabang', searchCabang);
            params.append('page', '1');
            params.append('limit', '1000'); // Get all for client-side filtering

            const res: any = await apiClient.get(`/settings/jam-kerja-dept?${params.toString()}`);
            setData(res.data || []);
        } catch (error) {
            console.error(error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const [jkRes, cabangRes, deptRes] = await Promise.all([
                apiClient.get('/settings/jam-kerja-dept/options/jam-kerja'),
                apiClient.get('/master/cabang/options'),
                apiClient.get('/master/departemen/options')
            ]);
            setJamKerjaOptions(jkRes as any);
            setCabangOptions(cabangRes as any);
            setDeptOptions(deptRes as any);
        } catch (error) {
            console.error("Failed options", error);
        }
    };

    // Filter & Pagination
    const filteredData = useMemo(() => {
        return data.filter(item =>
            item.nama_cabang.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.nama_dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.kode_jk_dept.toLowerCase().includes(searchTerm.toLowerCase())
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
            kode_cabang: '',
            kode_dept: '',
            kode_jam_kerja: Array(7).fill('')
        });
        setShowModal(true);
    };

    const handleEdit = async (id: string) => {
        try {
            const res: any = await apiClient.get(`/settings/jam-kerja-dept/${id}`);
            const details = res.details;

            const codes = days.map(d => details[d] || '');

            setFormData({
                kode_cabang: res.header.kode_cabang,
                kode_dept: res.header.kode_dept,
                kode_jam_kerja: codes
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
            text: "Data jam kerja departemen ini akan dihapus!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/settings/jam-kerja-dept/${id}`);
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
            const payload = {
                ...formData,
                hari: days
            };

            if (isEditing && currentId) {
                await apiClient.put(`/settings/jam-kerja-dept/${currentId}`, payload);
            } else {
                await apiClient.post('/settings/jam-kerja-dept', payload);
            }

            setShowModal(false);
            Swal.fire('Berhasil', 'Data berhasil disimpan', 'success');
            fetchData();
        } catch (error: any) {
            Swal.fire('Gagal', error.response?.data?.detail || 'Gagal menyimpan data', 'error');
        }
    };

    const handleJamKerjaChange = (index: number, val: string) => {
        const newCodes = [...formData.kode_jam_kerja];
        newCodes[index] = val;
        setFormData({ ...formData, kode_jam_kerja: newCodes });
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Jam Kerja Departemen" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <Clock className="w-6 h-6 text-brand-500" />
                        Set Jam Kerja Departemen
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('jamkerjadepartemen') && (
                            <button onClick={handleCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
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
                            placeholder="Cari cabang, departemen, atau kode..."
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
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                            value={searchCabang}
                            onChange={(e) => {
                                setSearchCabang(e.target.value);
                                fetchData();
                            }}
                        >
                            <option value="">Semua Cabang</option>
                            {cabangOptions.map(c => (
                                <option key={c.kode_cabang} value={c.kode_cabang}>{c.nama_cabang}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">Kode</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Cabang</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Departemen</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Tidak ada data.</td></tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.kode_jk_dept} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex rounded-full bg-gray-100 text-gray-800 px-3 py-1 text-xs font-semibold dark:bg-meta-4 dark:text-gray-300">
                                                {item.kode_jk_dept}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <h5 className="font-semibold text-black dark:text-white text-sm">{item.nama_cabang}</h5>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.nama_dept}</p>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(item.kode_jk_dept)} className="hover:text-yellow-500 text-gray-500 dark:text-gray-400" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {canDelete('jamkerjadepartemen') && (
                                                    <button onClick={() => handleDelete(item.kode_jk_dept)} className="hover:text-red-500 text-gray-500 dark:text-gray-400" title="Hapus">
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
                    <div className="relative w-full max-w-4xl rounded-2xl bg-white p-8 shadow-2xl dark:bg-boxdark">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white text-2xl font-bold">✕</button>
                        <h3 className="mb-6 text-2xl font-bold text-black dark:text-white">
                            {isEditing ? 'Edit Jam Kerja Departemen' : 'Tambah Jam Kerja Departemen'}
                        </h3>

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white font-medium">Cabang</label>
                                    <select
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-brand-500 active:border-brand-500 disabled:cursor-default disabled:bg-whiter dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-brand-500"
                                        value={formData.kode_cabang}
                                        onChange={(e) => setFormData({ ...formData, kode_cabang: e.target.value })}
                                        disabled={isEditing}
                                        required
                                    >
                                        <option value="">Pilih Cabang</option>
                                        {cabangOptions.map(c => <option key={c.kode_cabang} value={c.kode_cabang}>{c.nama_cabang}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white font-medium">Departemen</label>
                                    <select
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-brand-500 active:border-brand-500 disabled:cursor-default disabled:bg-whiter dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-brand-500"
                                        value={formData.kode_dept}
                                        onChange={(e) => setFormData({ ...formData, kode_dept: e.target.value })}
                                        disabled={isEditing}
                                        required
                                    >
                                        <option value="">Pilih Departemen</option>
                                        {deptOptions.map(d => <option key={d.kode_dept} value={d.kode_dept}>{d.nama_dept}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="mb-4 text-lg font-semibold text-black dark:text-white border-b border-stroke pb-2 dark:border-strokedark">Atur Jam Kerja Harian</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {days.map((day, idx) => (
                                        <div key={day} className="bg-gray-50 dark:bg-meta-4 p-4 rounded-lg border border-stroke dark:border-strokedark">
                                            <label className="block mb-2 font-medium text-black dark:text-white text-sm">{day}</label>
                                            <select
                                                className="w-full rounded-lg border-[1.5px] border-stroke bg-white py-2 px-3 text-black text-sm focus:border-brand-500 outline-none dark:border-strokedark dark:bg-boxdark dark:text-white"
                                                value={formData.kode_jam_kerja[idx]}
                                                onChange={(e) => handleJamKerjaChange(idx, e.target.value)}
                                            >
                                                <option value="">- Libur -</option>
                                                {jamKerjaOptions.map(jk => (
                                                    <option key={jk.kode_jam_kerja} value={jk.kode_jam_kerja}>
                                                        {jk.nama_jam_kerja} ({jk.jam_masuk}-{jk.jam_pulang})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
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
export default withPermission(JamKerjaDeptPage, {
    permissions: ['jamkerjadepartemen.index']
});
