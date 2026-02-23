'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Search, RefreshCw, ShieldCheck, Download, ArrowLeft, ArrowRight, CheckCircle2, Monitor, Calendar } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { withPermission } from '@/hoc/withPermission';
import { format } from 'date-fns';
import SearchableSelect from '@/components/form/SearchableSelect';

export type AgreementRow = {
    id: number;
    user_name: string;
    user_email: string;
    department: string;
    branch: string;
    position: string;
    terms_version: string;
    privacy_version: string;
    device_info: string;
    agreed_at: string;
};

function UserAgreementsPage() {
    const [data, setData] = useState<AgreementRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<{ id: number; nama_dept: string }[]>([]);

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [cabangOptions, setCabangOptions] = useState<{ code: string; name: string }[]>([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [deptRes, optsRes] = await Promise.all([
                    apiClient.get('/master/departemen'),
                    apiClient.get('/master/options')
                ]);
                setDepartments((deptRes as any).data?.data || (deptRes as any).data || []);
                if ((optsRes as any)?.cabang) {
                    setCabangOptions((optsRes as any).cabang);
                }
            } catch (error) {
                console.error('Failed to fetch filter options:', error);
            }
        };
        fetchOptions();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedDepartment, selectedBranch]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (selectedDepartment) params.append('department_id', selectedDepartment);
            if (selectedBranch) params.append('branch_id', selectedBranch);

            const res = await apiClient.get(`/compliance/agreements?${params.toString()}`);
            if (Array.isArray(res)) {
                setData(res);
            } else {
                setData([]);
            }
        } catch (err) {
            console.error('Error fetching agreements data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (data.length === 0) return;

        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Nama User,Email/NIK,Departemen,Jabatan,Cabang,Terms Version,Privacy Version,Device Info,Tanggal Persetujuan\n';

        data.forEach(row => {
            const rowData = [
                `"${row.user_name || ''}"`,
                `"${row.user_email || ''}"`,
                `"${row.department || ''}"`,
                `"${row.position || ''}"`,
                `"${row.branch || ''}"`,
                `"${row.terms_version || ''}"`,
                `"${row.privacy_version || ''}"`,
                `"${row.device_info || ''}"`,
                `"${row.agreed_at ? new Date(row.agreed_at).toLocaleString() : '-'}"`
            ];
            csvContent += rowData.join(',') + '\n';
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `User_Agreements_Audit_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Pagination Logic
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return data.slice(start, start + perPage);
    }, [data, currentPage, perPage]);

    const totalPages = Math.ceil(data.length / perPage);

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Persetujuan Pengguna" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 mb-10">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                            <ShieldCheck className="text-blue-500 w-6 h-6" />
                            Daftar Persetujuan (Audit & Compliance)
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                            Laporan audit karyawan yang telah menyetujui kebijakan dan syarat ketentuan aplikasi Guard System.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button onClick={handleExportCSV} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-emerald-500 px-4 py-2 text-center font-medium text-white hover:bg-emerald-600 transition shadow-sm">
                            <Download className="h-4 w-4" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
                    <div className="relative col-span-2">
                        <input
                            type="text"
                            placeholder="Cari nama, email, NIK..."
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 pl-11 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        />
                        <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                        <SearchableSelect
                            options={[{ value: '', label: 'Semua Cabang' }, ...cabangOptions.map(c => ({ value: c.code, label: c.name }))]}
                            value={selectedBranch}
                            onChange={val => {
                                setSelectedBranch(val);
                                setCurrentPage(1);
                            }}
                            placeholder="Pilih Cabang"
                        />
                    </div>
                    <div className="col-span-2 md:col-span-2">
                        <select
                            value={selectedDepartment}
                            onChange={(e) => {
                                setSelectedDepartment(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        >
                            <option value="">Semua Departemen</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.nama_dept}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Pegawai</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Departemen</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Persetujuan</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Waktu & Perangkat</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : paginatedData.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td></tr>
                            ) : (
                                paginatedData.map((row, idx) => (
                                    <tr key={row.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex bg-blue-100 h-10 w-10 min-w-10 items-center justify-center rounded-full text-blue-600 uppercase font-semibold">
                                                    {row.user_name ? row.user_name.charAt(0) : '?'}
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-black dark:text-white text-sm">{row.user_name || 'Unknown User'}</h5>
                                                    <p className="text-xs text-gray-500">{row.user_email || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-black dark:text-white">{row.department}</span>
                                                <span className="text-gray-500 text-xs">{row.position} • {row.branch}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 w-max">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Terms: {row.terms_version}
                                                </div>
                                                <div className="flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700 w-max">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Privacy: {row.privacy_version}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="flex flex-col gap-1 text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                    <span>
                                                        {row.agreed_at && !isNaN(new Date(row.agreed_at).getTime())
                                                            ? format(new Date(row.agreed_at), 'dd MMM yyyy, HH:mm')
                                                            : '-'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Monitor className="w-4 h-4 mr-2 text-gray-400" />
                                                    <span className="truncate max-w-[150px] font-mono text-xs bg-gray-100 px-1 rounded dark:bg-gray-700 text-gray-500" title={row.device_info || 'Unknown Device'}>
                                                        {row.device_info || 'Unknown Device'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data.length > 0 && (
                    <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stroke pt-4 dark:border-strokedark">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, data.length)} dari {data.length} data
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
        </MainLayout>
    );
}

export default withPermission(UserAgreementsPage, { permissions: ['users.index'] });
