'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import apiClient from '@/lib/api';
import {
    Users, Search, Filter, RefreshCw, Battery, MapPin,
    Wifi, WifiOff, Clock, User, Building, Radio
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import Image from 'next/image';

// Leaflet components dynamic import
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
const Polyline = dynamic(
    () => import('react-leaflet').then((mod) => mod.Polyline),
    { ssr: false }
);

// Fix Leaflet icons
import L from 'leaflet';

const createCustomIcon = (color: string) => {
    // A simple custom marker using divIcon or just standard marker with hue rotate
    // For simplicity, let's use standard markers but maybe different sizes or opacity
    // Or we can use L.divIcon with HTML content (Lucide icon inside)
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background-color: ${color};
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        ">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div style="
            width: 0; 
            height: 0; 
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid ${color};
            margin: -2px auto 0;
        "></div>`,
        iconSize: [30, 40],
        iconAnchor: [15, 40],
        popupAnchor: [0, -40]
    });
};

interface EmployeeData {
    nik: string;
    nama_karyawan: string;
    kode_cabang: string;
    nama_cabang: string;
    latitude: number | null;
    longitude: number | null;
    is_online: number;
    battery_level: number | null;
    is_charging: number;
    last_seen: string | null;
    menit_lalu: number | null;
    radius_status_label: string;
    radius_status_tone: string;
    shift_label: string;
    shift_status_label: string;
    shift_status_tone: string;
    distance_to_office_meter: number | null;
}

