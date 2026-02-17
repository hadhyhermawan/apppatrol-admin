'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Search, Map as MapIcon, RefreshCw, Calendar, User } from 'lucide-react';
import { withPermission } from '@/hoc/withPermission';
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);

type PatrolTrack = {
    id: number;
    patrol_session_id: number;
    check_time: string;
    location_lat: string;
    location_long: string;
    status_aman: number;
    keterangan: string | null;
    foto: string | null;
    nik?: string;
    nama_petugas?: string;
    point_name?: string;
};

function MapTrackingPage() {
    const [data, setData] = useState<PatrolTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        // Set date on client side to prevent hydration match
        setSelectedDate(new Date().toISOString().slice(0, 10));

        // Fix Leaflet marker icon issue (client-side only)
        if (typeof window !== 'undefined') {
            import('leaflet').then((L) => {
                const DefaultIcon = L.default.icon({
                    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });
                L.default.Marker.prototype.options.icon = DefaultIcon;
            });
        }
    }, []);
    const [searchNik, setSearchNik] = useState('');

    // Default center (Jakarta)
    const defaultCenter: [number, number] = [-6.2088, 106.8456];
    const [center, setCenter] = useState<[number, number]>(defaultCenter);

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `/security/tracking?limit=500`;
            if (selectedDate) url += `&date_filter=${selectedDate}`;
            if (searchNik) url += `&nik=${searchNik}`;

            const response: any = await apiClient.get(url);
            if (Array.isArray(response)) {
                setData(response);

                // If data exists, center map on first item
                if (response.length > 0 && response[0].location_lat && response[0].location_long) {
                    setCenter([parseFloat(response[0].location_lat), parseFloat(response[0].location_long)]);
                }
            } else {
                setData([]);
            }
        } catch (error) {
            console.error("Failed to fetch tracking data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDate]); // Auto fetch on date change

    // Handler for search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Map Tracking" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 mb-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
                        <MapIcon className="w-6 h-6 text-brand-500" />
                        Monitoring Lokasi Patroli
                    </h2>
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full sm:w-40 rounded-lg border-[1.5px] border-stroke bg-transparent pl-10 pr-4 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500 text-sm"
                            />
                        </div>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari NIK..."
                                value={searchNik}
                                onChange={(e) => setSearchNik(e.target.value)}
                                className="w-full sm:w-40 rounded-lg border-[1.5px] border-stroke bg-transparent pl-10 pr-4 py-2.5 outline-none focus:border-brand-500 dark:border-strokedark dark:bg-meta-4 dark:focus:border-brand-500 text-sm"
                            />
                        </div>
                        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 transition shadow-sm">
                            <Search className="h-4 w-4" />
                            <span>Cari</span>
                        </button>
                        <button type="button" onClick={fetchData} className="inline-flex items-center justify-center gap-2 rounded-lg border border-stroke bg-white px-3 py-2 text-center font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white transition shadow-sm">
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    </form>
                </div>

                <div className="h-[500px] w-full rounded-xl overflow-hidden border border-stroke dark:border-strokedark z-0 relative">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm dark:bg-black/50">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-brand-500 border-t-transparent"></div>
                        </div>
                    )}

                    {typeof window !== 'undefined' && (
                        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {data.map((item) => {
                                if (!item.location_lat || !item.location_long) return null;
                                const pos: [number, number] = [parseFloat(item.location_lat), parseFloat(item.location_long)];
                                return (
                                    <Marker key={item.id} position={pos}>
                                        <Popup>
                                            <div className="text-sm">
                                                <p className="font-bold">{item.point_name}</p>
                                                <p>{item.nama_petugas} ({item.nik})</p>
                                                <p className="text-gray-500 text-xs">{new Date(item.check_time).toLocaleString('id-ID')}</p>
                                                <p className={`mt-1 font-semibold ${item.status_aman === 1 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {item.status_aman === 1 ? 'Aman' : 'Tidak Aman'}
                                                </p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MapContainer>
                    )}
                </div>
            </div>

            {/* List View Below Map */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Riwayat Checkpoint</h3>
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-left dark:bg-gray-800">
                                <th className="px-4 py-3 font-medium text-black dark:text-white text-sm">Waktu</th>
                                <th className="px-4 py-3 font-medium text-black dark:text-white text-sm">Petugas</th>
                                <th className="px-4 py-3 font-medium text-black dark:text-white text-sm">Lokasi Checkpoint</th>
                                <th className="px-4 py-3 font-medium text-black dark:text-white text-sm text-center">Status</th>
                                <th className="px-4 py-3 font-medium text-black dark:text-white text-sm">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Tidak ada data lokasi.</td></tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.id} className="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4/20">
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {new Date(item.check_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-black dark:text-white">
                                            {item.nama_petugas}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-black dark:text-white">
                                            {item.point_name}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.status_aman === 1
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {item.status_aman === 1 ? 'Aman' : 'Temuan'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {item.keterangan || '-'}
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

// Protect page with permission
export default withPermission(MapTrackingPage, {
    permissions: ['tracking.index']
});
