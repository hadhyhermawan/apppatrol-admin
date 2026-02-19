'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Image from 'next/image';
import { User, Smartphone, MapPin, Building2, Briefcase, Calendar, Hash, FileText, ArrowLeft, Edit, Mail, Fingerprint, Trash, Plus, ScanFace, Coins, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';

interface KaryawanDetail {
    nik: string;
    nama_karyawan: string;
    no_ktp: string;
    no_hp: string;
    tempat_lahir: string | null;
    tanggal_lahir: string | null;
    alamat: string | null;
    jenis_kelamin: string | null;
    foto: string | null;
    status_aktif_karyawan: string;
    nama_dept: string;
    nama_jabatan: string;
    nama_cabang: string;
    tanggal_masuk: string | null;
    tanggal_nonaktif: string | null;
    tanggal_off_gaji: string | null;
    no_kartu_anggota: string | null;
    masa_aktif_kartu_anggota: string | null;
    sisa_hari_anggota: number | null;
    keterangan_status_kawin: string | null;
    pendidikan_terakhir: string | null;
    no_ijazah: string | null;
    kontak_darurat_nama: string | null;
    kontak_darurat_hp: string | null;
    kontak_darurat_alamat: string | null;
    foto_ktp: string | null;
    foto_kartu_anggota: string | null;
    foto_ijazah: string | null;
    lock_location: string;
    lock_jam_kerja: string;
    lock_device_login: string;
    allow_multi_device: string;
    pin: string | null;

    // User Data (Relation)
    user?: {
        username: string;
        email: string;
    } | null;

    // Face Recognition (Relation)
    wajah?: {
        id: number;
        wajah: string;
    }[];
}

import { useParams } from 'next/navigation';
import { use } from 'react';

export default function KaryawanDetailPage({ params }: { params: Promise<{ nik: string }> }) {
    const router = useRouter();
    // Unwrap params using React.use() for Next.js 15+
    const unwrappedParams = use(params);
    const nikParam = unwrappedParams.nik;

    const [data, setData] = useState<KaryawanDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'face' | 'mutasi' | 'gaji' | 'tunjangan'>('face');

    const fetchDetail = async () => {
        // Strict validation to prevent invalid API calls
        if (!nikParam ||
            nikParam === 'undefined' ||
            nikParam === 'null' ||
            nikParam.length < 5) {
            console.warn("Skipping fetchDetail with invalid NIK:", nikParam);
            return;
        }

        try {
            const nik = decodeURIComponent(nikParam);
            const response: any = await apiClient.get(`/master/karyawan/${nik}`);
            if (response.status && response.data) {
                setData(response.data);
            } else {
                router.push('/master/karyawan');
            }
        } catch (error) {
            console.error("Failed to fetch detail", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (nikParam && nikParam !== 'undefined') {
            fetchDetail();
        }
    }, [nikParam, router]);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const getPhotoUrl = (filename: string | null) => {
        if (!filename) return null;
        return filename;
    };

    const handleHapusWajah = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus Wajah?',
            text: "Data wajah ini akan dihapus permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/facerecognition/${id}`);
                Swal.fire('Terhapus!', 'Data wajah berhasil dihapus.', 'success');
                fetchDetail();
            } catch (error) {
                Swal.fire('Gagal!', 'Gagal menghapus data wajah.', 'error');
            }
        }
    };

    const handleHapusSemuaWajah = async () => {
        const result = await Swal.fire({
            title: 'Hapus SEMUA Wajah?',
            text: "Semua data wajah karyawan ini akan dihapus permanen! Tindakan ini tidak dapat dibatalkan.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus Semua!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                // Assuming route for delete all
                await apiClient.delete(`/facerecognition/delete-all/${data?.nik}`);
                Swal.fire('Terhapus!', 'Semua data wajah berhasil dihapus.', 'success');
                fetchDetail();
            } catch (error) {
                Swal.fire('Gagal!', 'Gagal menghapus semua data wajah.', 'error');
            }
        }
    };

    const handleAddWajah = async () => {
        if (!data) return;

        const { value: file } = await Swal.fire({
            title: 'Tambah Wajah',
            text: 'Upload foto wajah karyawan (Format: JPG/PNG)',
            input: 'file',
            inputAttributes: {
                'accept': 'image/*',
                'aria-label': 'Upload foto wajah'
            },
            showCancelButton: true,
            confirmButtonText: 'Upload',
            cancelButtonText: 'Batal',
            showLoaderOnConfirm: true,
            preConfirm: async (file) => {
                if (!file) {
                    Swal.showValidationMessage('Silakan pilih file foto terlebih dahulu');
                    return false;
                }

                // Validate size (max 2MB)
                if (file.size > 2 * 1024 * 1024) {
                    Swal.showValidationMessage('Ukuran file terlalu besar (Maks 2MB)');
                    return false;
                }

                const formData = new FormData();
                formData.append('nik', data.nik);
                formData.append('images[]', file); // Backend expects images[]

                try {
                    // Use the correct endpoint prefix for legacy router
                    const response: any = await apiClient.post('/android/masterwajah/store', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    // Backend returns 200 OK even for logic errors (e.g. max 5 faces)
                    // Check success flag manually based on legacy controller logic
                    if (response.success === false) {
                        const msg = response.message || 'Gagal menyimpan wajah';
                        Swal.showValidationMessage(msg);
                        return false; // Prevent closing
                    }

                    return true;
                } catch (error: any) {
                    console.error("Upload error:", error);
                    const msg = error.response?.data?.message || error.message || 'Gagal mengupload foto';
                    Swal.showValidationMessage(`Request failed: ${msg}`);
                    return false;
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        });

        if (file) {
            Swal.fire({
                title: 'Berhasil!',
                text: 'Foto wajah berhasil ditambahkan.',
                icon: 'success'
            });
            fetchDetail(); // Refresh data
        }
    };


    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-e-transparent"></div>
                </div>
            </MainLayout>
        );
    }

    if (!data) return null;

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Detail Karyawan" />

            {/* Header Profil */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-dark">
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                        {/* Foto Profil */}
                        <div className="relative h-32 w-32 rounded-lg border-4 border-white shadow-md bg-white dark:border-gray-700 dark:bg-gray-800 flex-shrink-0">
                            {data.foto ? (
                                <Image
                                    src={getPhotoUrl(data.foto)!}
                                    alt={data.nama_karyawan}
                                    fill
                                    className="rounded-lg object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-400">
                                    <User className="h-16 w-16" />
                                </div>
                            )}
                        </div>

                        {/* Info Utama */}
                        <div className="flex-grow text-center sm:text-left pt-2 sm:pt-0 pb-2">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{data.nama_karyawan}</h2>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <Hash className="h-4 w-4" /> <span>{data.nik}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4" /> <span>{data.nama_cabang}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Briefcase className="h-4 w-4" /> <span>{data.nama_jabatan}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex flex-col items-center sm:items-end gap-3 pb-2">
                            <span className={`inline-flex px-4 py-1.5 rounded-full text-sm font-semibold ${data.status_aktif_karyawan == '1'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                {data.status_aktif_karyawan == '1' ? 'Aktif' : 'Non Aktif'}
                            </span>
                            <div className="flex gap-2">
                                <Link
                                    href="/master/karyawan"
                                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Kembali
                                </Link>
                                <Link
                                    href={`/master/karyawan/edit/${data.nik}`}
                                    className="flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-600"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column: Data Karyawan & User */}
                <div className="space-y-6 lg:col-span-1">

                    {/* DATA KARYAWAN */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
                        <small className="mb-4 block text-xs font-bold uppercase tracking-wider text-gray-500">Data Karyawan</small>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Hash className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">NIK</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{data.nik}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-5 flex items-center justify-center text-gray-400 font-bold text-xs ring-1 ring-gray-300 rounded-sm">ID</div>
                                <div>
                                    <p className="text-xs text-gray-500">No. KTP</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{data.no_ktp}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Nama Lengkap</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{data.nama_karyawan}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Tempat, Tgl Lahir</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {data.tempat_lahir ? `${data.tempat_lahir}, ` : ''}{formatDate(data.tanggal_lahir)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Smartphone className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">No. HP</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {data.no_hp}
                                        {data.no_hp && (
                                            <a
                                                href={`https://wa.me/${data.no_hp.replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                className="ml-2 text-xs text-green-600 hover:underline"
                                            >
                                                Chat WA
                                            </a>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Building2 className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Departemen</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{data.nama_dept}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Briefcase className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Jabatan</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{data.nama_jabatan}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Tanggal Masuk</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(data.tanggal_masuk)}</p>
                                </div>
                            </div>
                            {data.status_aktif_karyawan === '0' && (
                                <>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-red-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Tanggal Nonaktif</p>
                                            <p className="text-sm font-medium text-red-600">{formatDate(data.tanggal_nonaktif)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-red-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Tanggal Off Gaji</p>
                                            <p className="text-sm font-medium text-red-600">{formatDate(data.tanggal_off_gaji)}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* DATA USER */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
                        <small className="mb-4 block text-xs font-bold uppercase tracking-wider text-gray-500">Data User Login</small>
                        {data.user ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Fingerprint className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Username</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{data.user.username}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{data.user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-5 flex items-center justify-center text-gray-400 text-xs">***</div>
                                    <div>
                                        <p className="text-xs text-gray-500">Password</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">********</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                User belum dibuat untuk karyawan ini.
                            </div>
                        )}
                    </div>

                    {/* Documents Gallery */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
                        <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                            Dokumen Pendukung
                        </h4>

                        <div className="grid grid-cols-1 gap-4">
                            {/* KTP */}
                            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                <p className="mb-2 text-xs font-medium text-gray-500 text-center">Foto KTP</p>
                                <div className="relative aspect-video w-full overflow-hidden rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    {data.foto_ktp ? (
                                        <div className="relative h-full w-full">
                                            {data.foto_ktp.toLowerCase().endsWith('.pdf') ? (
                                                <div className="flex h-full w-full flex-col items-center justify-center text-gray-500">
                                                    <FileText className="h-8 w-8 mb-1" />
                                                    <span className="text-xs">PDF Document</span>
                                                    <a href={getPhotoUrl(data.foto_ktp)!} target="_blank" className="mt-2 text-xs text-brand-500 hover:underline">Download</a>
                                                </div>
                                            ) : (
                                                <Image
                                                    src={getPhotoUrl(data.foto_ktp)!}
                                                    alt="KTP"
                                                    fill
                                                    className="object-contain"
                                                    unoptimized
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400">Tidak ada file</span>
                                    )}
                                </div>
                            </div>

                            {/* KTA */}
                            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                <p className="mb-2 text-xs font-medium text-gray-500 text-center">Kartu Anggota</p>
                                <div className="relative aspect-video w-full overflow-hidden rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    {data.foto_kartu_anggota ? (
                                        <div className="relative h-full w-full">
                                            {data.foto_kartu_anggota.toLowerCase().endsWith('.pdf') ? (
                                                <div className="flex h-full w-full flex-col items-center justify-center text-gray-500">
                                                    <FileText className="h-8 w-8 mb-1" />
                                                    <span className="text-xs">PDF Document</span>
                                                    <a href={getPhotoUrl(data.foto_kartu_anggota)!} target="_blank" className="mt-2 text-xs text-brand-500 hover:underline">Download</a>
                                                </div>
                                            ) : (
                                                <Image
                                                    src={getPhotoUrl(data.foto_kartu_anggota)!}
                                                    alt="KTA"
                                                    fill
                                                    className="object-contain"
                                                    unoptimized
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400">Tidak ada file</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Tabs & Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Tabs Navigation */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('face')}
                                className={`group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium ${activeTab === 'face'
                                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <ScanFace className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === 'face' ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                Face Recognition
                            </button>

                            <button
                                onClick={() => setActiveTab('mutasi')}
                                className={`group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium ${activeTab === 'mutasi'
                                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <TrendingUp className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === 'mutasi' ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                Mutasi/Promosi
                            </button>

                            <button
                                onClick={() => setActiveTab('gaji')}
                                className={`group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium ${activeTab === 'gaji'
                                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <Coins className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === 'gaji' ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                                Gaji & Tunjangan
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content: Face Recognition */}
                    {activeTab === 'face' && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-dark">
                            <div className="mb-6 flex items-center justify-between">
                                <button
                                    onClick={handleAddWajah}
                                    className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600 transition"
                                >
                                    <Plus className="h-4 w-4" />
                                    Tambah Wajah
                                </button>
                                <button
                                    onClick={handleHapusSemuaWajah}
                                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 transition"
                                >
                                    <Trash className="h-4 w-4" />
                                    Hapus Semua Wajah
                                </button>
                            </div>

                            {data.wajah && data.wajah.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                    {data.wajah.map((w, idx) => (
                                        <div key={idx} className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                                            <div className="aspect-square relative w-full">
                                                <Image
                                                    src={getPhotoUrl(w.wajah)!}
                                                    alt={`Wajah ${idx + 1}`}
                                                    fill
                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                    unoptimized
                                                />
                                            </div>
                                            <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                <button
                                                    onClick={() => handleHapusWajah(w.id)}
                                                    className="rounded-full bg-white p-1.5 text-red-500 shadow-md hover:bg-red-50 hover:text-red-600 dark:bg-gray-800 dark:text-red-400"
                                                    title="Hapus foto ini"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="mb-3 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                                        <ScanFace className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Belum ada data wajah</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tambahkan foto wajah untuk mengaktifkan fitur absensi wajah.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Placeholder for other tabs */}
                    {activeTab !== 'face' && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-dark">
                            <p className="text-gray-500 dark:text-gray-400">Fitur ini belum tersedia di frontend versi ini.</p>
                        </div>
                    )}

                </div>
            </div>
        </MainLayout>
    );
}
