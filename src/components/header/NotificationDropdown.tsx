"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import apiClient from "@/lib/api";
import { Bell, AlertTriangle, Lock, MapPin, UserX, FileText, CheckCircle, ShieldAlert, WifiOff, Smartphone } from "lucide-react";

type NotificationSummary = {
  ajuan_absen: number;
  lembur: number;
  device_lock: number;
  member_expiring: number;
  mock_location: number;
  radius_violation: number;
  total_security_alerts: number;
  total_approval_pending: number;
};

type AlertDetail = {
  nik: string;
  nama: string;
  cabang: string;
  type: string;
  time?: string;
  distance?: number;
  radius?: number;
};

type AlertDetailsResponse = {
  mock_locations: AlertDetail[];
  radius_violations: AlertDetail[];
  device_locks: AlertDetail[];
  member_expiring: AlertDetail[];
  force_closes: AlertDetail[];
  face_verify_fails: AlertDetail[];
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [details, setDetails] = useState<AlertDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch notification summary
  // Fetch notification summary & details
  const fetchData = async () => {
    try {
      setLoading(true);
      // Parallel fetch
      const [summaryRes, detailsRes]: any = await Promise.all([
        apiClient.get('/security/notifications/summary'),
        apiClient.get('/security/notifications/security-alerts')
      ]);

      setSummary(summaryRes);
      setDetails(detailsRes);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, []);

  function toggleDropdown() {
    setIsOpen(!isOpen);
    if (!isOpen) {
      if (!isOpen) {
        fetchData(); // Refresh on open
      }
    }
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const total = (summary?.total_security_alerts || 0) + (summary?.total_approval_pending || 0);
  const hasSecurityAlerts = (summary?.total_security_alerts || 0) > 0;

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-900 ${total > 0
            ? hasSecurityAlerts ? "bg-red-500" : "bg-orange-500"
            : "hidden"
            }`}
        >
          {total > 0 && (
            <span className={`absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping ${hasSecurityAlerts ? "bg-red-400" : "bg-orange-400"
              }`}></span>
          )}
        </span>

        <Bell size={20} className="fill-current" />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[80px] mt-[17px] flex w-[300px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[350px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifikasi {total > 0 && <span className="text-sm font-normal text-gray-500">({total})</span>}
          </h5>
        </div>

        <ul className="flex flex-col h-[300px] overflow-y-auto custom-scrollbar space-y-1">
          {total === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <CheckCircle size={48} className="mb-2 opacity-20" />
              <p className="text-sm">Tidak ada notifikasi baru</p>
            </div>
          )}

          {/* Security Alerts Section */}
          {(summary?.total_security_alerts || 0) > 0 && (
            <>
              <li className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Security Alerts
              </li>

              {/* Mock Location Details */}
              {details?.mock_locations?.map((alert, idx) => (
                <li key={`mock-${idx}`}>
                  <DropdownItem
                    onItemClick={closeDropdown}
                    className="flex gap-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-white/5"
                    href="/security/violations"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 shrink-0">
                      <ShieldAlert size={20} />
                    </div>
                    <div className="block">
                      <span className="block font-medium text-black dark:text-white text-sm">
                        Fake GPS: {alert.nama}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {alert.cabang}
                      </span>
                    </div>
                  </DropdownItem>
                </li>
              ))}

              {/* Radius Violation Details */}
              {details?.radius_violations?.map((alert, idx) => (
                <li key={`radius-${idx}`}>
                  <DropdownItem
                    onItemClick={closeDropdown}
                    className="flex gap-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-white/5"
                    href="/security/violations"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div className="block">
                      <span className="block font-medium text-black dark:text-white text-sm">
                        Pelanggaran Radius: {alert.nama}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {alert.distance}m dari {alert.cabang}
                      </span>
                    </div>
                  </DropdownItem>
                </li>
              ))}

              {/* Device Lock Details */}
              {details?.device_locks?.map((alert, idx) => (
                <li key={`device-${idx}`}>
                  <DropdownItem
                    onItemClick={closeDropdown}
                    className="flex gap-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-white/5"
                    href="/master/karyawan"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 shrink-0">
                      <Lock size={20} />
                    </div>
                    <div className="block">
                      <span className="block font-medium text-black dark:text-white text-sm">
                        Device Terkunci: {alert.nama}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {alert.cabang}
                      </span>
                    </div>
                  </DropdownItem>
                </li>
              ))}

              {/* Force Close Details */}
              {details?.force_closes?.map((alert, idx) => (
                <li key={`fc-${idx}`}>
                  <DropdownItem
                    onItemClick={closeDropdown}
                    className="flex gap-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-white/5"
                    href="/security/violations"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 shrink-0">
                      <WifiOff size={20} />
                    </div>
                    <div className="block">
                      <span className="block font-medium text-black dark:text-white text-sm">
                        Force Close App: {alert.nama}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {alert.cabang}
                      </span>
                    </div>
                  </DropdownItem>
                </li>
              ))}

              {/* Face Verify Fails Details */}
              {details?.face_verify_fails?.map((alert, idx) => (
                <li key={`fv-${idx}`}>
                  <DropdownItem
                    onItemClick={closeDropdown}
                    className="flex gap-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-white/5"
                    href="/security/violations"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400 shrink-0">
                      <Smartphone size={20} />
                    </div>
                    <div className="block">
                      <span className="block font-medium text-black dark:text-white text-sm">
                        Gagal Wajah: {alert.nama}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {alert.cabang}
                      </span>
                    </div>
                  </DropdownItem>
                </li>
              ))}

              {/* Member Expiring Details */}
              {details?.member_expiring?.map((alert, idx) => (
                <li key={`expiring-${idx}`}>
                  <DropdownItem
                    onItemClick={closeDropdown}
                    className="flex gap-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-white/5"
                    href="/master/karyawan"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shrink-0">
                      <UserX size={20} />
                    </div>
                    <div className="block">
                      <span className="block font-medium text-black dark:text-white text-sm">
                        Masa Aktif Habis: {alert.nama}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {alert.cabang}
                      </span>
                    </div>
                  </DropdownItem>
                </li>
              ))}
            </>
          )}

          {/* Approvals Section */}
          {(summary?.total_approval_pending || 0) > 0 && (
            <>
              <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>
              <li className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">
                Approvals
              </li>

              {/* Absen / Izin */}
              {(summary?.ajuan_absen || 0) > 0 && (
                <li>
                  <DropdownItem
                    onItemClick={closeDropdown}
                    className="flex gap-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-white/5"
                    href="/izin"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="block">
                      <span className="block font-medium text-black dark:text-white text-sm">
                        {summary?.ajuan_absen} Pengajuan Izin
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Menunggu persetujuan
                      </span>
                    </div>
                  </DropdownItem>
                </li>
              )}

              {/* Lembur */}
              {(summary?.lembur || 0) > 0 && (
                <li>
                  <DropdownItem
                    onItemClick={closeDropdown}
                    className="flex gap-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-white/5"
                    href="/lembur"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="block">
                      <span className="block font-medium text-black dark:text-white text-sm">
                        {summary?.lembur} Pengajuan Lembur
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Menunggu persetujuan
                      </span>
                    </div>
                  </DropdownItem>
                </li>
              )}
            </>
          )}

        </ul>

        <Link
          href="/security/violations"
          onClick={closeDropdown}
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Lihat Semua Pelanggaran
        </Link>
      </Dropdown>
    </div>
  );
}
