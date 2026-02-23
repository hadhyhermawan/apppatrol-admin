'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/layout/MainLayout';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { TrendingUp, TrendingDown, Users, Shield, Clock, MapPin, Briefcase, UserCheck, AlertCircle, Activity, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

import apiClient from '@/lib/api';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false }) as any;

type StockCard = {
    title: string;
    value: number;
    change: number;
    changePercent: number;
    trend: 'up' | 'down';
    icon: any;
    color: string;
};

type DashboardData = {
    stats: any;
    top_cabang: any[];
    patroli_aktif_list: any[];
    presensi_open_list: any[];
    tidak_hadir_list: any[];
    recent_activities: any[];
    chart_data: {
        categories: string[];
        series: { name: string; data: number[] }[];
    };
    tanggal: string;
};

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stockData, setStockData] = useState<StockCard[]>([]);
    const [dashData, setDashData] = useState<DashboardData | null>(null);

    useEffect(() => {
        fetchDashboardData();

        // Start polling security alerts
        const loadAlerts = async () => {
            await pollSecurityAlerts();
        };
        loadAlerts();
        const intervalId = setInterval(loadAlerts, 20000); // Check every 20s
        return () => clearInterval(intervalId);
    }, []);

    const pollSecurityAlerts = async () => {
        try {
            // Pre-check if sweetalert is currently active so we don't stack it
            if (Swal.isVisible()) return;

            const res: any = await apiClient.get('/security/notifications/security-alerts');

            // Check priorities. Force Closes removed to avoid dashboard spam (only via notifications icon now)
            const alerts = [...(res?.radius_bypass_requests || []), ...(res?.fake_gps_alerts || []), ...(res?.face_verify_fails || [])];
            if (alerts.length > 0) {
                const alert = alerts[0]; // grab the most recent one

                const titleMap: any = {
                    'FAKE_GPS_ALERT': '🚨 Peringatan Fake GPS!',
                    'APP_FORCE_CLOSE': '⚠️ Aplikasi Ditutup Paksa!',
                    'FACE_VERIFY_FAIL': '🚫 Gagal Pindai Wajah!',
                    'RADIUS_BYPASS': '🚧 Permintaan Izin Luar Tapak'
                };

                const typeMap: any = {
                    'FAKE_GPS_ALERT': 'sistem mendeteksi adanya penggunaan aplikasi Fake GPS',
                    'APP_FORCE_CLOSE': 'sistem mendeteksi bahwa aplikasi dipaksa berhenti (Force Close)',
                    'FACE_VERIFY_FAIL': 'sistem mendeteksi kegagalan verifikasi wajah secara berulang',
                    'RADIUS_BYPASS': alert.detail ? `mengajukan izin bypass radius karena: <b>${alert.detail}</b>` : 'mengajukan izin absen di luar batas tapak/radius yang ditentukan'
                }

                const result = await Swal.fire({
                    title: titleMap[alert.type] || 'Peringatan Keamanan',
                    html: `Personel <b>${alert.nama}</b> (${alert.nik}) di <b>${alert.cabang}</b>.<br/><br/>${typeMap[alert.type]}.`,
                    icon: alert.type === 'RADIUS_BYPASS' ? 'info' : 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: alert.type === 'RADIUS_BYPASS' ? 'Setujui & Izinkan' : 'Tandai Sudah Dilihat',
                    cancelButtonText: 'Lihat Daftar Lengkap',
                    allowOutsideClick: false,
                });

                if (result.isConfirmed) {
                    if (alert.type === 'RADIUS_BYPASS') {
                        await apiClient.post('/security/notifications/approve-bypass', { id: alert.id });
                    } else {
                        await apiClient.post('/security/notifications/mark-read', { id: alert.id });
                    }
                    pollSecurityAlerts(); // Check if there's more!
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    router.push('/security/violations');
                }
            }
        } catch (error) {
            console.error("Failed to poll security alerts", error);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const response: any = await apiClient.get('/dashboard');
            setDashData(response);

            // Build stock cards from real data
            const stats = response.stats;
            setStockData([
                {
                    title: 'Total Kehadiran',
                    value: stats.kehadiran.hadir,
                    change: stats.kehadiran.change,
                    changePercent: stats.kehadiran.changePercent,
                    trend: stats.kehadiran.change >= 0 ? 'up' : 'down',
                    icon: UserCheck,
                    color: 'blue'
                },
                {
                    title: 'Patroli Aktif',
                    value: stats.patroli_aktif.value,
                    change: stats.patroli_aktif.change,
                    changePercent: stats.patroli_aktif.changePercent,
                    trend: 'up',
                    icon: Shield,
                    color: 'green'
                },
                {
                    title: 'Izin & Sakit',
                    value: stats.izin_sakit.value,
                    change: stats.izin_sakit.change,
                    changePercent: stats.izin_sakit.changePercent,
                    trend: 'down',
                    icon: AlertCircle,
                    color: 'orange'
                },
                {
                    title: 'Total Karyawan',
                    value: stats.total_karyawan.value,
                    change: stats.total_karyawan.change,
                    changePercent: stats.total_karyawan.changePercent,
                    trend: 'up',
                    icon: Users,
                    color: 'purple'
                }
            ]);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <PageBreadcrumb pageTitle="Dashboard" />
                <div className="flex items-center justify-center h-96">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent"></div>
                </div>
            </MainLayout>
        );
    }

    const colorClasses = {
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-950',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-800',
            icon: 'bg-blue-100 dark:bg-blue-900'
        },
        green: {
            bg: 'bg-green-50 dark:bg-green-950',
            text: 'text-green-600 dark:text-green-400',
            border: 'border-green-200 dark:border-green-800',
            icon: 'bg-green-100 dark:bg-green-900'
        },
        orange: {
            bg: 'bg-orange-50 dark:bg-orange-950',
            text: 'text-orange-600 dark:text-orange-400',
            border: 'border-orange-200 dark:border-orange-800',
            icon: 'bg-orange-100 dark:bg-orange-900'
        },
        purple: {
            bg: 'bg-purple-50 dark:bg-purple-950',
            text: 'text-purple-600 dark:text-purple-400',
            border: 'border-purple-200 dark:border-purple-800',
            icon: 'bg-purple-100 dark:bg-purple-900'
        }
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Dashboard" />

            {/* Stock-style Cards Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stockData.map((stock, idx) => {
                    const Icon = stock.icon;
                    const TrendIcon = stock.trend === 'up' ? TrendingUp : TrendingDown;
                    const colors = colorClasses[stock.color as keyof typeof colorClasses];

                    return (
                        <div
                            key={idx}
                            className="group relative overflow-hidden rounded-2xl border border-stroke bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-strokedark dark:bg-boxdark"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className={`mb-3 inline-flex rounded-xl ${colors.icon} p-3`}>
                                        <Icon className={`h-6 w-6 ${colors.text}`} />
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {stock.title}
                                    </h4>
                                    <h3 className="mt-2 text-3xl font-bold text-black dark:text-white">
                                        {stock.value.toLocaleString()}
                                    </h3>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${stock.trend === 'up'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                    }`}>
                                    <TrendIcon className="h-3 w-3" />
                                    {Math.abs(stock.changePercent)}%
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {stock.change > 0 ? '+' : ''}{stock.change} dari kemarin
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Portfolio Performance - Main Chart */}
            <div className="mt-6 rounded-2xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke px-6 py-5 dark:border-strokedark">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-black dark:text-white">
                                Tren Kehadiran & Aktivitas
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Statistik 30 hari terakhir
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-4">
                    {dashData && dashData.chart_data ? (
                        <div className="-ml-5">
                            <ReactApexChart
                                options={{
                                    chart: {
                                        type: 'area',
                                        height: 350,
                                        fontFamily: 'Satoshi, sans-serif',
                                        toolbar: { show: false },
                                    },
                                    colors: ['#3C50E0', '#80CAEE'],
                                    fill: {
                                        type: 'gradient',
                                        gradient: {
                                            shadeIntensity: 1,
                                            opacityFrom: 0.7,
                                            opacityTo: 0.9,
                                            stops: [0, 90, 100],
                                        },
                                    },
                                    dataLabels: { enabled: false },
                                    stroke: { curve: 'smooth', width: 2 },
                                    xaxis: {
                                        categories: dashData.chart_data.categories,
                                        axisBorder: { show: false },
                                        axisTicks: { show: false },
                                    },
                                    yaxis: {
                                        title: { style: { fontSize: '0px' } },
                                    },
                                    grid: {
                                        strokeDashArray: 5,
                                        yaxis: { lines: { show: true } },
                                    },
                                    tooltip: {
                                        theme: 'light',
                                        x: { show: true },
                                    },
                                }}
                                series={dashData.chart_data.series}
                                type="area"
                                height={350}
                            />
                        </div>
                    ) : (
                        <div className="flex h-80 items-center justify-center bg-gray-50 dark:bg-meta-4">
                            <div className="text-center">
                                <Activity className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600" />
                                <p className="mt-3 text-sm text-gray-500">Loading Chart Data...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Stock List Table */}
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* Left Column - Top Stocks */}
                <div className="rounded-2xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                        <h3 className="font-semibold text-black dark:text-white">Top Cabang Performance</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {dashData && dashData.top_cabang.slice(0, 5).map((cabang: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-xl border border-stroke p-4 transition-all hover:border-brand-500 hover:shadow-md dark:border-strokedark dark:hover:border-brand-500"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 font-bold text-brand-500">
                                            {cabang.kode_cabang.slice(0, 2)}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-black dark:text-white">{cabang.kode_cabang}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{cabang.nama_cabang}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-black dark:text-white">{cabang.total_karyawan} Karyawan</p>
                                        <p className={`flex items-center gap-1 text-sm font-medium ${cabang.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {cabang.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {Math.abs(cabang.change)}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Activity Feed */}
                <div className="rounded-2xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                        <h3 className="font-semibold text-black dark:text-white">Recent Activities</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {dashData && dashData.recent_activities && dashData.recent_activities.length > 0 ? (
                                dashData.recent_activities.map((activity, idx) => {
                                    // Map string icon to component
                                    const IconComponent =
                                        activity.icon === 'UserCheck' ? UserCheck :
                                            activity.icon === 'Shield' ? Shield :
                                                activity.icon === 'Clock' ? Clock :
                                                    activity.icon === 'AlertCircle' ? AlertCircle : Activity;

                                    const colorMap: any = {
                                        green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
                                        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
                                        orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
                                        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
                                    };

                                    return (
                                        <div key={idx} className="flex items-start gap-4">
                                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${colorMap[activity.color] || colorMap.blue}`}>
                                                <IconComponent className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-black dark:text-white">{activity.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{activity.action}</p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: id })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-center text-gray-500">Belum ada aktivitas hari ini.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Stats Grid */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    {
                        label: 'Presensi Terbuka',
                        value: dashData?.stats?.presensi_open || 0,
                        subtitle: 'Belum absen pulang',
                        icon: Clock
                    },
                    {
                        label: 'Patroli Target',
                        value: dashData?.stats?.target_patroli || 0,
                        subtitle: 'Jadwal Aktif',
                        icon: Shield
                    },
                    {
                        label: 'Tamu Hari Ini',
                        value: dashData?.stats?.tamu_hari_ini || 0,
                        subtitle: 'Pengunjung terdaftar',
                        icon: Users
                    },
                    {
                        label: 'Barang Keluar/Masuk',
                        value: dashData?.stats?.barang_hari_ini || 0,
                        subtitle: 'Total transaksi barang',
                        icon: Briefcase
                    }
                ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={idx}
                            className="flex items-center gap-4 rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10">
                                <Icon className="h-7 w-7 text-brand-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-black dark:text-white">{stat.value}</h3>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                                <p className="text-xs text-gray-500">{stat.subtitle}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </MainLayout>
    );
}
