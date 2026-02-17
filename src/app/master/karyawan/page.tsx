'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Search, UserPlus, Filter, Database, ArrowLeft, ArrowRight, User, GraduationCap, Building2, MapPin, Smartphone, Key, AlertTriangle, Lock, Unlock, Fingerprint, Clock, FileText, Trash, Edit, Plus, RefreshCw, SmartphoneNfc, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Image from 'next/image';
import Swal from 'sweetalert2';
import KaryawanModal from './KaryawanModal';
import SetJamKerjaModal from './SetJamKerjaModal';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';

type KaryawanItem = {
    nik: string;
    nama_karyawan: string;
    no_hp: string;
    foto: string | null;
    status_aktif_karyawan: string;
    nama_dept: string;
    nama_jabatan: string;
    nama_cabang: string;
    id_user: number | null;
    sisa_hari_anggota: number | null;

    // Extended
    no_ktp: string;
    tanggal_masuk: string | null;
    no_kartu_anggota: string | null;
    masa_aktif_kartu_anggota: string | null;
    keterangan_status_kawin: string | null;
    pendidikan_terakhir: string | null;
    no_ijazah: string | null;
    kontak_darurat_nama: string | null;
    kontak_darurat_hp: string | null;
    kontak_darurat_alamat: string | null;
    lock_location: string;
    lock_jam_kerja: string;
    lock_device_login: string;
    allow_multi_device: string;
    pin: number | null;
    foto_ktp: string | null;
    foto_kartu_anggota: string | null;
    foto_ijazah: string | null;
};

type OptionItem = { code: string; name: string };
type MasterOptions = {
    departemen: OptionItem[];
    jabatan: OptionItem[];
    cabang: OptionItem[];
    status_kawin: OptionItem[];
};

// ... imports
// Link import already handled at top

// ... (keep types)

function MasterKaryawanPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [data, setData] = useState<KaryawanItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [options, setOptions] = useState<MasterOptions>({ departemen: [], jabatan: [], cabang: [], status_kawin: [] });
    const [filterDept, setFilterDept] = useState('');
    const [filterCabang, setFilterCabang] = useState('');
    const [filterMasa, setFilterMasa] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Toggle Modal Jam Kerja
    const [showJamKerjaModal, setShowJamKerjaModal] = useState(false);
    const [selectedNikForJam, setSelectedNikForJam] = useState<string | null>(null);

    const openJamKerjaModal = (nik: string) => {
        setSelectedNikForJam(nik);
        setShowJamKerjaModal(true);
    };

    // Filter Options
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res: any = await apiClient.get('/master/options');
                if (res) setOptions(res);
            } catch (e) {
                console.error("Failed load options", e);
            }
        };
        fetchOptions();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `/master/karyawan?page=${currentPage}&per_page=${perPage}`;
            if (searchTerm) url += `&search=${searchTerm}`;
            if (filterDept) url += `&dept_code=${filterDept}`;
            if (filterCabang) url += `&cabang_code=${filterCabang}`;
            if (filterMasa) url += `&masa_anggota=${filterMasa}`;

            const response: any = await apiClient.get(url);
            if (response.status) {
                setData(response.data);
                if (response.meta) {
                    setTotalPages(response.meta.total_pages);
                    setTotalItems(response.meta.total_items);
                }
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch karyawan", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchData(), 300);
        return () => clearTimeout(timer);
    }, [searchTerm, currentPage, perPage, filterDept, filterCabang, filterMasa]);

    const handleDelete = async (nik: string, nama: string) => {
        const result = await Swal.fire({
            title: 'Apakah Anda Yakin?',
            text: `Data karyawan ${nama} (${nik}) akan dihapus permanen!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/master/karyawan/${nik}`);
            Swal.fire({
                title: 'Terhapus!',
                text: 'Data karyawan berhasil dihapus.',
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

    const handleToggle = async (nik: string, type: 'location' | 'jamkerja' | 'device' | 'multidevice') => {
        try {
            await apiClient.patch(`/master/karyawan/${nik}/toggle/${type}`);

            // Optimistic update or refetch
            // For now refetch to be safe
            fetchData();
        } catch (error: any) {
            console.error(error);
            Swal.fire('Gagal!', error.response?.data?.detail || "Gagal mengubah status.", 'error');
        }
    };

    const handleResetSession = async (nik: string, nama: string) => {
        const result = await Swal.fire({
            title: 'Reset Sesi Login?',
            text: `Akun ${nama} akan dipaksa logout dari perangkat HP!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ffc107',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Ya, Force Logout!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.post(`/master/karyawan/${nik}/reset-session`);
            Swal.fire({
                title: 'Berhasil!',
                text: 'Sesi login berhasil direset.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            fetchData();
        } catch (error: any) {
            console.error(error);
            Swal.fire('Gagal!', error.response?.data?.detail || "Gagal mereset sesi.", 'error');
        }
    };

    const getStatusBadge = (status: string) => {
        const isActive = status === '1' || status.toLowerCase() === 'y' || status.toLowerCase() === 'aktif';
        return (
            <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-medium", isActive ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400")}>
                {isActive ? 'Aktif' : 'Non Aktif'}
            </span>
        );
    };

    // Helper URLs
    const getPhotoUrl = (folder: string, filename: string | null) => {
        if (!filename) return null;
        // Backend now returns full URLs, so just return as-is
        return filename;
    };

    // Helper Date
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }); // dd-mm-yy
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Data Karyawan" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white">
                        Daftar Karyawan
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {canCreate('karyawan') && (
                            <Link
                                href="/master/karyawan/create"
                                className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm"
                            >
                                <UserPlus className="h-4 w-4" />
                                <span>Tambah Data</span>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari karyawan..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                        />
                        <Search className="absolute right-4 top-3 h-5 w-5 text-gray-400" />
                    </div>

                    <select
                        value={filterCabang}
                        onChange={e => setFilterCabang(e.target.value)}
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4"
                    >
                        <option value="">Semua Cabang</option>
                        {options.cabang.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
                    </select>

                    <select
                        value={filterDept}
                        onChange={e => setFilterDept(e.target.value)}
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4"
                    >
                        <option value="">Semua Departemen</option>
                        {options.departemen.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
                    </select>

                    <select
                        value={filterMasa}
                        onChange={e => setFilterMasa(e.target.value)}
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4"
                    >
                        <option value="">Filter Masa Anggota</option>
                        <option value="aktif">Aktif</option>
                        <option value="expiring">Akan Habis</option>
                        <option value="expired">Kadaluarsa</option>
                    </select>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Karyawan</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Jabatan & Dept</th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Cabang</th>
                                <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                <th className="min-w-[90px] px-2 py-4 font-medium text-black dark:text-white text-center" title="Lock Location"><MapPin className="mx-auto h-4 w-4" /></th>
                                <th className="min-w-[90px] px-2 py-4 font-medium text-black dark:text-white text-center" title="Lock Jam Kerja"><Clock className="mx-auto h-4 w-4" /></th>
                                <th className="min-w-[90px] px-2 py-4 font-medium text-black dark:text-white text-center" title="Multi Device"><Smartphone className="mx-auto h-4 w-4" /></th>
                                <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Kontak</th>
                                <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">Masa Anggota</th>
                                <th className="min-w-[180px] px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-500">Tidak ada data ditemukan</td></tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={idx} className="border-b border-stroke dark:border-strokedark">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-10 w-10 rounded-full">
                                                    {item.foto ? (
                                                        <Image
                                                            src={getPhotoUrl('', item.foto)!}
                                                            alt="User"
                                                            width={40}
                                                            height={40}
                                                            className="h-full w-full rounded-full object-cover"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100 dark:bg-meta-4 text-gray-500">
                                                            <User className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-black dark:text-white text-sm">{item.nama_karyawan}</h5>
                                                    <p className="text-xs text-black dark:text-white">{item.nik}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.nama_jabatan}</p>
                                            <p className="text-xs text-gray-500">{item.nama_dept}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-black dark:text-white text-sm">{item.nama_cabang}</p>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {getStatusBadge(item.status_aktif_karyawan)}
                                        </td>

                                        {/* TOGGLE ICONS */}
                                        <td className="px-2 py-4 text-center">
                                            <button
                                                onClick={() => handleToggle(item.nik, 'location')}
                                                className="hover:opacity-80 transition"
                                                title={item.lock_location === '1' ? "Location Locked" : "Location Unlocked"}
                                            >
                                                {item.lock_location === '1' ?
                                                    <Lock className="mx-auto h-4 w-4 text-green-500" /> :
                                                    <Unlock className="mx-auto h-4 w-4 text-red-500" />
                                                }
                                            </button>
                                        </td>
                                        <td className="px-2 py-4 text-center">
                                            <button
                                                onClick={() => handleToggle(item.nik, 'jamkerja')}
                                                className="hover:opacity-80 transition"
                                                title={item.lock_jam_kerja === '1' ? "Jam Kerja Locked" : "Jam Kerja Unlocked"}
                                            >
                                                {item.lock_jam_kerja === '1' ?
                                                    <Lock className="mx-auto h-4 w-4 text-green-500" /> :
                                                    <Unlock className="mx-auto h-4 w-4 text-red-500" />
                                                }
                                            </button>
                                        </td>
                                        <td className="px-2 py-4 text-center">
                                            <button
                                                onClick={() => handleToggle(item.nik, 'multidevice')}
                                                className="hover:opacity-80 transition"
                                                title={item.allow_multi_device === '1' ? "Multi Device Allowed" : "Single Device Only"}
                                            >
                                                {item.allow_multi_device === '1' ?
                                                    <SmartphoneNfc className="mx-auto h-4 w-4 text-green-500" /> :
                                                    <Smartphone className="mx-auto h-4 w-4 text-red-500" />
                                                }
                                            </button>
                                        </td>


                                        <td className="px-4 py-4">
                                            {item.no_hp ? (
                                                <a href={`https://wa.me/${item.no_hp.replace(/^0/, '62').replace(/[^0-9]/g, '')}`} target="_blank" className="flex items-center gap-1 text-sm text-brand-500 hover:underline">
                                                    <Smartphone className="h-3 w-3" />
                                                    {item.no_hp}
                                                </a>
                                            ) : (
                                                <span className="text-sm text-gray-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            {item.masa_aktif_kartu_anggota ? (
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-black dark:text-white text-sm">{formatDate(item.masa_aktif_kartu_anggota)}</p>
                                                    {item.sisa_hari_anggota !== null && (
                                                        item.sisa_hari_anggota < 0 ? (
                                                            <span className="text-xs text-red-500 font-medium">{Math.abs(item.sisa_hari_anggota)} hari lalu</span>
                                                        ) : (
                                                            <span className="text-xs text-green-500 font-medium">{item.sisa_hari_anggota} hari lagi</span>
                                                        )
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Set Jam Kerja */}
                                                {canUpdate('karyawan') && (
                                                    <button
                                                        onClick={() => openJamKerjaModal(item.nik)}
                                                        className="hover:text-blue-500 text-gray-500 dark:text-gray-400"
                                                        title="Set Jam Kerja"
                                                    >
                                                        <Clock className="h-4 w-4" />
                                                    </button>
                                                )}

                                                {/* Edit */}
                                                {canUpdate('karyawan') && (
                                                    <Link
                                                        href={`/master/karyawan/edit/${item.nik}`}
                                                        className="hover:text-brand-500 text-gray-500 dark:text-gray-400"
                                                        title="Edit Data"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                )}

                                                {/* Lock/Unlock Device */}
                                                {canUpdate('karyawan') && (
                                                    <button
                                                        onClick={() => handleToggle(item.nik, 'device')}
                                                        className="hover:opacity-80 text-gray-500 dark:text-gray-400"
                                                        title="Lock/Unlock Device Login"
                                                    >
                                                        {item.lock_device_login === '1' ?
                                                            <Lock className="h-4 w-4 text-green-500" /> :
                                                            <Unlock className="h-4 w-4 text-red-500" />
                                                        }
                                                    </button>
                                                )}

                                                {/* Reset Session */}
                                                {canUpdate('karyawan') && (
                                                    <button
                                                        onClick={() => handleResetSession(item.nik, item.nama_karyawan)}
                                                        className="hover:text-orange-500 text-gray-500 dark:text-gray-400"
                                                        title="Reset Session (Force Logout)"
                                                    >
                                                        <RefreshCw className="h-4 w-4" />
                                                    </button>
                                                )}

                                                {/* Hapus */}
                                                {canDelete('karyawan') && (
                                                    <button
                                                        onClick={() => handleDelete(item.nik, item.nama_karyawan)}
                                                        className="hover:text-red-500 text-gray-500 dark:text-gray-400"
                                                        title="Hapus Data"
                                                    >
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
                <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-stroke pt-4 dark:border-strokedark">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, totalItems)} dari {totalItems} data
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                            className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || loading}
                            className="flex h-8 w-8 items-center justify-center rounded border border-stroke hover:bg-gray-100 disabled:opacity-50 dark:border-strokedark dark:hover:bg-meta-4"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {showJamKerjaModal && (
                    <SetJamKerjaModal
                        nik={selectedNikForJam}
                        onClose={() => setShowJamKerjaModal(false)}
                        onSuccess={fetchData}
                    />
                )}
            </div>
        </MainLayout >
    );
}

// Protect page with permission
export default withPermission(MasterKaryawanPage, {
    permissions: ['karyawan.index']
});
