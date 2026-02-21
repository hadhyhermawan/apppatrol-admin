'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../lib/api';

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
    canDetail: (resource: string) => boolean;
    isSuperAdmin: boolean;
    refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    // Initialize isSuperAdmin from localStorage cache to avoid flash
    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('patrol_is_super_admin') === 'true';
        }
        return false;
    });

    const fetchPermissions = async () => {
        try {
            setLoading(true);

            // Check if token exists before making request
            const token = typeof window !== 'undefined' ? localStorage.getItem('patrol_token') : null;
            if (!token) {
                setPermissions([]);
                setIsSuperAdmin(false);
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('patrol_is_super_admin');
                }
                setLoading(false);
                return;
            }

            // Get current user's permissions from backend
            const data: any = await apiClient.get('/auth/me');

            // Check if super admin (role id = 1 or role name = 'super admin')
            const roles = data.roles || [];
            const isSuperAdminUser = roles.length > 0 && roles.some((role: any) =>
                role.id === 1 || role.name?.toLowerCase() === 'super admin'
            );

            console.log('[PermissionContext] roles:', roles, '| isSuperAdmin:', isSuperAdminUser);

            // Cache to localStorage to avoid flash on re-renders
            if (typeof window !== 'undefined') {
                localStorage.setItem('patrol_is_super_admin', String(isSuperAdminUser));
            }

            setIsSuperAdmin(isSuperAdminUser);

            // If super admin, grant all permissions
            if (isSuperAdminUser) {
                setPermissions(['*']); // Wildcard for all permissions
            } else {
                // Set user's actual permissions
                const permissionNames = data.permissions?.map((p: Permission) => p.name) || [];
                setPermissions(permissionNames);
            }
        } catch (error: any) {
            // Only log if it's not a 401 (since 401 is expected if token expired)
            if (error.response?.status !== 401) {
                console.error('Error fetching permissions:', error);
            }
            setPermissions([]);
            setIsSuperAdmin(false);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('patrol_is_super_admin');
            }
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
                canDetail: (resource: string) => hasPermission(`${resource}.show`) || hasPermission(`${resource}.index`),
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
