'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import SearchableSelect from '@/components/form/SearchableSelect';
import { usePermissions } from '@/contexts/PermissionContext';
import { Plus, Search, Trash, Eye, Users, CheckCircle, RefreshCw, Loader2, Info } from 'lucide-react';

interface Team {
    id: number;
    name: string;
    kode_cabang: string;
    nama_cabang: string;
    description: string;
    total_members: number;
}

import { withPermission } from '@/hoc/withPermission';

function ManagementReguPage() {
    const router = useRouter();
    const { canCreate, canDelete, isSuperAdmin } = usePermissions();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [cabangOptions, setCabangOptions] = useState<{ code: string, name: string }[]>([]);
    const [filterCabang, setFilterCabang] = useState('');
    const [vendorOptions, setVendorOptions] = useState<{ value: string, label: string }[]>([]);
    const [filterVendor, setFilterVendor] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ name: '', kode_cabang: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchCabang = async () => {
            try {
                let url = '/master/options';
                if (isSuperAdmin && filterVendor) {
                    url += `?vendor_id=${filterVendor}`;
                }
                const res: any = await apiClient.get(url);
                setCabangOptions(res?.cabang || []);
                // Reset cabang if branch list changed
                setFilterCabang('');
            } catch (e) { }
        };
        fetchCabang();

        const fetchVendors = async () => {
            if (isSuperAdmin) {
                try {
                    const res: any = await apiClient.get('/vendors');
                    const vData = Array.isArray(res) ? res : (res?.data || []);
                    setVendorOptions(vData.map((v: any) => ({ value: String(v.id), label: v.nama_vendor })));
                } catch (error) { }
            }
        };
        fetchVendors();
        fetchTeams(filterCabang, filterVendor);
    }, [isSuperAdmin, filterVendor]);

    const fetchTeams = async (cabang = filterCabang, vendor = filterVendor) => {
        setLoading(true);
        try {
            let url = '/master/teams';
            const params = [];
            if (cabang) params.push(`cabang=${cabang}`);
            if (vendor && isSuperAdmin) params.push(`vendor_id=${vendor}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            const res: any = await apiClient.get(url);
            setTeams(Array.isArray(res) ? res : []);
        } catch (e) {
            setTeams([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterCabang = (v: string) => {
        setFilterCabang(v);
        fetchTeams(v);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiClient.post('/master/teams', form);
            setIsModalOpen(false);
            setForm({ name: '', kode_cabang: '', description: '' });
            fetchTeams(filterCabang);
            Swal.fire({ icon: 'success', title: 'Regu berhasil dibuat', timer: 1500, showConfirmButton: false });
        } catch (err: any) {
            Swal.fire('Error', err?.response?.data?.detail || 'Gagal menyimpan', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        const res = await Swal.fire({
            title: 'Hapus Regu?',
            html: `Apakah Anda yakin ingin menghapus regu <b>${name}</b> beserta jadwal anggotanya?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus'
        });

        if (res.isConfirmed) {
            try {
                await apiClient.delete(`/master/teams/${id}`);
                fetchTeams(filterCabang);
                Swal.fire({ icon: 'success', title: 'Terhapus', timer: 1500, showConfirmButton: false });
            } catch (err: any) {
                Swal.fire('Error', err?.response?.data?.detail || 'Gagal menghapus', 'error');
            }
        }
    };

    const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Management Regu & Penjadwalan" />

            {/* Banner */}
            <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800/40 dark:bg-blue-900/10 p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                    <span className="font-semibold">Management Regu / Tim</span> memungkinkan Anda membuat pengelompokan karyawan berbasis cabang.
                    Anda bisa men-*assign* banyak karyawan sekaligus, lalu meng-generate jadwal shift mereka secara massal dalam satu klik (Auto Scheduling).
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-black dark:text-white">Daftar Regu / Tim</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{filteredTeams.length} regu ditemukan</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => fetchTeams(filterCabang)} className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white shadow-sm transition">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                        {canCreate('jadwal') && (
                            <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-opacity-90 transition">
                                <Plus className="w-4 h-4" /> Buat Regu Baru
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative col-span-1 md:col-span-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <input type="text" placeholder="Cari nama regu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition" />
                    </div>
                    {isSuperAdmin && (
                        <div>
                            <SearchableSelect
                                options={[{ value: '', label: 'Semua Vendor' }, ...vendorOptions]}
                                value={filterVendor}
                                onChange={val => setFilterVendor(val)}
                                placeholder="Pilih Vendor"
                            />
                        </div>
                    )}
                    <div>
                        <SearchableSelect
                            options={[{ value: '', label: 'Semua Cabang' }, ...cabangOptions.map(c => ({ value: c.code, label: c.name }))]}
                            value={filterCabang}
                            onChange={handleFilterCabang}
                            placeholder="Filter Cabang"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
                ) : filteredTeams.length === 0 ? (
                    <div className="py-20 text-center text-gray-400">Belum ada data regu.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTeams.map((team) => (
                            <div key={team.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{team.name}</h3>
                                        <span className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-1 rounded mt-1 inline-block">
                                            Cabang: {team.nama_cabang || team.kode_cabang}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-full h-10 w-10 flex items-center justify-center font-bold text-gray-500 select-none">
                                        <Users className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 mb-4 h-10 overflow-hidden text-ellipsis line-clamp-2">
                                    {team.description || <span className="italic text-gray-300">Tidak ada deskripsi</span>}
                                </p>

                                <div className="flex border-t border-gray-100 dark:border-gray-700 pt-4 items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        {team.total_members} Anggota
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={() => router.push(`/master/regu/${team.id}`)} className="text-brand-500 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:hover:bg-brand-500/20 px-3 py-1.5 rounded text-sm font-medium transition">
                                            Kelola
                                        </button>
                                        {canDelete('jadwal') && (
                                            <button onClick={() => handleDelete(team.id, team.name)} className="text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-1.5 rounded text-sm font-medium transition">
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Tambah Regu */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Buat Regu Baru</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium block mb-1">Nama Regu <span className="text-red-500">*</span></label>
                                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border p-2 rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-500" placeholder="Contoh: Regu A / Shift 1" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Cabang Tertaut <span className="text-red-500">*</span></label>
                                    <SearchableSelect
                                        options={cabangOptions.map(c => ({ value: c.code, label: c.name }))}
                                        value={form.kode_cabang}
                                        onChange={v => setForm({ ...form, kode_cabang: v })}
                                        placeholder="Pilih Cabang..."
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Penting: Anggota yang bisa dimasukkan nanti hanya karyawan dari cabang ini.</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Deskripsi (Opsional)</label>
                                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border p-2 rounded-lg bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-brand-500" rows={3}></textarea>
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3 justify-end">
                                <button type="button" disabled={submitting} onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition font-medium">Batal</button>
                                <button type="submit" disabled={submitting || !form.name || !form.kode_cabang} className="px-5 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition font-medium flex items-center gap-2">
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Regu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

export default withPermission(ManagementReguPage, { permissions: ['teams.index'] });
