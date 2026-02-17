/**
 * Route Permission Mapping
 * 
 * This file defines which permissions are required for each route.
 * Used by PermissionGuard to protect routes from unauthorized access.
 */

export interface RoutePermission {
    path: string;
    permissions: string[];
    requireAll?: boolean; // If true, user must have ALL permissions. Default: false (ANY permission)
}

export const routePermissions: RoutePermission[] = [
    // Dashboard - accessible to everyone
    { path: '/dashboard', permissions: [] },

    // Data Master
    { path: '/master/karyawan', permissions: ['karyawan.index'] },
    { path: '/master/departemen', permissions: ['departemen.index'] },
    { path: '/master/jabatan', permissions: ['jabatan.index'] },
    { path: '/master/cabang', permissions: ['cabang.index'] },
    { path: '/master/patrolpoint', permissions: ['patrolpoint.index'] },
    { path: '/master/cuti', permissions: ['cuti.index'] },
    { path: '/master/jamkerja', permissions: ['jamkerja.index'] },
    { path: '/master/jadwal', permissions: ['jadwal.index'] },
    { path: '/master/dept-task-point', permissions: ['depttaskpoint.index'] },
    { path: '/master/walkiechannel', permissions: ['walkiechannel.index'] },

    // Monitoring Presensi
    { path: '/presensi', permissions: ['presensi.index'] },

    // Departemen Keamanan
    { path: '/security/patrol', permissions: ['giatpatrol.index'] },
    { path: '/security/safety', permissions: ['safety.index'] },
    { path: '/security/barang', permissions: ['barang.index'] },
    { path: '/security/tamu', permissions: ['tamu.index'] },
    { path: '/security/turlalin', permissions: ['turlalin.index'] },
    { path: '/security/surat', permissions: ['surat.index'] },
    { path: '/security/teams', permissions: ['teams.index'] },
    { path: '/security/map-tracking', permissions: ['tracking.index'] },
    { path: '/security/tracking', permissions: ['tracking.index'] },
    { path: '/security/reports', permissions: ['laporan.index'] },

    // Cleaning
    { path: '/cleaning/tasks', permissions: ['cleaning.index'] },

    // Utilities
    { path: '/utilities/users', permissions: ['users.index'] },
    { path: '/utilities/roles', permissions: ['roles.index'] },
    { path: '/utilities/permissions', permissions: ['permissions.index'] },
    { path: '/utilities/group-permissions', permissions: ['permissiongroups.index'] },
    { path: '/utilities/role-permission', permissions: ['roles.index', 'permissions.index'] },
    { path: '/utilities/logs', permissions: ['logs.index'] },
    { path: '/utilities/security-reports', permissions: ['securityreports.index'] },
    { path: '/utilities/multi-device', permissions: ['multidevice.index'] },
    { path: '/utilities/chat-management', permissions: ['chat.index'] },

    // Laporan
    { path: '/reports/presensi', permissions: ['laporan.index'] },
    { path: '/reports/salary', permissions: ['laporan.index'] },
    { path: '/reports/patrol-monitoring', permissions: ['monitoringpatrol.index'] },

    // Payroll
    { path: '/payroll/jenis-tunjangan', permissions: ['jenistunjangan.index'] },
    { path: '/payroll/gaji-pokok', permissions: ['gajipokok.index'] },
    { path: '/payroll/tunjangan', permissions: ['tunjangan.index'] },
    { path: '/payroll/bpjs-kesehatan', permissions: ['bpjskesehatan.index'] },
    { path: '/payroll/bpjs-tenagakerja', permissions: ['bpjstenagakerja.index'] },
    { path: '/payroll/penyesuaian-gaji', permissions: ['penyesuaiangaji.index'] },
    { path: '/payroll/slip-gaji', permissions: ['slipgaji.index'] },

    // Pengajuan Izin
    { path: '/izin', permissions: ['izinabsen.index', 'izincuti.index', 'izinsakit.index', 'izindinas.index'] },

    // Lembur
    { path: '/lembur', permissions: ['lembur.index'] },

    // Konfigurasi
    { path: '/settings/general', permissions: ['generalsetting.index'] },
    { path: '/settings/jam-kerja-dept', permissions: ['jamkerjadepartemen.index'] },
    { path: '/settings/hari-libur', permissions: ['harilibur.index'] },
    { path: '/settings/users', permissions: ['users.index'] },
];

/**
 * Get required permissions for a given path
 */
export function getRequiredPermissions(path: string): RoutePermission | undefined {
    return routePermissions.find(route => path.startsWith(route.path));
}

/**
 * Check if a path requires permissions
 */
export function isProtectedRoute(path: string): boolean {
    const route = getRequiredPermissions(path);
    return route !== undefined && route.permissions.length > 0;
}
