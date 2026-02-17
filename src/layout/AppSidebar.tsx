"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  LayoutDashboard,
  Database,
  Newspaper,
  Banknote,
  Clock,
  ShieldCheck,
  Cone,
  HardHat,
  Package,
  Mail,
  UserCheck,
  MapPin,
  Sparkles,
  Car,
  ClipboardCheck,
  FolderCheck,
  Settings,
  FileText,
  MessageSquare,
  Smartphone,
  Server,
  Users,
  Key,
  Lock,
  MessageCircle,
  Briefcase,
  ChevronDown,
  LogOut
} from "lucide-react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  sectionHeader?: string;
};

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard size={20} />
  },
  {
    name: 'Data Master',
    icon: <Database size={20} />,
    subItems: [
      { name: 'Karyawan', path: '/master/karyawan' },
      { name: 'Departemen', path: '/master/departemen' },
      { name: 'Jabatan', path: '/master/jabatan' },
      { name: 'Cabang', path: '/master/cabang' },
      { name: 'Walkie Channel', path: '/master/walkiechannel' },
      { name: 'Patrol Point', path: '/master/patrolpoint' },
      { name: 'Titik Tugas Dept', path: '/master/dept-task-point' },
      { name: 'Cuti', path: '/master/cuti' },
      { name: 'Jam Kerja', path: '/master/jamkerja' },
      { name: 'Jadwal Tugas', path: '/master/jadwal' },
    ]
  },
  {
    name: 'Berita',
    path: '/berita',
    icon: <Newspaper size={20} />
  },
  {
    name: 'Payroll',
    icon: <Banknote size={20} />,
    subItems: [
      { name: 'Jenis Tunjangan', path: '/payroll/jenis-tunjangan' },
      { name: 'Gaji Pokok', path: '/payroll/gaji-pokok' },
      { name: 'Tunjangan', path: '/payroll/tunjangan' },
      { name: 'BPJS Kesehatan', path: '/payroll/bpjs-kesehatan' },
      { name: 'BPJS Tenaga Kerja', path: '/payroll/bpjs-tenagakerja' },
      { name: 'Penyesuaian Gaji', path: '/payroll/penyesuaian-gaji' },
      { name: 'Slip Gaji', path: '/payroll/slip-gaji' },
    ]
  },
  {
    name: 'Monitoring Presensi',
    path: '/presensi',
    icon: <Clock size={20} />
  },
  // Departemen Keamanan
  {
    name: 'Tugas Patroli',
    path: '/security/patrol',
    icon: <ShieldCheck size={20} />,
    sectionHeader: 'Departemen Keamanan'
  },
  {
    name: 'Manajemen Regu',
    path: '/security/teams',
    icon: <Users size={20} />
  },
  {
    name: 'Turlalin VIP',
    path: '/security/turlalin',
    icon: <Cone size={20} />
  },
  {
    name: 'Safety Briefing',
    path: '/security/safety',
    icon: <HardHat size={20} />
  },
  {
    name: 'Barang',
    path: '/security/barang',
    icon: <Package size={20} />
  },
  {
    name: 'Surat',
    path: '/security/surat',
    icon: <Mail size={20} />
  },
  {
    name: 'Tamu',
    path: '/security/tamu',
    icon: <UserCheck size={20} />
  },
  {
    name: 'Employee Tracking',
    path: '/security/tracking',
    icon: <MapPin size={20} />
  },
  {
    name: 'Map Tracking',
    path: '/security/map-tracking',
    icon: <MapPin size={20} />
  },
  // Cleaning Service
  {
    name: 'Tugas Kebersihan',
    path: '/cleaning/tasks',
    icon: <Sparkles size={20} />,
    sectionHeader: 'Departemen Cleaning Service'
  },
  // Driver
  {
    name: 'Tugas Perjalanan',
    path: '/driver/tasks',
    icon: <Car size={20} />,
    sectionHeader: 'Departemen Driver'
  },
  {
    name: 'Unit Kendaraan',
    path: '/driver/vehicle',
    icon: <Car size={20} />
  },
  {
    name: 'Monitoring P2H & Job',
    path: '/driver/p2h',
    icon: <ClipboardCheck size={20} />
  },
  // Izin & Lembur
  {
    name: 'Pengajuan Absen',
    path: '/izin',
    icon: <FolderCheck size={20} />
  },
  {
    name: 'Lembur',
    path: '/lembur',
    icon: <Clock size={20} />
  },
  {
    name: 'Konfigurasi',
    icon: <Settings size={20} />,
    subItems: [
      { name: 'General Setting', path: '/settings/general' },
      { name: 'Landing Page', path: '/settings/landing-page' },
      { name: 'Denda', path: '/settings/denda' },
      { name: 'Hari Libur', path: '/settings/hari-libur' },
      { name: 'Jam Kerja Departemen', path: '/settings/jam-kerja-dept' },
    ]
  },
  {
    name: 'Laporan',
    icon: <FileText size={20} />,
    subItems: [
      { name: 'Laporan Presensi', path: '/reports/presensi' },
      { name: 'Laporan Gaji', path: '/reports/salary' },
      { name: 'Monitoring Patroli', path: '/reports/patrol-monitoring' },
      { name: 'Statistik Kinerja', path: '/reports/performance' },
    ]
  },
  {
    name: 'Utilities',
    icon: <Server size={20} />,
    subItems: [
      { name: 'User', path: '/utilities/users' },
      { name: 'Role', path: '/utilities/roles' },
      { name: 'Permission', path: '/utilities/permissions' },
      { name: 'Group Permission', path: '/utilities/group-permissions' },
      { name: 'Login Logs', path: '/utilities/logs' },
      { name: 'Laporan Keamanan', path: '/utilities/security-reports' },
      { name: 'Multi Device Login', path: '/utilities/multi-device' },
      { name: 'Management Obrolan', path: '/utilities/chat-management' },
    ]
  },
  {
    name: 'WA Gateway',
    path: '/wagateway',
    icon: <MessageCircle size={20} />
  }
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({
              type: "main",
              index,
            });
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === "main" &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: "main", index };
    });
  };

  const renderMenuItems = (navItems: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <React.Fragment key={nav.name}>
          {nav.sectionHeader && (isExpanded || isHovered || isMobileOpen) && (
            <li className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {nav.sectionHeader}
            </li>
          )}
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index)}
                className={`menu-item group ${openSubmenu?.type === "main" && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
                  } cursor-pointer ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                  }`}
              >
                <span
                  className={`${openSubmenu?.type === "main" && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDown
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === "main" &&
                      openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                      }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  href={nav.path}
                  className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                    }`}
                >
                  <span
                    className={`${isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                      }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className={`menu-item-text`}>{nav.name}</span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`main-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === "main" && openSubmenu?.index === index
                      ? `${subMenuHeight[`main-${index}`]}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        className={`menu-dropdown-item ${isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                          }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge `}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge `}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        </React.Fragment>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link href="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center gap-2 font-bold text-xl text-brand-500">
              <ShieldCheck className="w-8 h-8" />
              <span>K3Guard</span>
            </div>
          ) : (
            <ShieldCheck className="w-8 h-8 text-brand-500" />
          )}
        </Link>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu Utama"
                ) : (
                  "..."
                )}
              </h2>
              {renderMenuItems(navItems)}
            </div>
          </div>
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('patrol_token');
              localStorage.removeItem('patrol_user');
              window.location.href = '/';
            }
          }}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all
              ${!isExpanded && !isHovered ? "justify-center" : "justify-start"}`}
        >
          <LogOut size={20} />
          {(isExpanded || isHovered || isMobileOpen) && (
            <span className="font-medium text-sm">Log Out</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
