'use client';

import { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Search, X, Eye, FileText, ArrowLeft, ArrowRight, Calendar, Plus, Save, Trash, AlertTriangle, User, ScanLine, Clock, UserX, MapPinOff, ShieldX, WifiOff, Slash, Smartphone, ShieldAlert, List } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Image from 'next/image';
import { withPermission } from '@/hoc/withPermission';
import SearchableSelect from '@/components/form/SearchableSelect';
import Swal from 'sweetalert2';
import dynamic from 'next/dynamic';
import { usePermissions } from '@/contexts/PermissionContext';
import clsx from 'clsx';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5" disabled />
});

type ViolationItem = {
    id: number;
    nik: string;
    nama_karyawan: string;
    tanggal_pelanggaran: string;
    jenis_pelanggaran: string;
    keterangan: string;
    sanksi: string;
    status: string;
    bukti_foto?: string;
    created_at?: string;
    source?: 'MANUAL' | 'SYSTEM';
    violation_type?: string;
};

type TicketItem = {
    nik: string;
    nama_karyawan: string;
    type: string;
    description: string;
    timestamp: string;
    severity: 'RINGAN' | 'SEDANG' | 'BERAT';
    violation_code: string;
}

type KaryawanOption = {
    nik: string;
    nama_karyawan: string;
    jabatan?: string;
};

type OptionItem = { value: string; label: string };

const VIOLATION_TYPES = [
    { id: 'all', label: 'Semua', icon: List },
    { id: 'absent', label: 'Tidak Hadir (Alpha)', icon: UserX },
    { id: 'late', label: 'Terlambat', icon: Clock },
    { id: 'no_checkout', label: 'Tidak Absen Pulang', icon: UserX },
    { id: 'out_of_location', label: 'Diluar Lokasi', icon: MapPinOff },
    { id: 'missed_patrol', label: 'Tidak Patroli', icon: ShieldX },
    { id: 'app_force_close', label: 'Force Close App', icon: WifiOff },
    { id: 'fake_gps', label: 'Fake GPS', icon: Slash },
    { id: 'root_device', label: 'HP Root', icon: Smartphone },
    { id: 'blocked_user', label: 'Akun Terblokir', icon: ShieldAlert },
];

function ViolationPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [viewMode, setViewMode] = useState<'list' | 'scan'>('list');

    // List Mode States
    const [data, setData] = useState<ViolationItem[]>([]);
    const [karyawanList, setKaryawanList] = useState<KaryawanOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Scan Mode States
    const [scanResults, setScanResults] = useState<TicketItem[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanDate, setScanDate] = useState(new Date().toISOString().slice(0, 10));

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Dynamic Filter states
    const [filterDept, setFilterDept] = useState('');
    const [filterCabang, setFilterCabang] = useState('');
    const [deptOptions, setDeptOptions] = useState<OptionItem[]>([]);
    const [cabangOptions, setCabangOptions] = useState<OptionItem[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'detail'>('create');
    const [selectedItem, setSelectedItem] = useState<ViolationItem | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nik: '',
        tanggal_pelanggaran: new Date().toISOString().slice(0, 10),
        jenis_pelanggaran: 'RINGAN',
        keterangan: '',
        sanksi: '',
        status: 'OPEN',
        violation_type: 'MANUAL',
        bukti_foto: null as File | null
    });

    // Fetch Karyawan
    const fetchKaryawan = async () => {
        try {
            const response: any = await apiClient.get('/master/karyawan?per_page=10000');
            if (response && response.data && Array.isArray(response.data)) {
                setKaryawanList(response.data);
            } else if (Array.isArray(response)) {
                setKaryawanList(response);
            }
        } catch (error) {
            console.error("Failed to fetch karyawan options", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = '/security/violations?per_page=5000&';
            if (searchTerm) url += `search=${searchTerm}&`;
            if (dateStart) url += `date_start=${dateStart}&`;
            if (dateEnd) url += `date_end=${dateEnd}&`;
            if (filterType !== 'all') url += `type=${filterType}&`;
            if (filterCabang) url += `kode_cabang=${filterCabang}&`;
            if (filterDept) url += `kode_dept=${filterDept}&`;

            try {
                const response: any = await apiClient.get(url);
                if (Array.isArray(response)) {
                    setData(response);
                } else if (response.data && Array.isArray(response.data)) {
                    setData(response.data);
                } else {
                    setData([]);
                }
            } catch (e) {
                console.warn("Endpoint fallback");
                setData([]);
            }

        } catch (error) {
            console.error("Failed to fetch data", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const runScan = async () => {
        setIsScanning(true);
        setScanResults([]);
        try {
            const response: any = await apiClient.get(`/security/violations/scan?date_scan=${scanDate}`);
            if (Array.isArray(response)) {
                setScanResults(response);
            } else if (response.data) {
                setScanResults(response.data);
            }
        } catch (error) {
            console.error("Scan failed", error);
            Swal.fire("Error", "Gagal melakukan scanning sistem", "error");
        } finally {
            setIsScanning(false);
        }
    }

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [deptRes, cabangRes] = await Promise.all([
                    apiClient.get('/master/departemen/options'),
                    apiClient.get('/master/cabang/options')
                ]);

                if (Array.isArray(deptRes)) {
                    setDeptOptions(deptRes.map((d: any) => ({ value: d.kode_dept, label: d.nama_dept })));
                }

                if (Array.isArray(cabangRes)) {
                    setCabangOptions(cabangRes.map((c: any) => ({ value: c.kode_cabang, label: c.nama_cabang })));
                }
            } catch (e) {
                console.error("Failed load options", e);
            }
        };
        fetchOptions();
        fetchKaryawan();
        fetchData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
            setCurrentPage(1);
        }, 800);
        return () => clearTimeout(timer);
    }, [searchTerm, dateStart, dateEnd, filterType, filterCabang, filterDept]);

    // Pagination Logic
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return data.slice(start, start + perPage);
    }, [data, currentPage, perPage]);

    const totalPages = Math.ceil(data.length / perPage);

    const handleOpenCreate = () => {
        setModalMode('create');
        setFormData({
            nik: '',
            tanggal_pelanggaran: new Date().toISOString().slice(0, 10),
            jenis_pelanggaran: 'RINGAN',
            keterangan: '',
            sanksi: '',
            status: 'OPEN',
            violation_type: 'MANUAL',
            bukti_foto: null
        });
        setIsModalOpen(true);
    };

    const handleConvertTicket = (ticket: TicketItem) => {
        setModalMode('create');
        setFormData({
            nik: ticket.nik,
            tanggal_pelanggaran: ticket.timestamp.split(' ')[0] || scanDate,
            jenis_pelanggaran: ticket.severity,
            keterangan: `${ticket.type}: ${ticket.description}`,
            sanksi: '',
            status: 'OPEN',
            violation_type: ticket.violation_code,
            bukti_foto: null
        });
        setViewMode('list');
        setIsModalOpen(true);
    };

    const handleView = (item: ViolationItem) => {
        setSelectedItem(item);
        setModalMode('detail');
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus Pelanggaran?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/security/violations/${id}`);
                Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
                fetchData();
            } catch (error: any) {
                Swal.fire('Gagal!', error.response?.data?.detail || 'Gagal menghapus data.', 'error');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nik || !formData.keterangan) {
            Swal.fire('Error', 'Mohon lengkapi data wajib (Karyawan, Keterangan)', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('nik', formData.nik);
            payload.append('tanggal_pelanggaran', formData.tanggal_pelanggaran);
            payload.append('jenis_pelanggaran', formData.jenis_pelanggaran);
            payload.append('keterangan', formData.keterangan);
            payload.append('sanksi', formData.sanksi);
            payload.append('status', formData.status);
            payload.append('violation_type', formData.violation_type); // Add this

            if (formData.bukti_foto) {
                payload.append('bukti_foto', formData.bukti_foto);
            }

            await apiClient.post('/security/violations', payload, {
                headers: { 'Content-Type': 'multipart/form-data' } // Use multipart if uploading file
            });

            Swal.fire('Berhasil', 'Data pelanggaran berhasil disimpan', 'success');
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            console.error(error);
            Swal.fire('Gagal', error.response?.data?.detail || 'Gagal menyimpan data', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Pelanggaran Karyawan" />

            {previewImage && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="max-h-[90vh] max-w-full rounded-lg shadow-2xl object-contain"
                    />
                    <button
                        className="absolute top-5 right-5 text-white bg-black/50 rounded-full p-2 hover:bg-white/20 transition-colors"
                        onClick={() => setPreviewImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        {viewMode === 'list' ? <AlertTriangle className="text-danger" /> : <ScanLine className="text-brand-500" />}
                        {viewMode === 'list' ? 'Daftar Pelanggaran' : 'Deteksi Sistem Otomatis'}
                    </h2>
                    <div className="flex gap-3">
                        {viewMode === 'list' ? (
                            <>
                                <button onClick={() => setViewMode('scan')} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-brand-500 bg-brand-50 px-4 py-2 text-center font-medium text-brand-500 hover:bg-brand-100 dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                                    <ScanLine className="h-4 w-4" />
                                    <span>Deteksi Sistem</span>
                                </button>
                                <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                                    <RefreshCw className="h-4 w-4" />
                                    <span className="hidden sm:inline">Refresh</span>
                                </button>
                                <button onClick={handleOpenCreate} className="inline-flex items-center justify-center gap-2.5 rounded-lg bg-red-600 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                                    <Plus className="h-4 w-4" />
                                    <span>Input Pelanggaran</span>
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setViewMode('list')} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                                <List className="h-4 w-4" />
                                <span>Kembali ke Daftar</span>
                            </button>
                        )}
                    </div>
                </div>

                {viewMode === 'list' ? (
                    // LIST VIEW
                    <>
                        {/* Category Filters */}
                        <div className="mb-6 overflow-x-auto pb-2">
                            <div className="flex gap-2">
                                {VIOLATION_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setFilterType(type.id)}
                                        className={clsx(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap",
                                            filterType === type.id
                                                ? "bg-brand-500 text-white border-brand-500"
                                                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 dark:bg-meta-4 dark:text-gray-300 dark:border-strokedark"
                                        )}
                                    >
                                        <type.icon size={14} />
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
                            <div className="relative col-span-1">
                                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Cari Kata Kunci</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Cari NIK, Nama..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500"
                                    />
                                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                            <div className="col-span-1">
                                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Dari Tanggal</label>
                                <DatePicker
                                    id="date-start"
                                    placeholder="Semua"
                                    defaultDate={dateStart}
                                    onChange={(dates: Date[], dateStr: string) => setDateStart(dateStr)}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Sampai Tanggal</label>
                                <DatePicker
                                    id="date-end"
                                    placeholder="Semua"
                                    defaultDate={dateEnd}
                                    onChange={(dates: Date[], dateStr: string) => setDateEnd(dateStr)}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Cabang</label>
                                <SearchableSelect
                                    options={[{ value: "", label: "Semua Cabang" }, ...cabangOptions]}
                                    value={filterCabang}
                                    onChange={(val) => setFilterCabang(val)}
                                    placeholder="Semua Cabang"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="mb-1 block text-sm font-medium text-black dark:text-white">Departemen</label>
                                <SearchableSelect
                                    options={[{ value: "", label: "Semua Dept" }, ...deptOptions]}
                                    value={filterDept}
                                    onChange={(val) => setFilterDept(val)}
                                    placeholder="Semua Dept"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    // SCAN MODE
                    <div className="bg-gray-50 dark:bg-meta-4/20 p-6 rounded-lg border border-stroke dark:border-strokedark">
                        <div className="mb-6 flex gap-4 items-end">
                            <div className="flex-1 max-w-xs">
                                <label className="block text-sm font-medium mb-1 dark:text-white">Tanggal Scan</label>
                                <DatePicker
                                    id="scan-date"
                                    defaultDate={scanDate}
                                    onChange={(dates: Date[], s: string) => setScanDate(s)}
                                />
                            </div>
                            <button
                                onClick={runScan}
                                disabled={isScanning}
                                className="px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-opacity-90 disabled:opacity-70 flex items-center gap-2"
                            >
                                {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                                {isScanning ? 'Memindai...' : 'Mulai Scanning'}
                            </button>
                        </div>

                        {scanResults.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold mb-4 dark:text-white">Hasil Deteksi ({scanResults.length})</h3>
                                <div className="space-y-3">
                                    {scanResults.map((ticket, i) => (
                                        <div key={i} className="bg-white dark:bg-boxdark p-4 rounded-lg shadow-sm border border-stroke dark:border-strokedark flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${ticket.type.includes('Terlambat') ? 'bg-orange-100 text-orange-600' :
                                                    ticket.type.includes('Tidak Hadir') ? 'bg-red-100 text-red-600' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    <AlertTriangle size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-black dark:text-white">{ticket.nama_karyawan}</p>
                                                    <p className="text-xs text-brand-500">{ticket.nik} • {ticket.type}</p>
                                                    <p className="text-sm mt-1">{ticket.description}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleConvertTicket(ticket)}
                                                className="px-3 py-1.5 text-xs font-medium bg-brand-50 text-brand-500 rounded border border-brand-200 hover:bg-brand-100"
                                            >
                                                Buat Laporan
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!isScanning && scanResults.length === 0 && (
                            <div className="text-center py-10 text-gray-500">
                                <ScanLine size={48} className="mx-auto mb-2 opacity-20" />
                                <p>Silakan mulai scanning untuk mendeteksi pelanggaran sistem.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Only show list table if in list mode */}
                {viewMode === 'list' && (
                    <>
                        <div className="max-w-full overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                        <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white text-center">No</th>
                                        <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">Karyawan</th>
                                        <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Tanggal</th>
                                        <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">Jenis</th>
                                        <th className="min-w-[250px] px-4 py-4 font-medium text-black dark:text-white">Keterangan</th>
                                        <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white text-center">Status</th>
                                        <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
                                    ) : paginatedData.length === 0 ? (
                                        <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada data pelanggaran ditemukan</td></tr>
                                    ) : (
                                        paginatedData.map((item, idx) => (
                                            <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                                <td className="px-4 py-4 text-center">
                                                    <p className="text-black dark:text-white text-sm">{(currentPage - 1) * perPage + idx + 1}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex bg-gray-100 h-10 w-10 min-w-10 items-center justify-center rounded-full text-gray-600 dark:bg-meta-4 dark:text-gray-400">
                                                            <User size={20} />
                                                        </div>
                                                        <div>
                                                            <h5 className="font-semibold text-black dark:text-white text-sm">{item.nama_karyawan}</h5>
                                                            <p className="text-xs text-brand-500">{item.nik}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span className="text-black dark:text-white font-medium">
                                                            {new Date(item.tanggal_pelanggaran).toLocaleDateString('id-ID')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.jenis_pelanggaran === 'BERAT' ? 'bg-red-100 text-red-600' :
                                                        item.jenis_pelanggaran === 'SEDANG' ? 'bg-orange-100 text-orange-600' :
                                                            'bg-blue-100 text-blue-600'
                                                        }`}>
                                                        {item.jenis_pelanggaran}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-[250px] truncate" title={item.keterangan}>
                                                    {item.keterangan}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.status === 'CLOSED' || item.status === 'SELESAI'
                                                        ? 'bg-green-100 text-green-800 border-green-200'
                                                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleView(item)}
                                                            className="p-2 rounded-full hover:bg-gray-100 text-brand-500 dark:hover:bg-meta-4 transition"
                                                            title="Lihat Detail"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-2 rounded-full hover:bg-red-50 text-red-500 dark:hover:bg-red-900/20 transition"
                                                            title="Hapus"
                                                        >
                                                            <Trash className="h-5 w-5" />
                                                        </button>
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
                                    Menampilkan <span className="font-medium text-black dark:text-white">{(currentPage - 1) * perPage + 1}</span> - <span className="font-medium text-black dark:text-white">{Math.min(currentPage * perPage, data.length)}</span> dari <span className="font-medium text-black dark:text-white">{data.length}</span> data
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
                    </>
                )}
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-boxdark rounded-lg shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-white dark:bg-boxdark sticky top-0 z-10">
                            <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                                {modalMode === 'create' ? 'Input Pelanggaran Baru' : 'Detail Pelanggaran'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {modalMode === 'create' ? (
                            <form onSubmit={handleSubmit}>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Karyawan <span className="text-red-500">*</span></label>
                                        <SearchableSelect
                                            options={karyawanList.map(k => ({ value: k.nik, label: `${k.nama_karyawan} (${k.nik})` }))}
                                            value={formData.nik}
                                            onChange={(val) => setFormData({ ...formData, nik: val })}
                                            placeholder="Pilih Karyawan"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-black dark:text-white mb-2">Tanggal</label>
                                            <DatePicker
                                                id="form-date"
                                                defaultDate={formData.tanggal_pelanggaran}
                                                onChange={(dates: Date[], str: string) => setFormData({ ...formData, tanggal_pelanggaran: str })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-black dark:text-white mb-2">Jenis Pelanggaran</label>
                                            <select
                                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                                value={formData.jenis_pelanggaran}
                                                onChange={e => setFormData({ ...formData, jenis_pelanggaran: e.target.value })}
                                            >
                                                <option value="RINGAN">Ringan</option>
                                                <option value="SEDANG">Sedang</option>
                                                <option value="BERAT">Berat</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Keterangan / Kronologi <span className="text-red-500">*</span></label>
                                        <textarea
                                            rows={3}
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.keterangan}
                                            onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                                            placeholder="Jelaskan detail pelanggaran..."
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Sanksi Diberikan</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                            value={formData.sanksi}
                                            onChange={e => setFormData({ ...formData, sanksi: e.target.value })}
                                            placeholder="Contoh: Teguran Lisan, SP1, dsb"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">Bukti Foto (Opsional)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => setFormData({ ...formData, bukti_foto: e.target.files ? e.target.files[0] : null })}
                                            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-2.5 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                        />
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 dark:bg-meta-4/30 border-t border-stroke dark:border-strokedark flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-black bg-white border border-stroke rounded-lg hover:bg-gray-50">
                                        Batal
                                    </button>
                                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-danger rounded-lg hover:bg-danger/90 flex items-center gap-2">
                                        {isSubmitting ? 'Menyimpan...' : <><Save className="w-4 h-4" /> Simpan Pelanggaran</>}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            // DETAIL VIEW
                            <div className="p-6 space-y-6">
                                {selectedItem && (
                                    <>
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-meta-4 rounded-lg border border-stroke">
                                            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center border border-gray-200">
                                                <User className="h-6 w-6 text-gray-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-black dark:text-white">{selectedItem.nama_karyawan}</h4>
                                                <p className="text-sm text-gray-500">{selectedItem.nik}</p>
                                            </div>
                                            <div className="ml-auto">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedItem.jenis_pelanggaran === 'BERAT' ? 'bg-red-100 text-red-600' :
                                                    selectedItem.jenis_pelanggaran === 'SEDANG' ? 'bg-orange-100 text-orange-600' :
                                                        'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {selectedItem.jenis_pelanggaran}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tanggal</label>
                                                <p className="font-medium mt-1">{new Date(selectedItem.tanggal_pelanggaran).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Status</label>
                                                <p className="font-medium mt-1">{selectedItem.status}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Keterangan</label>
                                            <div className="mt-1 p-3 bg-gray-50 dark:bg-meta-4/20 rounded border border-stroke dark:border-strokedark text-sm">
                                                {selectedItem.keterangan}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Sanksi</label>
                                            <p className="font-medium mt-1 text-danger">{selectedItem.sanksi || '-'}</p>
                                        </div>

                                        {selectedItem.bukti_foto && (
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-2">Bukti Foto</label>
                                                <div
                                                    className="rounded-lg overflow-hidden border border-stroke cursor-pointer relative h-48 w-full bg-gray-100"
                                                    onClick={() => setPreviewImage(selectedItem.bukti_foto || null)}
                                                >
                                                    <Image
                                                        src={selectedItem.bukti_foto}
                                                        alt="Bukti Pelanggaran"
                                                        fill
                                                        className="object-contain"
                                                        unoptimized
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                <div className="flex justify-end pt-4 border-t border-stroke">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-black bg-white border border-stroke rounded-lg hover:bg-gray-50"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

// Using generic permission or create new one in context if needed. 
// For now, assuming standard authorized access.
export default withPermission(ViolationPage, {
    permissions: ['giatpatrol.index'] // Re-using patrol permission or add new 'violation.index'
});
