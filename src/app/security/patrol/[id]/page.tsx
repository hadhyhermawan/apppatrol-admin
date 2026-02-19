'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { ArrowLeft, Edit, MapPin, Clock, User, Building, ExternalLink, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Swal from 'sweetalert2';

interface PointDetail {
    id: number;
    nama_titik: string;
    jam: string | null;
    lokasi: string | null;
    foto: string | null;
    urutan: number;
    latitude: number | null;
    longitude: number | null;
}

interface PatrolDetail {
    id: number;
    tanggal: string;
    jam_patrol: string;
    nik: string;
    nama_karyawan: string;
    kode_cabang: string;
    nama_cabang: string | null;
    status: string;
    foto_absen: string | null;
    points: PointDetail[];
}

export default function PatrolDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [data, setData] = useState<PatrolDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response: any = await apiClient.get(`/monitoring/patrol/${id}`);
            setData(response);
        } catch (error: any) {
            console.error("Failed to fetch detail", error);
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.detail || 'Gagal memuat data patroli',
                icon: 'error'
            }).then(() => {
                router.push('/security/patrol');
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    if (loading) {
        return (
            <MainLayout>
                <div className="flex h-screen items-center justify-center">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-brand-500 border-t-transparent"></div>
                </div>
            </MainLayout>
        );
    }

    if (!data) return null;

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Detail Patroli" />

            {previewImage && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="max-h-[90vh] max-w-full rounded-lg shadow-2xl object-contain"
                    />
                    <button
                        className="absolute top-5 right-5 text-white bg-black/50 rounded-full p-2 hover:bg-white/20"
                        onClick={() => setPreviewImage(null)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* LEFT COLUMN: INFO & FOTO ABSEN */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Information Card */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </button>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${data.status === 'complete'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                {data.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Waktu Patroli</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {data.tanggal}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Jam: {data.jam_patrol}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                                    <User className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Petugas</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {data.nama_karyawan}
                                    </p>
                                    <p className="text-xs text-gray-500">NIK: {data.nik}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                                    <Building className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Lokasi</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {data.nama_cabang || data.kode_cabang}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Foto Absen Card */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Foto Absen</h3>
                        <div className="overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                            {data.foto_absen ? (
                                <img
                                    src={data.foto_absen}
                                    alt="Foto Absen"
                                    className="h-64 w-full object-cover transition-transform hover:scale-105 cursor-pointer"
                                    onClick={() => setPreviewImage(data.foto_absen)}
                                />
                            ) : (
                                <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                                    <User className="mb-2 h-12 w-12 opacity-20" />
                                    <span className="text-sm">Tidak ada foto</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: POINTS LIST */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Titik Patroli ({data.points.length})
                            </h3>
                            <button
                                onClick={fetchData}
                                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                                title="Refresh Data"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {data.points.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    Belum ada titik patroli yang diset.
                                </div>
                            ) : (
                                data.points.map((point) => (
                                    <div key={point.id} className="p-6 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <div className="flex flex-col gap-6 md:flex-row">
                                            {/* Point Image */}
                                            <div className="shrink-0 md:w-1/3">
                                                <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                                                    {point.foto ? (
                                                        <img
                                                            src={point.foto}
                                                            alt={point.nama_titik}
                                                            className="h-full w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => setPreviewImage(point.foto)}
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800">
                                                            <MapPin className="mb-2 h-8 w-8 opacity-20" />
                                                            <span className="text-xs">Belum discan</span>
                                                        </div>
                                                    )}

                                                    {/* Badge Urutan */}
                                                    <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-md">
                                                        {point.urutan}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Point Info */}
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                                        {point.nama_titik}
                                                    </h4>
                                                    {point.jam ? (
                                                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-900/30">
                                                            Selesai
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20">
                                                            Pending
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
                                                        <Clock className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {point.jam || '-'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800 col-span-1 sm:col-span-2">
                                                        <MapPin className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                            {point.lokasi || '-'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {point.lokasi && (
                                                    <a
                                                        href={`https://maps.google.com/?q=${point.lokasi}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        Lihat di Peta
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
