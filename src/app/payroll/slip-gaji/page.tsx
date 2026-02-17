'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Plus, Edit, Trash2, Search, FileText, CheckCircle, XCircle } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';

type SlipGajiItem = {
    kode_slip_gaji: string;
    bulan: number;
    tahun: string;
    status: number;
    created_at: string;
    updated_at: string;
};

function PayrollSlipGajiPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<SlipGajiItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get('/payroll/slip-gaji');
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch slip gaji", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = () => {
        Swal.fire({
            title: 'Generate Slip Gaji',
            html: `
                <div class="flex flex-col gap-3 text-left">
                    <div>
                        <label class="text-sm font-medium mb-1 block">Bulan</label>
                        <select id="swal-bulan" class="swal2-select w-full m-0 text-base">
                            ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${i + 1 === new Date().getMonth() + 1 ? 'selected' : ''}>${new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="text-sm font-medium mb-1 block">Tahun</label>
                        <input id="swal-tahun" type="number" class="swal2-input w-full m-0" value="${new Date().getFullYear()}">
                    </div>
                    <div>
                        <label class="text-sm font-medium mb-1 block">Status</label>
                         <select id="swal-status" class="swal2-select w-full m-0 text-base">
                            <option value="0">Draft</option>
                            <option value="1">Publish</option>
                        </select>
                    </div>
                </div>
            `,
            width: '400px',
            focusConfirm: false,
            preConfirm: () => {
                const bulan = (document.getElementById('swal-bulan') as HTMLSelectElement).value;
                const tahun = (document.getElementById('swal-tahun') as HTMLInputElement).value;
                const status = (document.getElementById('swal-status') as HTMLSelectElement).value;

                if (!bulan || !tahun) {
                    Swal.showValidationMessage('Semua field harus diisi');
                }
                return { bulan: parseInt(bulan), tahun: parseInt(tahun), status: parseInt(status) };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.post('/payroll/slip-gaji', result.value);
                    Swal.fire('Berhasil!', 'Data telah disimpan.', 'success');
                    fetchData();
                } catch (error: any) {
                    Swal.fire('Gagal!', error.response?.data?.detail || 'Gagal menyimpan data.', 'error');
                }
            }
        });
    };

    const handleEdit = (item: SlipGajiItem) => {
        Swal.fire({
            title: 'Edit Slip Gaji',
            html: `
                <div class="flex flex-col gap-3 text-left">
                     <div>
                        <label class="text-sm font-medium mb-1 block">Bulan</label>
                        <select id="swal-bulan" class="swal2-select w-full m-0 text-base">
                            ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${i + 1 === item.bulan ? 'selected' : ''}>${new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="text-sm font-medium mb-1 block">Tahun</label>
                        <input id="swal-tahun" type="number" class="swal2-input w-full m-0" value="${item.tahun}">
                    </div>
                    <div>
                         <label class="text-sm font-medium mb-1 block">Status</label>
                         <select id="swal-status" class="swal2-select w-full m-0 text-base">
                            <option value="0" ${item.status === 0 ? 'selected' : ''}>Draft</option>
                            <option value="1" ${item.status === 1 ? 'selected' : ''}>Publish</option>
                        </select>
                    </div>
                </div>
            `,
            width: '400px',
            focusConfirm: false,
            preConfirm: () => {
                const bulan = (document.getElementById('swal-bulan') as HTMLSelectElement).value;
                const tahun = (document.getElementById('swal-tahun') as HTMLInputElement).value;
                const status = (document.getElementById('swal-status') as HTMLSelectElement).value;

                if (!bulan || !tahun) {
                    Swal.showValidationMessage('Semua field harus diisi');
                }
                return { bulan: parseInt(bulan), tahun: parseInt(tahun), status: parseInt(status) };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.put(`/payroll/slip-gaji/${item.kode_slip_gaji}`, result.value);
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
                    await apiClient.delete(`/payroll/slip-gaji/${kode}`);
                    Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
                    fetchData();
                } catch (error) {
                    Swal.fire('Gagal!', 'Gagal menghapus data.', 'error');
                }
            }
        });
    };

    const getMonthName = (month: number) => {
        return new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' });
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Slip Gaji" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-brand-500" />
                        Daftar Slip Gaji
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={fetchData} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('slipgaji') && (
                            <button onClick={handleCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                            <Plus className="h-4 w-4" />
                            <span>Generate Slip Gaji</span>
                        </button>
                        )}
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Kode</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Bulan</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Tahun</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan.</td></tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.kode_slip_gaji} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-black dark:text-white font-mono">
                                            {item.kode_slip_gaji}
                                        </td>
                                        <td className="px-4 py-4 text-black dark:text-white">
                                            {getMonthName(item.bulan)}
                                        </td>
                                        <td className="px-4 py-4 text-black dark:text-white">
                                            {item.tahun}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {item.status === 1 ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Publish
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                    <XCircle className="h-3 w-3" />
                                                    Draft
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link href={`/payroll/slip-gaji/${item.kode_slip_gaji}`} className="hover:text-blue-500 text-gray-500 transition-colors" title="Lihat">
                                                    <FileText className="h-4 w-4" />
                                                </Link>
                                                <button onClick={() => handleEdit(item)} className="hover:text-brand-500 text-gray-500 transition-colors" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {canDelete('slipgaji') && (
                                                    <button onClick={() => handleDelete(item.kode_slip_gaji)} className="hover:text-red-500 text-gray-500 transition-colors" title="Hapus">
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
export default withPermission(PayrollSlipGajiPage, {
    permissions: ['slipgaji.index']
});