export default function TrackingView() {
    const [employees, setEmployees] = useState<EmployeeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOnline, setFilterOnline] = useState<string>('all'); // all, online, offline
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);
    const [historyPath, setHistoryPath] = useState<[number, number][]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const mapRef = useRef<L.Map>(null);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/employee-tracking/map-data');
            if (response && response.data) {
                setEmployees(response.data);
            }
        } catch (error) {
            console.error("Error fetching tracking data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (nik: string) => {
        setLoadingHistory(true);
        setHistoryPath([]);
        try {
            const response = await apiClient.get(`/employee-tracking/${nik}/history`);
            // API returns List[HistoryDTO] directly, so response IS the array (due to apiClient interceptor)
            const historyData = Array.isArray(response) ? response : (response.data || []);

            if (Array.isArray(historyData)) {
                const path = historyData
                    .filter((h: any) => h.latitude && h.longitude)
                    .map((h: any) => [parseFloat(h.latitude), parseFloat(h.longitude)] as [number, number]);
                setHistoryPath(path);
            }
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
        // Auto refresh every 30 seconds
        const interval = setInterval(fetchEmployees, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.nama_karyawan.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.nik.includes(searchTerm);
        const matchesOnline = filterOnline === 'all'
            ? true
            : filterOnline === 'online' ? emp.is_online === 1 : emp.is_online === 0;

        return matchesSearch && matchesOnline;
    });

    const handleFlyTo = (emp: EmployeeData) => {
        setSelectedEmployee(emp);
        setHistoryPath([]); // Reset history on new selection
        if (mapRef.current && emp.latitude && emp.longitude) {
            mapRef.current.flyTo([emp.latitude, emp.longitude], 16, {
                duration: 1.5
            });
        }
    };

    // Center of Indonesia roughly, or default
    const defaultCenter: [number, number] = [-2.5489, 118.0149];
    const zoomLevel = 5;

    return (
        <div className="flex h-[calc(100vh-120px)] w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm relative">

            {/* Sidebar List */}
            <div className="w-96 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 shadow-xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-500" />
                            Employee Tracking
                        </h2>
                        <button
                            onClick={fetchEmployees}
                            className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${loading ? 'animate-spin' : ''}`}
                            title="Refresh Data"
                        >
                            <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari nama atau NIK..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none"
                            />
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={filterOnline}
                                onChange={(e) => setFilterOnline(e.target.value)}
                                className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                            >
                                <option value="all">Semua Status</option>
                                <option value="online">Online</option>
                                <option value="offline">Offline</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Total: <strong>{filteredEmployees.length}</strong> Karyawan</span>
                        <span>Online: <strong>{filteredEmployees.filter(e => e.is_online === 1).length}</strong></span>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                    {filteredEmployees.map((emp) => (
                        <div
                            key={emp.nik}
                            onClick={() => handleFlyTo(emp)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedEmployee?.nik === emp.nik
                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10 ring-1 ring-brand-500'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-300 dark:hover:border-brand-700'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{emp.nama_karyawan}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{emp.nik}</p>
                                </div>
                                <div className={`w-2.5 h-2.5 rounded-full ${emp.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} title={emp.is_online ? 'Online' : 'Offline'} />
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                <Building className="w-3 h-3" />
                                <span className="line-clamp-1">{emp.nama_cabang || '-'}</span>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${emp.radius_status_tone === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        emp.radius_status_tone === 'danger' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                        }`}>
                                        {emp.distance_to_office_meter ? `${emp.distance_to_office_meter}m` : 'N/A'}
                                    </span>
                                </div>
                                {emp.battery_level !== null && (
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <Battery className={`w-3 h-3 ${emp.battery_level < 20 ? 'text-red-500' : 'text-green-500'}`} />
                                        <span>{emp.battery_level}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredEmployees.length === 0 && (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p>Tidak ada data karyawan ditemukan.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative z-0 bg-gray-100 dark:bg-gray-900">
                {typeof window !== 'undefined' && (
                    <MapContainer
                        center={defaultCenter}
                        zoom={zoomLevel}
                        style={{ height: '100%', width: '100%' }}
                        ref={mapRef}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {historyPath.length > 0 && (
                            <Polyline positions={historyPath} color="blue" weight={4} opacity={0.7} dashArray="10, 10" />
                        )}

                        {filteredEmployees.map(emp => {
                            if (!emp.latitude || !emp.longitude) return null;

                            const markerColor = emp.is_online ? '#10B981' : '#9CA3AF'; // Green or Gray

                            return (
                                <Marker
                                    key={emp.nik}
                                    position={[emp.latitude, emp.longitude]}
                                    icon={createCustomIcon(markerColor)}
                                    eventHandlers={{
                                        click: () => {
                                            setSelectedEmployee(emp);
                                            setHistoryPath([]); // Reset logic if clicking marker
                                        },
                                    }}
                                >
                                    <Popup>
                                        <div className="min-w-[200px]">
                                            <div className="flex items-center gap-3 mb-3 border-b pb-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${emp.is_online ? 'bg-green-500' : 'bg-gray-400'}`}>
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-base">{emp.nama_karyawan}</h3>
                                                    <p className="text-xs text-gray-500">{emp.nik}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Status:</span>
                                                    <span className={`font-medium ${emp.is_online ? 'text-green-600' : 'text-gray-500'}`}>
                                                        {emp.is_online ? 'Online' : 'Offline'}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Last Seen:</span>
                                                    <span className="text-gray-700">
                                                        {emp.menit_lalu !== null && emp.menit_lalu < 60
                                                            ? `${emp.menit_lalu} menit lalu`
                                                            : new Date(emp.last_seen || '').toLocaleString('id-ID')}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Lokasi:</span>
                                                    <span className={`font-medium ${emp.radius_status_tone === 'success' ? 'text-green-600' : 'text-red-500'
                                                        }`}>
                                                        {emp.radius_status_label}
                                                    </span>
                                                </div>

                                                {emp.shift_label && emp.shift_label !== '-' && (
                                                    <div className="mt-2 pt-2 border-t text-xs">
                                                        <div className="font-semibold text-gray-700 mb-1">Shift: {emp.shift_label}</div>
                                                        <div className={`inline-block px-2 py-0.5 rounded text-[10px] ${emp.shift_status_tone === 'success' ? 'bg-green-100 text-green-700' :
                                                            emp.shift_status_tone === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {emp.shift_status_label}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="mt-3 pt-2 border-t flex justify-end">
                                                    <button
                                                        onClick={() => fetchHistory(emp.nik)}
                                                        disabled={loadingHistory}
                                                        className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded hover:bg-brand-600 transition flex items-center gap-1 disabled:opacity-50"
                                                    >
                                                        {loadingHistory ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                                                        Lihat Riwayat
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                )}

                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm pointer-events-none">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex items-center gap-3">
                            <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
                            <span className="font-medium text-gray-700 dark:text-white">Memuat Peta...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
