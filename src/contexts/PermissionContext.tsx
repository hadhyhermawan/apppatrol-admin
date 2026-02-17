'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Permission {
    id: number;
    name: string;
    guard_name: string;
}

interface PermissionContextType {
    permissions: string[];
    loading: boolean;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    canCreate: (resource: string) => boolean;
    canUpdate: (resource: string) => boolean;
    canDelete: (resource: string) => boolean;
    canView: (resource: string) => boolean;
    isSuperAdmin: boolean;
    refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    const fetchPermissions = async () => {
        try {
            setLoading(true);

            // Get current user's permissions from backend
            const response = await fetch('/api-py/auth/me', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('patrol_token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Check if super admin (role id = 1)
                const isSuperAdminUser = data.roles?.some((role: any) => role.id === 1);
                setIsSuperAdmin(isSuperAdminUser);

                // If super admin, grant all permissions
                if (isSuperAdminUser) {
                    setPermissions(['*']); // Wildcard for all permissions
                } else {
                    // Set user's actual permissions
                    const permissionNames = data.permissions?.map((p: Permission) => p.name) || [];
                    setPermissions(permissionNames);
                }
            } else {
                // If not authenticated, clear permissions
                setPermissions([]);
                setIsSuperAdmin(false);
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
            setPermissions([]);
            setIsSuperAdmin(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const hasPermission = (permission: string): boolean => {
        // Super admin has all permissions
        if (isSuperAdmin || permissions.includes('*')) {
            return true;
        }

        return permissions.includes(permission);
    };

    const hasAnyPermission = (perms: string[]): boolean => {
        // Super admin has all permissions
        if (isSuperAdmin || permissions.includes('*')) {
            return true;
        }

        return perms.some(p => permissions.includes(p));
    };

    const hasAllPermissions = (perms: string[]): boolean => {
        // Super admin has all permissions
        if (isSuperAdmin || permissions.includes('*')) {
            return true;
        }

        return perms.every(p => permissions.includes(p));
    };

    const refreshPermissions = async () => {
        await fetchPermissions();
    };

    // CRUD action helpers
    const canCreate = (resource: string): boolean => {
        return hasPermission(`${resource}.create`);
    };

    const canUpdate = (resource: string): boolean => {
        return hasPermission(`${resource}.update`);
    };

    const canDelete = (resource: string): boolean => {
        return hasPermission(`${resource}.delete`);
    };

    const canView = (resource: string): boolean => {
        return hasPermission(`${resource}.index`) || hasPermission(`${resource}.view`);
    };

    return (
        <PermissionContext.Provider
            value={{
                permissions,
                loading,
                hasPermission,
                hasAnyPermission,
                hasAllPermissions,
                canCreate,
                canUpdate,
                canDelete,
                canView,
                isSuperAdmin,
                refreshPermissions
            }}
        >
            {children}
        </PermissionContext.Provider>
    );
}

export function usePermissions() {
    const context = useContext(PermissionContext);
    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionProvider');
    }
    return context;
}
