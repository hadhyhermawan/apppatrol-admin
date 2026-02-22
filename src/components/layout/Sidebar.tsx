'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, User, Settings, Shield, Bell, Wrench, Menu, X, ChevronDown, ChevronRight, FileText, Smartphone, Briefcase, Database, Clock, ShieldCheck, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { usePermissions } from '@/contexts/PermissionContext';
import apiClient from '@/lib/api';

type MenuItem = {
    name: string;
    href?: string;
    icon: any;
    submenu?: { name: string; href: string; permissions?: string[] }[];
    permissions?: string[]; // Required permissions to view this menu
};

const menuItems: MenuItem[] = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        permissions: [] // Everyone can access dashboard
    },
    {
        name: 'Data Master',
        icon: Database,
        permissions: ['karyawan.index', 'departemen.index', 'jabatan.index', 'cabang.index'], // Any of these
        submenu: [
            { name: 'Karyawan', href: '/master/karyawan', permissions: ['karyawan.index'] },
            { name: 'Departemen', href: '/master/departemen', permissions: ['departemen.index'] },
            { name: 'Jabatan', href: '/master/jabatan', permissions: ['jabatan.index'] },
            { name: 'Cabang', href: '/master/cabang', permissions: ['cabang.index'] },
            { name: 'Patrol Point', href: '/master/patrolpoint', permissions: ['patrolpoint.index'] },
            { name: 'Cuti', href: '/master/cuti', permissions: ['cuti.index'] },
            { name: 'Jam Kerja', href: '/master/jamkerja', permissions: ['jamkerja.index'] },
            { name: 'Jadwal Tugas', href: '/master/jadwal', permissions: ['jadwal.index'] },
            { name: 'Dept Task Point', href: '/master/dept-task-point', permissions: ['depttaskpoint.index'] },
            { name: 'Walkie Channel', href: '/master/walkiechannel', permissions: ['walkiechannel.index'] },
        ]
    },
    {
        name: 'Monitoring Presensi',
        href: '/presensi',
        icon: Clock,
        permissions: ['presensi.index']
    },
    {
        name: 'Departemen Keamanan',
        icon: ShieldCheck,
        permissions: ['giatpatrol.index', 'barang.index', 'tamu.index'], // Any of these
        submenu: [
            { name: 'Tugas Patroli', href: '/security/patrol', permissions: ['giatpatrol.index'] },
            { name: 'Safety Briefing', href: '/security/safety', permissions: ['safety.index'] },
            { name: 'Log Barang', href: '/security/barang', permissions: ['barang.index'] },
            { name: 'Buku Tamu', href: '/security/tamu', permissions: ['tamu.index'] },
            { name: 'Turlalin', href: '/security/turlalin', permissions: ['turlalin.index'] },
            { name: 'Data Surat', href: '/security/surat', permissions: ['surat.index'] },
            { name: 'Manajemen Regu', href: '/security/teams', permissions: ['teams.index'] },
            { name: 'Map Tracking', href: '/security/map-tracking', permissions: ['tracking.index'] },
            { name: 'Pelanggaran', href: '/security/violations', permissions: ['giatpatrol.index'] },
            { name: 'Laporan Keamanan', href: '/security/reports', permissions: ['laporan.index'] },
        ]
    },
    {
        name: 'Cleaning',
        icon: Trash2,
        permissions: ['cleaning.index'],
        submenu: [
            { name: 'Tugas Cleaning', href: '/cleaning/tasks', permissions: ['cleaning.index'] },
        ]
    },
    {
        name: 'Utilities',
        icon: Settings,
        permissions: ['users.index', 'roles.index', 'permissions.index'], // Any of these
        submenu: [
            { name: 'Users', href: '/utilities/users', permissions: ['users.index'] },
            { name: 'Roles', href: '/utilities/roles', permissions: ['roles.index'] },
            { name: 'Permissions', href: '/utilities/permissions', permissions: ['permissions.index'] },
            { name: 'Group Permissions', href: '/utilities/group-permissions', permissions: ['permissiongroups.index'] },
            { name: 'Role & Permission', href: '/utilities/role-permission', permissions: ['roles.index', 'permissions.index'] },
            { name: 'Logs', href: '/utilities/logs', permissions: ['logs.index'] },
            { name: 'Security Reports', href: '/utilities/security-reports', permissions: ['securityreports.index'] },
            { name: 'Multi Device', href: '/utilities/multi-device', permissions: ['multidevice.index'] },
            { name: 'Chat Management', href: '/utilities/chat-management', permissions: ['chat.index'] },
        ]
    },
    {
        name: 'Laporan',
        icon: FileText,
        permissions: ['laporan.index'],
        submenu: [
            { name: 'Laporan Presensi', href: '/reports/presensi', permissions: ['laporan.index'] },
            { name: 'Laporan Gaji', href: '/reports/salary', permissions: ['laporan.index'] },
            { name: 'Laporan Tugas', href: '/reports/tugas-monitoring', permissions: ['monitoringpatrol.index'] },
        ]
    },
    {
        name: 'Payroll',
        icon: Briefcase,
        permissions: ['gajipokok.index', 'tunjangan.index', 'slipgaji.index'], // Any of these
        submenu: [
            { name: 'Jenis Tunjangan', href: '/payroll/jenis-tunjangan', permissions: ['jenistunjangan.index'] },
            { name: 'Gaji Pokok', href: '/payroll/gaji-pokok', permissions: ['gajipokok.index'] },
            { name: 'Tunjangan', href: '/payroll/tunjangan', permissions: ['tunjangan.index'] },
            { name: 'BPJS Kesehatan', href: '/payroll/bpjs-kesehatan', permissions: ['bpjskesehatan.index'] },
            { name: 'BPJS Tenagakerja', href: '/payroll/bpjs-tenagakerja', permissions: ['bpjstenagakerja.index'] },
            { name: 'Penyesuaian Gaji', href: '/payroll/penyesuaian-gaji', permissions: ['penyesuaiangaji.index'] },
            { name: 'Slip Gaji', href: '/payroll/slip-gaji', permissions: ['slipgaji.index'] },
        ]
    },
    {
        name: 'Pengajuan Izin',
        icon: FileText,
        href: '/izin',
        permissions: ['izinabsen.index', 'izincuti.index', 'izinsakit.index', 'izindinas.index']
    },
    {
        name: 'Lembur',
        icon: Clock,
        href: '/lembur',
        permissions: ['lembur.index']
    },
    {
        name: 'Konfigurasi',
        icon: Settings,
        permissions: [],   // Section selalu tampil; child item mengatur aksesnya sendiri
        submenu: [
            { name: 'General Setting', href: '/settings/general', permissions: ['generalsetting.index'] },
            { name: 'Jam Kerja Departemen', href: '/settings/jam-kerja-dept', permissions: ['jamkerjadepartemen.index'] },
            { name: 'Hari Libur', href: '/settings/hari-libur', permissions: ['harilibur.index'] },
            { name: 'Landing Page', href: '/settings/landing-page', permissions: ['super_admin_only'] },
            { name: 'User Management', href: '/settings/users', permissions: ['users.index'] },
        ]
    }
];

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
    const pathname = usePathname();
    const { hasAnyPermission, isSuperAdmin, loading } = usePermissions();
    const [openMenus, setOpenMenus] = useState<string[]>([]);
    const [izinCount, setIzinCount] = useState<number>(0);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res: any = await apiClient.get(`/security/notifications/summary?t=${Date.now()}`);
                console.log("[Sidebar] Notification Summary Fetched:", res);
                if (res && res.ajuan_absen) {
                    setIzinCount(res.ajuan_absen);
                } else {
                    setIzinCount(0);
                }
            } catch (err) {
                console.error("Failed to fetch notification summary for sidebar:", err);
            }
        };

        fetchSummary();
        const interval = setInterval(fetchSummary, 60000);
        return () => clearInterval(interval);
    }, []);

    const toggleMenu = (name: string) => {
        setOpenMenus(prev =>
            prev.includes(name)
                ? prev.filter(item => item !== name)
                : [...prev, name]
        );
    };

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={clsx(
                    "fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-30 w-52 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    "flex flex-col text-slate-200"
                )}
                style={{
                    background: 'linear-gradient(180deg, #0b2e5c 0%, #0b2a54 100%)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)'
                }}
            >
                {/* Brand */}
                <div className="flex items-center justify-center h-16 px-4 bg-white/5 border-b border-white/10">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-white">
                        <ShieldCheck className="w-6 h-6 text-[#fbbf24]" />
                        <span>K3Guard</span>
                    </Link>
                </div>

                {/* Menu */}
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                    {menuItems
                        .filter(item => {
                            // Super admin sees all menus
                            if (isSuperAdmin) return true;
                            // If no permissions required, show to everyone
                            if (!item.permissions || item.permissions.length === 0) return true;
                            // super_admin_only items are never shown to non-super-admin
                            if (item.permissions.includes('super_admin_only')) return false;
                            // Check if user has any of the required permissions
                            return hasAnyPermission(item.permissions);
                        })
                        .map((item) => {
                            const isActive = item.href ? pathname.startsWith(item.href) : false;
                            const isOpen = openMenus.includes(item.name);
                            const hasSubmenu = item.submenu && item.submenu.length > 0;

                            // Filter submenu items by permissions
                            const filteredSubmenu = hasSubmenu
                                ? item.submenu!.filter(sub => {
                                    // super_admin_only: only show when isSuperAdmin is confirmed true
                                    if (sub.permissions?.includes('super_admin_only')) {
                                        return isSuperAdmin === true;
                                    }
                                    if (isSuperAdmin) return true;
                                    if (!sub.permissions || sub.permissions.length === 0) return true;
                                    return hasAnyPermission(sub.permissions);
                                })
                                : [];

                            // Don't show parent menu if all submenu items are filtered out
                            if (hasSubmenu && filteredSubmenu.length === 0) return null;

                            if (item.name === 'Konfigurasi') {
                                console.log('[Sidebar] Konfigurasi filteredSubmenu:', filteredSubmenu.map(s => s.name));
                                console.log('[Sidebar] isSuperAdmin val:', isSuperAdmin);
                            }

                            return (
                                <div key={item.name}>
                                    {hasSubmenu ? (
                                        <button
                                            onClick={() => toggleMenu(item.name)}
                                            className={clsx(
                                                "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group text-[13px] font-medium",
                                                isOpen ? "bg-white/10 text-white" : "hover:bg-white/5 text-slate-300"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <item.icon className={clsx("w-[18px] h-[18px]", isOpen ? "text-[#fbbf24]" : "text-slate-400 group-hover:text-slate-200")} />
                                                <span>{item.name}</span>
                                            </div>
                                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>
                                    ) : (
                                        <Link
                                            href={item.href!}
                                            className={clsx(
                                                "flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 text-[13px] font-medium group",
                                                isActive
                                                    ? "bg-[#fbbf24]/20 text-white shadow-[inset_0_0_0_1px_rgba(251,191,36,0.35)]"
                                                    : "hover:bg-white/5 text-slate-300"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 flex-1">
                                                <item.icon className={clsx("w-[18px] h-[18px]", isActive ? "text-[#fbbf24]" : "text-slate-400 group-hover:text-slate-200")} />
                                                <span>{item.name}</span>
                                            </div>
                                            {item.name === 'Pengajuan Izin' && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                                                    {izinCount !== undefined ? izinCount : '?'}
                                                </span>
                                            )}
                                        </Link>
                                    )}

                                    {/* Submenu */}
                                    {hasSubmenu && isOpen && (
                                        <div className="mt-1 ml-2 pl-3 border-l border-white/10 space-y-1">
                                            {filteredSubmenu.map((sub) => {
                                                const isSubActive = pathname === sub.href;
                                                return (
                                                    <Link
                                                        key={sub.name}
                                                        href={sub.href}
                                                        className={clsx(
                                                            "block px-3 py-1.5 rounded-lg text-[13px] transition-colors",
                                                            isSubActive
                                                                ? "bg-white/10 text-white font-medium"
                                                                : "text-slate-400 hover:text-white hover:bg-white/5"
                                                        )}
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>

                {/* Footer Sidebar */}
                <div className="p-3 border-t border-white/10 bg-black/20">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-bold">
                            AD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">Admin</p>
                            <p className="text-[10px] text-slate-400 truncate">Super Admin</p>
                            <p className="text-[10px] text-yellow-400 mt-1">Debug isSuperAdmin: {isSuperAdmin ? 'TRUE' : 'FALSE'}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
