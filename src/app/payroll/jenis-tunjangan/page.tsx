'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';

type JenistunjanganItem = {
    kode_jenis_tunjangan: string;
    jenis_tunjangan: string;
};

function PayrollJenisTunjanganPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<JenistunjanganItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get('/payroll/jenis-tunjangan');
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch jenis tunjangan", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter(item =>
        item.kode_jenis_tunjangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jenis_tunjangan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = () => {
        // ... (keep existing handleCreate logic, but I can't partially edit well with replace_file_content so I will just return the full logic or use multi_replace if I wanted to be surgical, but replacing the whole block is easier for context)
        Swal.fire({
            title: 'Tambah Jenis Tunjangan',
            html: `
                <input id="swal-kode" class="swal2-input" placeholder="Kode Jenis Tunjangan (Max 4)" maxlength="4">
                <input id="swal-jenis" class="swal2-input" placeholder="Jenis Tunjangan">
            `,
            focusConfirm: false,
            preConfirm: () => {
                const kode = (document.getElementById('swal-kode') as HTMLInputElement).value;
                const jenis = (document.getElementById('swal-jenis') as HTMLInputElement).value;
                if (!kode || !jenis) {
                    Swal.showValidationMessage('Kode dan Jenis Tunjangan harus diisi');
                }
                return { kode_jenis_tunjangan: kode, jenis_tunjangan: jenis };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.post('/payroll/jenis-tunjangan', result.value);
                    Swal.fire('Berhasil!', 'Data telah disimpan.', 'success');
                    fetchData();
                } catch (error: any) {
                    Swal.fire('Gagal!', error.response?.data?.detail || 'Gagal menyimpan data.', 'error');
                }
            }
        });
    };

    const handleEdit = (item: JenistunjanganItem) => {
        Swal.fire({
            title: 'Edit Jenis Tunjangan',
            html: `
                <input id="swal-kode" class="swal2-input" placeholder="Kode Jenis Tunjangan" value="${item.kode_jenis_tunjangan}" maxlength="4">
                <input id="swal-jenis" class="swal2-input" placeholder="Jenis Tunjangan" value="${item.jenis_tunjangan}">
            `,
            focusConfirm: false,
            preConfirm: () => {
                const kode = (document.getElementById('swal-kode') as HTMLInputElement).value;
                const jenis = (document.getElementById('swal-jenis') as HTMLInputElement).value;
                if (!kode || !jenis) {
                    Swal.showValidationMessage('Kode dan Jenis Tunjangan harus diisi');
                }
                return { kode_jenis_tunjangan: kode, jenis_tunjangan: jenis };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.put(`/payroll/jenis-tunjangan/${item.kode_jenis_tunjangan}`, result.value);
                    Swal.fire('Berhasil!', 'Data telah diperbarui.', 'success');
                    fetchData();
                } catch (error: any) {
                    Swal.fire('Gagal!', error.response?.data?.detail || 'Gagal memperbarui data.', 'error');
                }
            }
        });
    };

    const handleDelete = (kode: string) => {
        Swal.fire({
            title: 'Hapus Data?',
            text: "Data akan dihapus permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/payroll/jenis-tunjangan/${kode}`);
                    Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
                    fetchData();
                } catch (error) {
                    Swal.fire('Gagal!', 'Gagal menghapus data.', 'error');
                }
            }
        });
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Jenis Tunjangan" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-black dark:text-white mb-1">Daftar Jenis Tunjangan</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Kelola daftar jenis tunjangan yang tersedia
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari Jenis Tunjangan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-transparent py-2 pl-4 pr-10 text-black shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white dark:focus:border-brand-500 sm:w-64"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg
                                    className="h-5 w-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    ></path>
                                </svg>
                            </div>
                        </div>

                        {canCreate('jenistunjangan') && (
                            <button onClick={handleCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm whitespace-nowrap">
                            <Plus className="h-4 w-4" />
                            <span>Tambah Baru</span>
                        </button>
                        )}
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                                <th className="min-w-[150px] px-4 py-4 font-semibold text-gray-900 dark:text-white">Kode</th>
                                <th className="min-w-[200px] px-4 py-4 font-semibold text-gray-900 dark:text-white">Jenis Tunjangan</th>
                                <th className="px-4 py-4 font-semibold text-gray-900 dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                    {searchTerm ? `Tidak ditemukan data untuk "${searchTerm}"` : 'Tidak ada data ditemukan.'}
                                </td></tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.kode_jenis_tunjangan} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20 transition-colors">
                                        <td className="px-4 py-4 text-black dark:text-white font-medium">{item.kode_jenis_tunjangan}</td>
                                        <td className="px-4 py-4 text-black dark:text-white">{item.jenis_tunjangan}</td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button onClick={() => handleEdit(item)} className="hover:text-brand-500 text-gray-500 transition-colors" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {canDelete('jenistunjangan') && (
                                                    <button onClick={() => handleDelete(item.kode_jenis_tunjangan)} className="hover:text-red-500 text-gray-500 transition-colors" title="Hapus">
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
        </MainLayout>
    );
}

// Protect page with permission
export default withPermission(PayrollJenisTunjanganPage, {
    permissions: ['jenistunjangan.index']
});
