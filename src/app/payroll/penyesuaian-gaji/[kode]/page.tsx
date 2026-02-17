'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Plus, Edit, Trash2, ArrowLeft, UserPlus, Save, X } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

type DetailItem = {
    kode_penyesuaian_gaji: string;
    nik: string;
    nama_karyawan: string | null;
    penambah: number;
    pengurang: number;
    keterangan: string;
    created_at: string;
    updated_at: string;
};

type HeaderInfo = {
    kode_penyesuaian_gaji: string;
    bulan: number;
    tahun: number;
};

type EmployeeOption = {
    nik: string;
    nama_karyawan: string;
};

export default function DetailPenyesuaianGajiPage() {
    const params = useParams();
    const router = useRouter();
    const kode = params.kode as string;

    const [header, setHeader] = useState<HeaderInfo | null>(null);
    const [details, setDetails] = useState<DetailItem[]>([]);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHeader = async () => {
        try {
            const response: any = await apiClient.get(`/payroll/penyesuaian-gaji/${kode}`);
            setHeader(response);
        } catch (error) {
            console.error("Failed to fetch header", error);
            Swal.fire('Error', 'Data periode tidak ditemukan', 'error').then(() => router.back());
        }
    };

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get(`/payroll/penyesuaian-gaji/${kode}/details`);
            if (Array.isArray(response)) {
                setDetails(response);
            } else {
                setDetails([]);
            }
        } catch (error) {
            console.error("Failed to fetch details", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response: any = await apiClient.get('/payroll/employees-list');
            if (Array.isArray(response)) {
                setEmployees(response);
            }
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    useEffect(() => {
        if (kode) {
            fetchHeader();
            fetchDetails();
            fetchEmployees();
        }
    }, [kode]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const getMonthName = (month: number) => {
        return new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' });
    };

    const handleAdd = () => {
        const employeeOptions = employees.map(e => `<option value="${e.nik}">${e.nama_karyawan} (${e.nik})</option>`).join('');

        Swal.fire({
            title: 'Tambah Data Karyawan',
            html: `
                <div class="flex flex-col gap-3 text-left">
                    <div>
                        <label class="text-sm font-medium mb-1 block">Karyawan</label>
                        <select id="swal-nik" class="swal2-select w-full m-0 text-base">
                            <option value="">Pilih Karyawan</option>
                            ${employeeOptions}
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-sm font-medium mb-1 block">Penambah (Rp)</label>
                            <input id="swal-penambah" type="number" class="swal2-input w-full m-0" value="0">
                        </div>
                        <div>
                            <label class="text-sm font-medium mb-1 block">Pengurang (Rp)</label>
                            <input id="swal-pengurang" type="number" class="swal2-input w-full m-0" value="0">
                        </div>
                    </div>
                    <div>
                        <label class="text-sm font-medium mb-1 block">Keterangan</label>
                        <textarea id="swal-keterangan" class="swal2-textarea w-full m-0" placeholder="Keterangan penyesuaian"></textarea>
                    </div>
                </div>
            `,
            width: '600px',
            focusConfirm: false,
            preConfirm: () => {
                const nik = (document.getElementById('swal-nik') as HTMLSelectElement).value;
                const penambah = (document.getElementById('swal-penambah') as HTMLInputElement).value;
                const pengurang = (document.getElementById('swal-pengurang') as HTMLInputElement).value;
                const keterangan = (document.getElementById('swal-keterangan') as HTMLTextAreaElement).value;

                if (!nik) {
                    Swal.showValidationMessage('Karyawan harus dipilih');
                }
                if (!keterangan) {
                    Swal.showValidationMessage('Keterangan harus diisi');
                }

                return {
                    nik,
                    penambah: parseInt(penambah) || 0,
                    pengurang: parseInt(pengurang) || 0,
                    keterangan
                };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.post(`/payroll/penyesuaian-gaji/${kode}/details`, result.value);
                    Swal.fire('Berhasil!', 'Data karyawan ditambahkan.', 'success');
                    fetchDetails();
                } catch (error: any) {
                    Swal.fire('Gagal!', error.response?.data?.detail || 'Gagal menyimpan data.', 'error');
                }
            }
        });
    };

    const handleEdit = (item: DetailItem) => {
        Swal.fire({
            title: 'Edit Data Karyawan',
            html: `
                <div class="flex flex-col gap-3 text-left">
                    <div class="p-3 bg-gray-100 rounded-lg">
                        <p class="text-sm text-gray-500">Karyawan</p>
                        <p class="font-semibold">${item.nama_karyawan} (${item.nik})</p>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-sm font-medium mb-1 block">Penambah (Rp)</label>
                            <input id="swal-penambah" type="number" class="swal2-input w-full m-0" value="${item.penambah}">
                        </div>
                        <div>
                            <label class="text-sm font-medium mb-1 block">Pengurang (Rp)</label>
                            <input id="swal-pengurang" type="number" class="swal2-input w-full m-0" value="${item.pengurang}">
                        </div>
                    </div>
                    <div>
                        <label class="text-sm font-medium mb-1 block">Keterangan</label>
                        <textarea id="swal-keterangan" class="swal2-textarea w-full m-0">${item.keterangan}</textarea>
                    </div>
                </div>
            `,
            width: '500px',
            focusConfirm: false,
            preConfirm: () => {
                const penambah = (document.getElementById('swal-penambah') as HTMLInputElement).value;
                const pengurang = (document.getElementById('swal-pengurang') as HTMLInputElement).value;
                const keterangan = (document.getElementById('swal-keterangan') as HTMLTextAreaElement).value;
                if (!keterangan) {
                    Swal.showValidationMessage('Keterangan harus diisi');
                }
                return {
                    penambah: parseInt(penambah) || 0,
                    pengurang: parseInt(pengurang) || 0,
                    keterangan
                };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.put(`/payroll/penyesuaian-gaji/${kode}/details/${item.nik}`, result.value);
                    Swal.fire('Berhasil!', 'Data karyawan updated.', 'success');
                    fetchDetails();
                } catch (error: any) {
                    Swal.fire('Gagal!', error.response?.data?.detail || 'Gagal update data.', 'error');
                }
            }
        });
    };

    const handleDelete = (nik: string) => {
        Swal.fire({
            title: 'Hapus Karyawan?',
            text: "Data penyesuaian untuk karyawan ini akan dihapus!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.delete(`/payroll/penyesuaian-gaji/${kode}/details/${nik}`);
                    Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
                    fetchDetails();
                } catch (error) {
                    Swal.fire('Gagal!', 'Gagal menghapus data.', 'error');
                }
            }
        });
    };

    if (!header) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Detail Penyesuaian Gaji" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">

                {/* Header Information */}
                <div className="mb-6 border-b border-gray-200 pb-4 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Link href="/payroll/penyesuaian-gaji" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                                <ArrowLeft className="w-5 h-5 text-gray-500" />
                            </Link>
                            <div>
                                <h2 className="text-xl font-bold text-black dark:text-white">
                                    {getMonthName(header.bulan)} {header.tahun}
                                </h2>
                                <p className="text-sm text-gray-500 font-mono">{header.kode_penyesuaian_gaji}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={fetchDetails} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button onClick={handleAdd} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                            <UserPlus className="h-4 w-4" />
                            <span>Tambah Karyawan</span>
                        </button>
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="px-4 py-4 font-medium text-black dark:text-white">NIK</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Nama Karyawan</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-right text-green-600">Penambah</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-right text-red-600">Pengurang</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Keterangan</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : details.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Belum ada data karyawan di periode ini.</td></tr>
                            ) : (
                                details.map((item) => (
                                    <tr key={item.nik} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-black dark:text-white font-mono text-xs">
                                            {item.nik}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-black dark:text-white">
                                            {item.nama_karyawan}
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium text-green-600">
                                            {formatCurrency(item.penambah)}
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium text-red-600">
                                            {formatCurrency(item.pengurang)}
                                        </td>
                                        <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                                            {item.keterangan}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(item)} className="hover:text-brand-500 text-gray-500 transition-colors" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item.nik)} className="hover:text-red-500 text-gray-500 transition-colors" title="Hapus">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {details.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 font-semibold text-black dark:text-white">
                                    <td colSpan={2} className="px-4 py-4 text-right">Total:</td>
                                    <td className="px-4 py-4 text-right text-green-600">
                                        {formatCurrency(details.reduce((sum, item) => sum + item.penambah, 0))}
                                    </td>
                                    <td className="px-4 py-4 text-right text-red-600">
                                        {formatCurrency(details.reduce((sum, item) => sum + item.pengurang, 0))}
                                    </td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </MainLayout>
    );
}
