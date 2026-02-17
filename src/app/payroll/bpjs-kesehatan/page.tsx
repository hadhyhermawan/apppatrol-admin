'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Plus, Edit, Trash2, Search, Activity } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

type BpjsKesehatanItem = {
    kode_bpjs_kesehatan: string;
    nik: string;
    nama_karyawan: string | null;
    kode_dept: string | null;
    kode_cabang: string | null;
    jumlah: number;
    tanggal_berlaku: string;
    created_at: string;
};

type EmployeeOption = {
    nik: string;
    nama_karyawan: string;
};

export default function PayrollBpjsKesehatanPage() {
    const [data, setData] = useState<BpjsKesehatanItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);

    // Filters
    const [keyword, setKeyword] = useState('');
    const [kodeCabang, setKodeCabang] = useState('');
    const [kodeDept, setKodeDept] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);
            if (kodeCabang) params.append('kode_cabang', kodeCabang);
            if (kodeDept) params.append('kode_dept', kodeDept);
            params.append('limit', '50');

            const response: any = await apiClient.get(`/payroll/bpjs-kesehatan?${params.toString()}`);
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch bpjs kesehatan", error);
            setData([]);
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
        fetchData();
        fetchEmployees();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const handleCreate = () => {
        const employeeOptions = employees.map(e => `<option value="${e.nik}">${e.nama_karyawan} (${e.nik})</option>`).join('');

        Swal.fire({
            title: 'Tambah BPJS Kesehatan',
            html: `
                <div class="flex flex-col gap-3 text-left">
                    <div>
                        <label class="text-sm font-medium mb-1 block">Karyawan</label>
                        <select id="swal-nik" class="swal2-select w-full m-0 text-base">
                            <option value="">Pilih Karyawan</option>
                            ${employeeOptions}
                        </select>
                    </div>
                    <div>
                        <label class="text-sm font-medium mb-1 block">Jumlah Iuran</label>
                        <input id="swal-jumlah" type="number" class="swal2-input w-full m-0" placeholder="Rp 0">
                    </div>
                    <div>
                        <label class="text-sm font-medium mb-1 block">Tanggal Berlaku</label>
                        <input id="swal-tanggal" class="swal2-input w-full m-0 flatpickr-date" placeholder="YYYY-MM-DD">
                    </div>
                </div>
            `,
            width: '600px',
            focusConfirm: false,
            didOpen: () => {
                flatpickr("#swal-tanggal", {
                    dateFormat: "Y-m-d",
                    allowInput: true,
                    defaultDate: new Date()
                });
            },
            preConfirm: () => {
                const nik = (document.getElementById('swal-nik') as HTMLSelectElement).value;
                const jumlah = (document.getElementById('swal-jumlah') as HTMLInputElement).value;
                const tanggal = (document.getElementById('swal-tanggal') as HTMLInputElement).value;

                if (!nik || !jumlah || !tanggal) {
                    Swal.showValidationMessage('Semua field harus diisi');
                }
                return { nik, jumlah: parseInt(jumlah), tanggal_berlaku: tanggal };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.post('/payroll/bpjs-kesehatan', result.value);
                    Swal.fire('Berhasil!', 'Data telah disimpan.', 'success');
                    fetchData();
                } catch (error: any) {
                    Swal.fire('Gagal!', error.response?.data?.detail || 'Gagal menyimpan data.', 'error');
                }
            }
        });
    };

    const handleEdit = (item: BpjsKesehatanItem) => {
        Swal.fire({
            title: 'Edit BPJS Kesehatan',
            html: `
                <div class="flex flex-col gap-3 text-left">
                    <div class="p-3 bg-gray-100 rounded-lg">
                        <p class="text-sm text-gray-500">Karyawan</p>
                        <p class="font-semibold">${item.nama_karyawan} (${item.nik})</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium mb-1 block">Jumlah Iuran</label>
                        <input id="swal-jumlah" type="number" class="swal2-input w-full m-0" placeholder="Rp 0" value="${item.jumlah}">
                    </div>
                    <div>
                        <label class="text-sm font-medium mb-1 block">Tanggal Berlaku</label>
                        <input id="swal-tanggal" class="swal2-input w-full m-0 flatpickr-date" placeholder="YYYY-MM-DD" value="${item.tanggal_berlaku}">
                    </div>
                </div>
            `,
            width: '500px',
            focusConfirm: false,
            didOpen: () => {
                flatpickr("#swal-tanggal", {
                    dateFormat: "Y-m-d",
                    allowInput: true
                });
            },
            preConfirm: () => {
                const jumlah = (document.getElementById('swal-jumlah') as HTMLInputElement).value;
                const tanggal = (document.getElementById('swal-tanggal') as HTMLInputElement).value;

                if (!jumlah || !tanggal) {
                    Swal.showValidationMessage('Semua field harus diisi');
                }
                return { jumlah: parseInt(jumlah), tanggal_berlaku: tanggal };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.put(`/payroll/bpjs-kesehatan/${item.kode_bpjs_kesehatan}`, result.value);
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
                    await apiClient.delete(`/payroll/bpjs-kesehatan/${kode}`);
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
            <PageBreadcrumb pageTitle="BPJS Kesehatan" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <Activity className="w-6 h-6 text-brand-500" />
                        Daftar BPJS Kesehatan
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={fetchData} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button onClick={handleCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                            <Plus className="h-4 w-4" />
                            <span>Tambah Data</span>
                        </button>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari Karyawan..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500 pl-10"
                        />
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Kode Cabang..."
                            value={kodeCabang}
                            onChange={(e) => setKodeCabang(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        />
                    </div>
                    <div className="relative flex gap-2">
                        <input
                            type="text"
                            placeholder="Kode Dept..."
                            value={kodeDept}
                            onChange={(e) => setKodeDept(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        />
                        <button onClick={fetchData} className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-opacity-90">
                            <Search className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Kode BPJS</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Nama Karyawan</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Cabang/Dept</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-right">Jumlah (Rp)</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Berlaku Mulai</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan.</td></tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.kode_bpjs_kesehatan} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20 align-top">
                                        <td className="px-4 py-4 text-black dark:text-white">
                                            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.kode_bpjs_kesehatan}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-black dark:text-white">{item.nama_karyawan}</span>
                                                <span className="text-xs text-brand-500">{item.nik}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col text-xs text-gray-600 dark:text-gray-400">
                                                <span>{item.kode_cabang || '-'}</span>
                                                <span>{item.kode_dept || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium text-green-600 dark:text-green-400">
                                            {formatCurrency(item.jumlah)}
                                        </td>
                                        <td className="px-4 py-4 text-center text-gray-600 dark:text-gray-400">
                                            {item.tanggal_berlaku}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(item)} className="hover:text-brand-500 text-gray-500 transition-colors" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item.kode_bpjs_kesehatan)} className="hover:text-red-500 text-gray-500 transition-colors" title="Hapus">
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
                <div className="mt-4 text-xs text-gray-400 italic">
                    * Menampilkan 50 data terakhir yang diinput/update. Gunakan pencarian untuk menemukan data spesifik.
                </div>
            </div>
        </MainLayout>
    );
}
