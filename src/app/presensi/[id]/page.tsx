'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import apiClient from '@/lib/api';
import { ArrowLeft, Clock, MapPin, User, Building, Calendar, Briefcase, Info, X } from 'lucide-react';
import Image from 'next/image';
import clsx from 'clsx';
import { withPermission } from '@/hoc/withPermission';

type PresensiItem = {
    id: number;
    nik: string;
    nama_karyawan: string;
    nama_dept: string;
    nama_jam_kerja: string;
    jam_in: string;
    jam_out: string;
    foto_in: string | null;
    foto_out: string | null;
    lokasi_in: string | null;
    lokasi_out: string | null;
    status_kehadiran: string;
};

function PresensiDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [data, setData] = useState<PresensiItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        if (params.id) {
            fetchDetail(params.id as string);
        }
    }, [params.id]);

    const fetchDetail = async (id: string) => {
        setLoading(true);
        try {
            const response: any = await apiClient.get(`/monitoring/presensi/${id}`);
            if (response) {
                setData(response);
            }
        } catch (error) {
            console.error("Failed to fetch detail", error);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const s = status ? status.toLowerCase() : '';
        let badgeClass = "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400";
        let label = status || '-';

        if (s === 'h' || s === 'hadir') {
            badgeClass = "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400";
            label = "Hadir";
        } else if (s === 'i' || s === 'izin') {
            badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
            label = "Izin";
        } else if (s === 's' || s === 'sakit') {
            badgeClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400";
            label = "Sakit";
        } else if (s === 'a' || s === 'alpha') {
            badgeClass = "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
            label = "Alpha";
        }

        return (
            <span className={clsx("inline-flex rounded-full px-3 py-1 text-sm font-medium", badgeClass)}>
                {label}
            </span>
        );
    };

    const getMapsUrl = (coords: string | null) => {
        if (!coords) return '#';
        return `https://www.google.com/maps?q=${coords}`;
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                </div>
            </MainLayout>
        );
    }

    if (!data) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
                    <Info className="h-12 w-12 mb-2" />
                    <p>Data tidak ditemukan</p>
                    <button onClick={() => router.back()} className="mt-4 text-brand-500 hover:underline">Kembali</button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <PageBreadcrumb pageTitle="Detail Presensi" />
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:hover:bg-opacity-90 transition shadow-sm w-fit"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                </button>
            </div>

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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column: Use Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-24 w-24 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center text-3xl font-bold mb-4">
                                {data.nama_karyawan ? data.nama_karyawan.substring(0, 2).toUpperCase() : '??'}
                            </div>
                            <h3 className="text-xl font-semibold text-black dark:text-white mb-1">{data.nama_karyawan}</h3>
                            <p className="text-sm text-gray-500 mb-4">{data.nik}</p>
                            <StatusBadge status={data.status_kehadiran} />
                        </div>

                        <div className="mt-8 space-y-4 border-t border-stroke pt-6 dark:border-strokedark">
                            <div className="flex items-center gap-3 text-sm">
                                <Building className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Departemen</p>
                                    <p className="font-medium text-black dark:text-white">{data.nama_dept}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Briefcase className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Shift Kerja</p>
                                    <p className="font-medium text-black dark:text-white">{data.nama_jam_kerja}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Attendance Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Time & Validations */}
                    <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
                        <h4 className="text-lg font-semibold text-black dark:text-white mb-6">Waktu & Validasi</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Check In */}
                            <div className="bg-gray-50 dark:bg-meta-4/30 rounded-xl p-4 border border-stroke dark:border-strokedark">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-black dark:text-white">Jam Masuk</span>
                                </div>

                                <p className="text-2xl font-bold text-black dark:text-white mb-4">{data.jam_in}</p>

                                <div className="space-y-3">
                                    {data.lokasi_in ? (
                                        <a href={getMapsUrl(data.lokasi_in)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-sm text-brand-500 hover:underline">
                                            <MapPin className="h-4 w-4 mt-0.5" />
                                            <span className="break-all">{data.lokasi_in}</span>
                                        </a>
                                    ) : (
                                        <span className="flex items-center gap-2 text-sm text-gray-400">
                                            <MapPin className="h-4 w-4" />
                                            Tidak ada lokasi
                                        </span>
                                    )}

                                    {data.foto_in ? (
                                        <div
                                            className="relative h-80 w-full rounded-lg overflow-hidden border border-stroke dark:border-strokedark cursor-pointer group"
                                            onClick={() => setPreviewImage(data.foto_in)}
                                        >
                                            <Image
                                                src={data.foto_in}
                                                alt="Foto Masuk"
                                                fill
                                                className="object-cover transition group-hover:scale-105"
                                                unoptimized
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Lihat Foto</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-80 w-full rounded-lg bg-gray-200 dark:bg-meta-4 flex items-center justify-center text-gray-400 text-sm">
                                            Tidak ada foto
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Check Out */}
                            <div className="bg-gray-50 dark:bg-meta-4/30 rounded-xl p-4 border border-stroke dark:border-strokedark">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-black dark:text-white">Jam Pulang</span>
                                </div>

                                <p className="text-2xl font-bold text-black dark:text-white mb-4">{data.jam_out}</p>

                                <div className="space-y-3">
                                    {data.lokasi_out ? (
                                        <a href={getMapsUrl(data.lokasi_out)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-sm text-brand-500 hover:underline">
                                            <MapPin className="h-4 w-4 mt-0.5" />
                                            <span className="break-all">{data.lokasi_out}</span>
                                        </a>
                                    ) : (
                                        <span className="flex items-center gap-2 text-sm text-gray-400">
                                            <MapPin className="h-4 w-4" />
                                            Tidak ada lokasi
                                        </span>
                                    )}

                                    {data.foto_out ? (
                                        <div
                                            className="relative h-80 w-full rounded-lg overflow-hidden border border-stroke dark:border-strokedark cursor-pointer group"
                                            onClick={() => setPreviewImage(data.foto_out)}
                                        >
                                            <Image
                                                src={data.foto_out}
                                                alt="Foto Pulang"
                                                fill
                                                className="object-cover transition group-hover:scale-105"
                                                unoptimized
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Lihat Foto</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-80 w-full rounded-lg bg-gray-200 dark:bg-meta-4 flex items-center justify-center text-gray-400 text-sm">
                                            Tidak ada foto
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

export default withPermission(PresensiDetailPage, {
    permissions: ['presensi.show']
});
