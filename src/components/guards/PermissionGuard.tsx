'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePermissions } from '@/contexts/PermissionContext';

interface PermissionGuardProps {
    children: React.ReactNode;
    permissions: string[];
    requireAll?: boolean; // If true, user must have ALL permissions. If false, ANY permission is enough
    fallbackPath?: string;
}

export default function PermissionGuard({
    children,
    permissions,
    requireAll = false,
    fallbackPath = '/forbidden'
}: PermissionGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin, loading } = usePermissions();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        // Wait for permissions to load
        if (loading) {
            setIsAuthorized(null);
            return;
        }

        // Super admin always authorized
        if (isSuperAdmin) {
            setIsAuthorized(true);
            return;
        }

        // If no permissions required, allow access
        if (!permissions || permissions.length === 0) {
            setIsAuthorized(true);
            return;
        }

        // Check permissions
        let authorized = false;
        if (requireAll) {
            authorized = hasAllPermissions(permissions);
        } else {
            authorized = hasAnyPermission(permissions);
        }

        setIsAuthorized(authorized);

        // Redirect if not authorized
        if (!authorized) {
            router.push(fallbackPath);
        }
    }, [loading, isSuperAdmin, permissions, requireAll, hasAnyPermission, hasAllPermissions, router, fallbackPath]);

    // Show loading state
    if (loading || isAuthorized === null) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Checking permissions...</p>
                </div>
            </div>
        );
    }

    // Show nothing if not authorized (will redirect)
    if (!isAuthorized) {
        return null;
    }

    // Render children if authorized
    return <>{children}</>;
}
