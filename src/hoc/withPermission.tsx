'use client';

import { ComponentType } from 'react';
import PermissionGuard from '@/components/guards/PermissionGuard';

interface WithPermissionOptions {
    permissions: string[];
    requireAll?: boolean;
    fallbackPath?: string;
}

/**
 * Higher-Order Component to wrap pages with permission protection
 * 
 * Usage:
 * export default withPermission(KaryawanPage, {
 *   permissions: ['karyawan.index']
 * });
 */
export function withPermission<P extends object>(
    Component: ComponentType<P>,
    options: WithPermissionOptions
) {
    const WrappedComponent = (props: P) => {
        return (
            <PermissionGuard
                permissions={options.permissions}
                requireAll={options.requireAll}
                fallbackPath={options.fallbackPath}
            >
                <Component {...props} />
            </PermissionGuard>
        );
    };

    WrappedComponent.displayName = `withPermission(${Component.displayName || Component.name || 'Component'})`;

    return WrappedComponent;
}
