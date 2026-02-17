'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { RefreshCw, Smartphone, Search, AlertTriangle, Monitor, Calendar } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

type MultiDeviceItem = {
    user_id: number;
    name: string;
    email: string;
    username: string;
    kode_cabang: string | null;
    nama_cabang: string | null;
    device_count: number;
    devices: string; // "Device1|||Device2|||..."
    last_login: string;
};

export default function UtilitiesMultiDevicePage() {
    const [data, setData] = useState<MultiDeviceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    useEffect(() => {
        flatpickr(".flatpickr-date", {
            dateFormat: "Y-m-d",
            allowInput: true,
            onChange: (selectedDates, dateStr, instance) => {
                const element = instance.element as HTMLInputElement;
                if (element.name === "from") setFromDate(dateStr);
                if (element.name === "to") setToDate(dateStr);
            }
        });
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (fromDate) params.append('from', fromDate);
            if (toDate) params.append('to', toDate);
            params.append('limit', '50'); // Limit top 50

            const response: any = await apiClient.get(`/utilities/multi-device?${params.toString()}`);
            if (Array.isArray(response)) {
                setData(response);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch multi-device reports", error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleIgnore = (userId: number, device: string) => {
        Swal.fire({
            title: 'Ignore Device?',
            text: `Device "${device}" akan dikecualikan dari laporan multi-device user ini.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Ignore!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await apiClient.post('/utilities/multi-device/ignore', { user_id: userId, device: device });
                    Swal.fire('Ignored!', 'Device berhasil di-ignore.', 'success');
                    fetchData();
                } catch (error) {
                    Swal.fire('Gagal!', 'Gagal meng-ignore device.', 'error');
                }
            }
        });
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Multi Device Report" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-yellow-500" />
                        Laporan Login Multi Device
                    </h2>
                    <div className="flex gap-3">
                        <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2.5 rounded-lg border border-stroke bg-white px-4 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-900/50 dark:text-yellow-200">
                    Laporan ini menampilkan user yang login menggunakan <strong>lebih dari 1 device unik</strong> dalam periode yang dipilih.
                </div>

                {/* Filter Section */}
                <div className="mb-6 flex flex-wrap gap-4 items-end">
                    <div className="w-full sm:w-auto relative">
                        <label className="text-xs text-gray-500 mb-1 block">Dari Tanggal</label>
                        <div className="relative">
                            <input
                                name="from"
                                type="text"
                                placeholder="YYYY-MM-DD"
                                className="flatpickr-date w-full sm:w-40 rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500 text-sm"
                            />
                            <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                    <div className="w-full sm:w-auto relative">
                        <label className="text-xs text-gray-500 mb-1 block">Sampai Tanggal</label>
                        <div className="relative">
                            <input
                                name="to"
                                type="text"
                                placeholder="YYYY-MM-DD"
                                className="flatpickr-date w-full sm:w-40 rounded-lg border-[1.5px] border-stroke bg-transparent px-3 py-2 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500 text-sm"
                            />
                            <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                    <button onClick={() => fetchData()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-opacity-90 transition shadow-sm h-[38px]">
                        <Search className="h-4 w-4" /> Cari
                    </button>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center w-12">No</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">User</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Cabang</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white text-center">Jml Device</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Daftar Device</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Last Login</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data multi-device...</td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Tidak ada user dengan multi-device login pada periode ini.</td></tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={item.user_id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20 align-top">
                                        <td className="px-4 py-4 text-center">
                                            <p className="text-black dark:text-white text-sm">{idx + 1}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-black dark:text-white">{item.name}</span>
                                                <span className="text-xs text-gray-500">{item.email}</span>
                                                <span className="text-xs text-brand-500">{item.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-black dark:text-white">{item.nama_cabang || '-'}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="inline-flex items-center justify-center px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                                {item.device_count}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                {item.devices.split('|||').map((dev, i) => (
                                                    <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded border border-gray-100 dark:border-gray-700">
                                                        <div className="flex items-center gap-2">
                                                            <Smartphone className="w-3 h-3 text-gray-400" />
                                                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[200px]" title={dev}>{dev}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleIgnore(item.user_id, dev)}
                                                            className="text-[10px] text-gray-400 hover:text-red-500 px-1 border border-transparent hover:border-red-200 rounded"
                                                            title="Ignore device ini"
                                                        >
                                                            Ignore
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {new Date(item.last_login).toLocaleString()}
                                            </span>
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
