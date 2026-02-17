'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';

type WalkieChannel = {
    id: number;
    code: string;
    name: string;
    rule_type: string;
    rule_value: string;
    active: number;
    auto_join: number;
    priority: number;
    dept_members: string[];
    cabang_members: string[];
};

type Option = {
    value: string;
    label: string;
};

export default function WalkieChannelPage() {
    const [data, setData] = useState<WalkieChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<WalkieChannel | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        active: 1,
        auto_join: 1,
        priority: 100,
        cabang_members: [] as string[],
        dept_members: [] as string[]
    });

    const [cabangOptions, setCabangOptions] = useState<Option[]>([]);
    const [deptOptions, setDeptOptions] = useState<Option[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get('/master/walkiechannel', {
                params: { search: searchTerm }
            });
            setData(response.data || []);
        } catch (error) {
            console.error("Failed to fetch channels", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const cabangs: any = await apiClient.get('/master/walkiechannel/options/cabang');
            setCabangOptions(cabangs.map((c: any) => ({ value: c.kode_cabang, label: c.nama_cabang })));

            const depts: any = await apiClient.get('/master/walkiechannel/options/departemen');
            setDeptOptions(depts.map((d: any) => ({ value: d.kode_dept, label: d.nama_dept })));
        } catch (error) {
            console.error("Failed to fetch options", error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchOptions();
    }, [searchTerm]);

    const handleCreate = () => {
        setEditingItem(null);
        setFormData({
            code: '',
            name: '',
            active: 1,
            auto_join: 1,
            priority: 100,
            cabang_members: [],
            dept_members: []
        });
        setIsModalOpen(true);
    };

    const handleEdit = (item: WalkieChannel) => {
        setEditingItem(item);
        setFormData({
            code: item.code,
            name: item.name,
            active: item.active,
            auto_join: item.auto_join,
            priority: item.priority,
            cabang_members: item.cabang_members,
            dept_members: item.dept_members
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        Swal.fire({
            title: 'Hapus Channel?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/master/walkiechannel/${id}`);
                    Swal.fire('Terhapus!', 'Channel berhasil dihapus.', 'success');
                    fetchData();
                } catch (error: any) {
                    Swal.fire('Gagal!', error.response?.data?.detail || 'Gagal menghapus channel.', 'error');
                }
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await apiClient.put(`/master/walkiechannel/${editingItem.id}`, formData);
                Swal.fire('Berhasil!', 'Channel berhasil diperbarui.', 'success');
            } else {
                await apiClient.post('/master/walkiechannel', formData);
                Swal.fire('Berhasil!', 'Channel berhasil ditambahkan.', 'success');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            Swal.fire('Gagal!', error.response?.data?.detail || 'Gagal menyimpan data.', 'error');
        }
    };

    const toggleSelection = (list: string[], item: string) => {
        if (list.includes(item)) {
            return list.filter(i => i !== item);
        } else {
            return [...list, item];
        }
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Master Walkie Channel" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 gap-4 max-w-md">
                        <div className="relative w-full">
                            <button className="absolute left-0 top-1/2 -translate-y-1/2 pl-3">
                                <Search className="h-4 w-4 text-gray-500" />
                            </button>
                            <input
                                type="text"
                                placeholder="Cari channel..."
                                className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition lg:px-8 xl:px-10"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Channel
                    </button>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Kode</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Nama Channel</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Auto Join</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Priority</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Tidak ada data.</td></tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-black dark:text-white font-mono">{item.code}</td>
                                        <td className="px-4 py-4 text-black dark:text-white">
                                            <div className="font-bold">{item.name}</div>
                                            <div className="text-xs text-gray-500">Members: {item.cabang_members.length} Cabang</div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${item.auto_join ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'}`}>
                                                {item.auto_join ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">{item.priority}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${item.active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                {item.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(item)} className="text-primary hover:text-primary/80 transition" title="Edit">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="text-danger hover:text-danger/80 transition" title="Hapus">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manual Modal Implementation */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg dark:bg-boxdark max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-black dark:text-white">
                                {editingItem ? 'Edit Channel' : 'Tambah Channel'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-black dark:hover:text-white text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Kode Channel</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                                        placeholder="EX: REGIONAL_1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Hanya huruf besar dan underscore.</p>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Nama Channel</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Regional Jawa Timur"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Priority</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Auto Join?</label>
                                    <select
                                        className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input"
                                        value={formData.auto_join}
                                        onChange={(e) => setFormData({ ...formData, auto_join: parseInt(e.target.value) })}
                                    >
                                        <option value={1}>Yes</option>
                                        <option value={0}>No</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Status</label>
                                    <select
                                        className="w-full rounded border border-stroke bg-transparent px-4 py-2 outline-none transition focus:border-primary dark:border-strokedark dark:bg-form-input"
                                        value={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: parseInt(e.target.value) })}
                                    >
                                        <option value={1}>Active</option>
                                        <option value={0}>Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {/* Cabang & Dept Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Cabang Members (Wajib)</label>
                                    <div className="h-48 overflow-y-auto border border-stroke rounded p-2 dark:border-strokedark bg-gray-50 dark:bg-meta-4/10">
                                        {cabangOptions.map(opt => (
                                            <div key={opt.value} className="flex items-start gap-2 mb-1 p-1 hover:bg-gray-200 dark:hover:bg-meta-4 rounded cursor-pointer" onClick={() => setFormData({ ...formData, cabang_members: toggleSelection(formData.cabang_members, opt.value) })}>
                                                <input
                                                    type="checkbox"
                                                    id={`cabang-${opt.value}`}
                                                    checked={formData.cabang_members.includes(opt.value)}
                                                    readOnly
                                                    className="mt-1"
                                                />
                                                <label htmlFor={`cabang-${opt.value}`} className="text-sm cursor-pointer select-none flex-1">{opt.label}</label>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Minimal pilih 1 cabang.</p>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Departemen (Opsional)</label>
                                    <div className="h-48 overflow-y-auto border border-stroke rounded p-2 dark:border-strokedark bg-gray-50 dark:bg-meta-4/10">
                                        {deptOptions.map(opt => (
                                            <div key={opt.value} className="flex items-start gap-2 mb-1 p-1 hover:bg-gray-200 dark:hover:bg-meta-4 rounded cursor-pointer" onClick={() => setFormData({ ...formData, dept_members: toggleSelection(formData.dept_members, opt.value) })}>
                                                <input
                                                    type="checkbox"
                                                    id={`dept-${opt.value}`}
                                                    checked={formData.dept_members.includes(opt.value)}
                                                    readOnly
                                                    className="mt-1"
                                                />
                                                <label htmlFor={`dept-${opt.value}`} className="text-sm cursor-pointer select-none flex-1">{opt.label}</label>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Kosongkan jika untuk semua dept.</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-stroke dark:border-strokedark">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded border border-stroke px-6 py-2 text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="rounded bg-primary px-6 py-2 text-white hover:bg-opacity-90"
                                >
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
