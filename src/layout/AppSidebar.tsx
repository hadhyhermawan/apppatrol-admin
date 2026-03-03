"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { usePermissions } from "@/contexts/PermissionContext";
import { getRequiredPermissions } from "@/config/routePermissions";
import apiClient from "@/lib/api";
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
  AlertTriangle,
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
  featureKey?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean; superAdminOnly?: boolean; featureKey?: string; }[];
  sectionHeader?: string;
  superAdminOnly?: boolean;
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
      { name: 'Vendor', path: '/master/vendor', superAdminOnly: true },
      { name: 'Karyawan', path: '/master/karyawan' },
      { name: 'Departemen', path: '/master/departemen' },
      { name: 'Jabatan', path: '/master/jabatan' },
      { name: 'Cabang', path: '/master/cabang' },
      { name: 'Walkie Channel', path: '/master/walkiechannel', featureKey: 'ptt' },
      { name: 'Patrol Point', path: '/master/patrolpoint' },
      { name: 'Titik Tugas Dept', path: '/master/dept-task-point' },
      { name: 'Cuti', path: '/master/cuti' },
      { name: 'Jam Kerja', path: '/master/jamkerja' },
      { name: 'Jadwal Tugas', path: '/master/jadwal' },
      { name: 'Manajemen Regu', path: '/master/regu' },
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
    icon: <Clock size={20} />,
    featureKey: 'presensi'
  },
  // Departemen Keamanan
  {
    name: 'Tugas Patroli',
    path: '/security/patrol',
    icon: <ShieldCheck size={20} />,
    sectionHeader: 'Departemen Keamanan'
  },
  {
    name: 'Manajemen Patroli',
    path: '/security/teams',
    icon: <Users size={20} />
  },
  {
    name: 'Turlalin VIP',
    path: '/security/turlalin',
    icon: <Cone size={20} />,
    featureKey: 'turlalin'
  },
  {
    name: 'Safety Briefing',
    path: '/security/safety',
    icon: <HardHat size={20} />,
    featureKey: 'safety'
  },
  {
    name: 'Barang',
    path: '/security/barang',
    icon: <Package size={20} />,
    featureKey: 'barang'
  },
  {
    name: 'Surat',
    path: '/security/surat',
    icon: <Mail size={20} />,
    featureKey: 'surat'
  },
  {
    name: 'Tamu',
    path: '/security/tamu',
    icon: <UserCheck size={20} />,
    featureKey: 'tamu'
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
  {
    name: 'Pelanggaran',
    path: '/security/violations',
    icon: <AlertTriangle size={20} />
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
      { name: 'General Setting', path: '/settings/general', superAdminOnly: true },
      { name: 'Pengaturan Reminder', path: '/settings/reminder', superAdminOnly: true },
      { name: 'Denda', path: '/settings/denda', superAdminOnly: true },
      { name: 'Hari Libur', path: '/settings/hari-libur', superAdminOnly: true },
      { name: 'Jam Kerja Departemen', path: '/settings/jam-kerja-dept', superAdminOnly: true },
      { name: 'Syarat & Ketentuan', path: '/settings/terms', superAdminOnly: true },
      { name: 'Kebijakan Privasi', path: '/settings/privacy', superAdminOnly: true },
      { name: 'Hapus Akun & Data', path: '/settings/hapus-akun', superAdminOnly: true },
      { name: 'Profil Perusahaan', path: '/settings/vendor-profile' },
    ]
  },
  {
    name: 'Laporan',
    icon: <FileText size={20} />,
    subItems: [
      { name: 'Laporan Presensi', path: '/reports/presensi', featureKey: 'presensi' },
      { name: 'Laporan Safety Briefing', path: '/reports/safety', featureKey: 'safety' },
      { name: 'Laporan Turlalin', path: '/reports/turlalin', featureKey: 'turlalin' },
      { name: 'Laporan Buku Tamu', path: '/reports/tamu', featureKey: 'tamu' },
      { name: 'Laporan Buku Barang', path: '/reports/barang', featureKey: 'barang' },
      { name: 'Laporan Surat Keluar Masuk', path: '/reports/surat', featureKey: 'surat' },
      { name: 'Laporan Gaji', path: '/reports/salary' },
      { name: 'Laporan Tugas', path: '/reports/tugas-monitoring' },
      { name: 'Statistik Kinerja', path: '/reports/performance' },
    ]
  },
  {
    name: 'Utilities',
    icon: <Server size={20} />,
    subItems: [
      { name: 'User', path: '/utilities/users' },
      { name: 'Role', path: '/utilities/roles', superAdminOnly: true },
      { name: 'Permission', path: '/utilities/permissions', superAdminOnly: true },
      { name: 'Role & Permission', path: '/utilities/role-permission', superAdminOnly: true },
      { name: 'Group Permission', path: '/utilities/group-permissions', superAdminOnly: true },
      { name: 'Login Logs', path: '/utilities/logs', superAdminOnly: true },
      { name: 'User Agreements', path: '/user-agreements', superAdminOnly: true },
      { name: 'Laporan Keamanan', path: '/utilities/security-reports' },
      { name: 'Multi Device Login', path: '/utilities/multi-device', superAdminOnly: true },
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
  const { isSuperAdmin, isKaryawan, hasAnyPermission, hasAllPermissions } = usePermissions();
  const pathname = usePathname();

  const [vendorFeatures, setVendorFeatures] = useState<any>({});

  const [izinCount, setIzinCount] = useState<number>(0);

  useEffect(() => {
    // Attempt to load my vendor profile to get features if not super admin
    if (!isSuperAdmin) {
      apiClient.get('/auth/me').then((me: any) => {
        if (me && me.vendor_id) {
          apiClient.get(`/vendors/${me.vendor_id}/profile`).then((res: any) => {
            setVendorFeatures(res.features || {});
          }).catch(() => { });
        }
      }).catch(() => { });
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res: any = await apiClient.get(`/security/notifications/summary?t=${Date.now()}`);
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

  const renderMenuItems = (navItems: NavItem[]) => {
    const filteredNavItems = navItems.map(nav => {
      if (nav.subItems) {
        return {
          ...nav,
          subItems: nav.subItems.filter(sub => {
            if (sub.superAdminOnly && !isSuperAdmin) return false;
            if (isSuperAdmin) return true;

            if (sub.featureKey && vendorFeatures[sub.featureKey] !== true) {
              return false;
            }

            if (sub.path) {
              const routePerm = getRequiredPermissions(sub.path);
              if (routePerm && routePerm.permissions.length > 0) {
                if (routePerm.requireAll) {
                  return hasAllPermissions(routePerm.permissions);
                } else {
                  return hasAnyPermission(routePerm.permissions);
                }
              } else {
                if (isKaryawan && !isSuperAdmin) {
                  return false;
                }
              }
            }
            return true;
          })
        };
      }
      return nav;
    }).filter(nav => {
      if (nav.superAdminOnly && !isSuperAdmin) return false;

      if (nav.subItems) {
        return nav.subItems.length > 0;
      }

      if (isSuperAdmin) return true;

      if (nav.path) {
        const routePerm = getRequiredPermissions(nav.path);
        if (routePerm && routePerm.permissions.length > 0) {
          if (routePerm.requireAll) {
            return hasAllPermissions(routePerm.permissions);
          } else {
            return hasAnyPermission(routePerm.permissions);
          }
        } else {
          // For Karyawans, if a path doesn't explicitly have an empty permission list []
          // mapped in routePermissions, and it's a top level menu, we block it by default
          // unless it's explicitly Dashboard which has []
          if (isKaryawan && !isSuperAdmin) {
            if (nav.path !== '/dashboard') {
              return false;
            }
          }
        }
      }
      // Top level items without specific permissions and without subItems
      if (isKaryawan && !isSuperAdmin && !nav.path && !nav.subItems) {
        return false;
      }

      if (nav.featureKey && !isSuperAdmin) {
        if (vendorFeatures[nav.featureKey] !== true) {
          return false;
        }
      }

      return true;
    });

    return (
      <ul className="flex flex-col gap-4">
        {filteredNavItems.map((nav, index) => (
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
                      <span className={`menu-item-text flex-1`}>{nav.name}</span>
                    )}
                    {nav.name === 'Pengajuan Absen' && izinCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ml-auto">
                        {izinCount}
                      </span>
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
                    {nav.subItems.filter(subItem => {
                      if (subItem.superAdminOnly && !isSuperAdmin) return false;
                      if (isSuperAdmin) return true;

                      const routePerm = getRequiredPermissions(subItem.path || '');
                      if (routePerm && routePerm.permissions.length > 0) {
                        return routePerm.requireAll ? hasAllPermissions(routePerm.permissions) : hasAnyPermission(routePerm.permissions);
                      }

                      // For Karyawan, hide sub item if no explicit permissions exist and it's not super admin
                      if (isKaryawan && !isSuperAdmin) {
                        // some defaults are safe, like users
                        // but we just let it pass or block based on featureKey 
                      }

                      if (subItem.featureKey && vendorFeatures[subItem.featureKey] !== true) {
                        return false;
                      }

                      return true;
                    }).map((subItem) => (
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
  };

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
