'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, User, Settings, Shield, Bell, Wrench, Menu, X, ChevronDown, ChevronRight, FileText, Smartphone, Briefcase, Database, Clock, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

type MenuItem = {
    name: string;
    href?: string;
    icon: any;
    submenu?: { name: string; href: string }[];
};

const menuItems: MenuItem[] = [
    {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard
    },
    {
        name: 'Data Master',
        icon: Database,
        submenu: [
            { name: 'Karyawan', href: '/master/karyawan' },
            { name: 'Departemen', href: '/master/departemen' },
            { name: 'Jabatan', href: '/master/jabatan' },
            { name: 'Cabang', href: '/master/cabang' },
            { name: 'Patrol Point', href: '/master/patrolpoint' },
            { name: 'Cuti', href: '/master/cuti' },
            { name: 'Jam Kerja', href: '/master/jamkerja' },
            { name: 'Jadwal Tugas', href: '/master/jadwal' },
            { name: 'Dept Task Point', href: '/master/dept-task-point' },
            { name: 'Walkie Channel', href: '/master/walkiechannel' },
        ]
    },
    {
        name: 'Monitoring Presensi',
        href: '/presensi',
        icon: Clock
    },
    {
        name: 'Departemen Keamanan',
        icon: ShieldCheck,
        submenu: [
            { name: 'Tugas Patroli', href: '/security/patrol' },
            { name: 'Safety Briefing', href: '/security/safety' },
            { name: 'Log Barang', href: '/security/barang' },
            { name: 'Buku Tamu', href: '/security/tamu' },
            { name: 'Turlalin', href: '/security/turlalin' },
            { name: 'Data Surat', href: '/security/surat' },
            { name: 'Manajemen Regu', href: '/security/teams' },
            { name: 'Map Tracking', href: '/security/map-tracking' },
            { name: 'Laporan Keamanan', href: '/security/reports' },
        ]
    },
    {
        name: 'Cleaning',
        icon: Trash2,
        submenu: [
            { name: 'Tugas Cleaning', href: '/cleaning/tasks' },
        ]
    },
    {
        name: 'Utilities',
        icon: Settings,
        submenu: [
            { name: 'Users', href: '/utilities/users' },
            { name: 'Roles', href: '/utilities/roles' },
            { name: 'Permissions', href: '/utilities/permissions' },
            { name: 'Group Permissions', href: '/utilities/group-permissions' },
            { name: 'Logs', href: '/utilities/logs' },
            { name: 'Security Reports', href: '/utilities/security-reports' },
            { name: 'Multi Device', href: '/utilities/multi-device' },
            { name: 'Chat Management', href: '/utilities/chat-management' },
        ]
    },
    {
        name: 'Laporan',
        icon: FileText,
        submenu: [
            { name: 'Laporan Presensi', href: '/reports/presensi' },
            { name: 'Laporan Gaji', href: '/reports/salary' },
            { name: 'Monitoring Patroli', href: '/reports/patrol-monitoring' },
        ]
    },
    {
        name: 'Payroll',
        icon: Briefcase,
        submenu: [
            { name: 'Jenis Tunjangan', href: '/payroll/jenis-tunjangan' },
            { name: 'Gaji Pokok', href: '/payroll/gaji-pokok' },
            { name: 'Tunjangan', href: '/payroll/tunjangan' },
            { name: 'BPJS Kesehatan', href: '/payroll/bpjs-kesehatan' },
            { name: 'BPJS Tenagakerja', href: '/payroll/bpjs-tenagakerja' },
            { name: 'Penyesuaian Gaji', href: '/payroll/penyesuaian-gaji' },
            { name: 'Slip Gaji', href: '/payroll/slip-gaji' },
        ]
    },
    {
        name: 'Pengajuan Izin',
        icon: FileText,
        href: '/izin'
    },
    {
        name: 'Lembur',
        icon: Clock,
        href: '/lembur'
    },
    {
        name: 'Konfigurasi',
        icon: Settings,
        submenu: [
            { name: 'General Setting', href: '/settings/general' },
            { name: 'Jam Kerja Departemen', href: '/settings/jam-kerja-dept' },
            { name: 'Hari Libur', href: '/settings/hari-libur' },
            { name: 'User Management', href: '/settings/users' },
        ]
    }
];

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
    const pathname = usePathname();
    const [openMenus, setOpenMenus] = useState<string[]>([]);

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
                    {menuItems.map((item) => {
                        const isActive = item.href ? pathname.startsWith(item.href) : false;
                        const isOpen = openMenus.includes(item.name);
                        const hasSubmenu = item.submenu && item.submenu.length > 0;

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
                                        <item.icon className={clsx("w-[18px] h-[18px]", isActive ? "text-[#fbbf24]" : "text-slate-400 group-hover:text-slate-200")} />
                                        <span>{item.name}</span>
                                    </Link>
                                )}

                                {/* Submenu */}
                                {hasSubmenu && isOpen && (
                                    <div className="mt-1 ml-2 pl-3 border-l border-white/10 space-y-1">
                                        {item.submenu!.map((sub) => {
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
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
