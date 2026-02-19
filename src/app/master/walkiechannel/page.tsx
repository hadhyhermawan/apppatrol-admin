'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import MultiSelect from '@/components/form/MultiSelect';

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

type MultiSelectOption = {
    value: string;
    text: string;
    selected: boolean;
};

function WalkieChannelPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
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

    const [cabangOptions, setCabangOptions] = useState<MultiSelectOption[]>([]);
    const [deptOptions, setDeptOptions] = useState<MultiSelectOption[]>([]);

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
            setCabangOptions(cabangs.map((c: any) => ({ value: c.kode_cabang, text: c.nama_cabang, selected: false })));

            const depts: any = await apiClient.get('/master/walkiechannel/options/departemen');
            setDeptOptions(depts.map((d: any) => ({ value: d.kode_dept, text: d.nama_dept, selected: false })));
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

        // Validation
        if (formData.cabang_members.length === 0) {
            Swal.fire('Validasi Gagal', 'Harap pilih minimal satu cabang member.', 'warning');
            return;
        }

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
                                className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 text-black outline-none focus:border-brand-500 focus-visible:shadow-none dark:border-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {canCreate('walkiechannel') && (
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition lg:px-8 xl:px-10"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Channel
                        </button>
                    )}
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
                                            <div className="text-xs text-text opacity-70">Members: {item.cabang_members.length} Cabang</div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${item.auto_join ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                {item.auto_join ? 'Yes' : 'No'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">{item.priority}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${item.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                {item.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(item)} className="text-brand-500 hover:text-brand-600 transition" title="Edit">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                {canDelete('walkiechannel') && (
                                                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600 transition" title="Hapus">
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
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-boxdark max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-black dark:text-white">
                                {editingItem ? 'Edit Channel' : 'Tambah Channel'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-black dark:hover:text-white text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Kode Channel (ID)</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-brand-500 dark:border-strokedark dark:bg-form-input"
                                        value={formData.code}
                                        onChange={(e) => {
                                            // Enforce Uppercase and allowed chars only (A-Z, 0-9, _)
                                            const val = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
                                            setFormData({ ...formData, code: val });
                                        }}
                                        placeholder="EX: REGIONAL_1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Hanya huruf besar, angka, dan underscore.</p>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Nama Channel</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-brand-500 dark:border-strokedark dark:bg-form-input"
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
                                        className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-brand-500 dark:border-strokedark dark:bg-form-input"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Auto Join?</label>
                                    <select
                                        className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-brand-500 dark:border-strokedark dark:bg-form-input"
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
                                        className="w-full rounded border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-brand-500 dark:border-strokedark dark:bg-form-input"
                                        value={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: parseInt(e.target.value) })}
                                    >
                                        <option value={1}>Active</option>
                                        <option value={0}>Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {/* Cabang & Dept Selection using MultiSelect */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="mb-2 block text-sm font-medium text-black dark:text-white">Cabang Members <span className="text-red-500">*</span></div>
                                    <MultiSelect
                                        label=""
                                        options={cabangOptions}
                                        defaultSelected={formData.cabang_members}
                                        onChange={(selected: string[]) => setFormData({ ...formData, cabang_members: selected })}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Wajib pilih minimal satu cabang.</p>
                                </div>
                                <div>
                                    <div className="mb-2 block text-sm font-medium text-black dark:text-white">Departemen Allowed</div>
                                    <MultiSelect
                                        label=""
                                        options={deptOptions}
                                        defaultSelected={formData.dept_members}
                                        onChange={(selected: string[]) => setFormData({ ...formData, dept_members: selected })}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Opsional (Kosong = Semua Dept).</p>
                                </div>
                            </div>

                            <div className="sticky bottom-0 z-30 -mx-6 -mb-6 flex justify-end gap-3 border-t border-stroke bg-white px-6 py-4 dark:border-strokedark dark:bg-boxdark">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded border border-stroke px-6 py-2.5 text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4 font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="rounded bg-brand-500 px-6 py-2.5 text-white hover:bg-opacity-90 font-medium shadow-sm"
                                >
                                    Simpan Channel
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
export default withPermission(WalkieChannelPage, {
    permissions: ['walkiechannel.index']
});
