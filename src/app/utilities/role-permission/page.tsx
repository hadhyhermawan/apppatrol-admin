"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { withPermission } from '@/hoc/withPermission';
import apiClient from '@/lib/api';
import Swal from 'sweetalert2';

interface Role {
    id: number;
    name: string;
    guard_name: string;
    permission_count: number;
    created_at: string;
    updated_at: string;
}

interface PermissionGroup {
    id: number;
    name: string;
    permission_count: number;
    created_at: string;
    updated_at: string;
}

interface Permission {
    id: number;
    name: string;
    guard_name: string;
    id_permission_group: number;
    group_name: string;
    created_at: string;
    updated_at: string;
}

function RolePermissionContent() {
    const searchParams = useSearchParams();
    const roleIdParam = searchParams.get('roleId');

    const [roles, setRoles] = useState<Role[]>([]);
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"roles" | "permissions">("roles");

    useEffect(() => {
        fetchData();
    }, []);

    // Auto-select role if roleId parameter is present
    useEffect(() => {
        if (roleIdParam && roles.length > 0 && !selectedRole) {
            const roleId = parseInt(roleIdParam);
            const role = roles.find(r => r.id === roleId);
            if (role) {
                fetchRoleDetails(roleId);
            }
        }
    }, [roleIdParam, roles, selectedRole]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rolesRes, groupsRes, permsRes] = await Promise.all([
                apiClient.get("/role-permission/roles"),
                apiClient.get("/role-permission/permission-groups"),
                apiClient.get("/role-permission/permissions"),
            ]);

            if (rolesRes) setRoles(rolesRes as any);
            if (groupsRes) setPermissionGroups(groupsRes as any);
            if (permsRes) setPermissions(permsRes as any);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoleDetails = async (roleId: number) => {
        try {
            const data: any = await apiClient.get(`/role-permission/roles/${roleId}`);
            if (data) {
                setSelectedRole(data.role);
                setRolePermissions(data.permissions);
            }
        } catch (error) {
            console.error("Error fetching role details:", error);
        }
    };

    const assignPermissionGroup = async (roleId: number, groupId: number) => {
        try {
            const res = await apiClient.post("/role-permission/assign-permission-group", { role_id: roleId, group_id: groupId });

            if (res) {
                // Silently update or show a gentle toast, but for single permission toggles, refetch is enough
                if (selectedRole) fetchRoleDetails(selectedRole.id);
                fetchData();
            }
        } catch (error) {
            console.error("Error assigning permissions:", error);
        }
    };

    const removePermission = async (roleId: number, permissionId: number) => {
        try {
            const res = await apiClient.post("/role-permission/remove-permissions", { role_id: roleId, permission_ids: [permissionId] });

            if (res) {
                if (selectedRole) fetchRoleDetails(selectedRole.id);
                fetchData();
            }
        } catch (error: any) {
            console.error("Error removing permission:", error);
            Swal.fire({
                title: 'Gagal',
                text: error?.response?.data?.detail || "Gagal menghapus hak akses",
                icon: 'error',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex h-screen items-center justify-center">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Role & Permission Management" />

            <div className="mb-6">
                <div className="flex gap-4 border-b border-stroke dark:border-strokedark">
                    <button
                        className={`px-6 py-3 font-medium ${activeTab === "roles"
                            ? "border-b-2 border-primary text-primary"
                            : "text-body dark:text-bodydark"
                            }`}
                        onClick={() => setActiveTab("roles")}
                    >
                        Roles Management
                    </button>
                    <button
                        className={`px-6 py-3 font-medium ${activeTab === "permissions"
                            ? "border-b-2 border-primary text-primary"
                            : "text-body dark:text-bodydark"
                            }`}
                        onClick={() => setActiveTab("permissions")}
                    >
                        Permissions Overview
                    </button>
                </div>
            </div>

            {activeTab === "roles" && (
                <div className="flex flex-col xl:flex-row gap-6 items-start">
                    {/* Roles List */}
                    <div className="w-full xl:w-1/4 xl:sticky xl:top-24 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                            <h3 className="font-medium text-black dark:text-white">
                                Web Admin Roles ({roles.filter(r => r.name.toLowerCase() !== 'karyawan').length})
                            </h3>
                            <p className="text-xs text-body dark:text-bodydark mt-1">
                                Role "karyawan" tidak ditampilkan (khusus mobile app)
                            </p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                {roles
                                    .filter(role => role.name.toLowerCase() !== 'karyawan')
                                    .map((role) => (
                                        <div
                                            key={role.id}
                                            className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-primary hover:shadow-1 ${selectedRole?.id === role.id
                                                ? "border-primary bg-primary/5 shadow-1 ring-1 ring-primary"
                                                : "border-stroke bg-gray-50 dark:bg-meta-4 dark:border-strokedark"
                                                }`}
                                            onClick={() => fetchRoleDetails(role.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-black dark:text-white">
                                                        {role.name}
                                                        {role.id === 1 && (
                                                            <span className="ml-2 text-xl">👑</span>
                                                        )}
                                                    </h4>
                                                    <p className="text-sm text-body dark:text-bodydark">
                                                        {role.permission_count} permissions
                                                    </p>
                                                </div>
                                                <svg
                                                    className="h-5 w-5 text-body dark:text-bodydark"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5l7 7-7 7"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Role Details */}
                    <div className="w-full xl:w-3/4 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                            <h3 className="font-medium text-black dark:text-white">
                                {selectedRole ? `${selectedRole.name} Details` : "Select a Role"}
                            </h3>
                        </div>
                        <div className="p-6">
                            {selectedRole ? (
                                <>
                                    {/* Role Info */}
                                    <div className="mb-6 rounded-lg bg-gray-2 p-4 dark:bg-meta-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-lg font-medium text-black dark:text-white">
                                                    {selectedRole.name}
                                                    {selectedRole.id === 1 && (
                                                        <span className="ml-2 text-2xl">👑</span>
                                                    )}
                                                </h4>
                                                <p className="text-sm text-body dark:text-bodydark">
                                                    {rolePermissions.length} permissions assigned
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Permission Checklist by Group */}
                                    <div className="space-y-4">
                                        <h5 className="text-sm font-medium text-black dark:text-white flex items-center justify-between">
                                            <span>Manage Permissions</span>
                                            {selectedRole.id !== 1 && (
                                                <button
                                                    onClick={() => {
                                                        if (selectedRole) fetchRoleDetails(selectedRole.id);
                                                    }}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Refresh
                                                </button>
                                            )}
                                        </h5>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[75vh] overflow-y-auto p-2">
                                            {permissionGroups.map((group) => {
                                                const groupPerms = permissions.filter(
                                                    (p) => p.id_permission_group === group.id
                                                );
                                                if (groupPerms.length === 0) return null;

                                                const assignedCount = groupPerms.filter(p =>
                                                    rolePermissions.some(rp => rp.id === p.id)
                                                ).length;

                                                return (
                                                    <div
                                                        key={group.id}
                                                        className="rounded-lg border border-stroke bg-white dark:border-strokedark dark:bg-boxdark"
                                                    >
                                                        <div className="border-b border-stroke px-4 py-3 dark:border-strokedark">
                                                            <h6 className="text-sm font-semibold text-black dark:text-white">
                                                                {group.name}
                                                            </h6>
                                                            <p className="text-xs text-body dark:text-bodydark mt-1">
                                                                {assignedCount}/{groupPerms.length} selected
                                                            </p>
                                                        </div>
                                                        <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
                                                            {groupPerms.map((perm) => {
                                                                const isChecked = rolePermissions.some(
                                                                    (rp) => rp.id === perm.id
                                                                );
                                                                const isDisabled = selectedRole.id === 1;

                                                                return (
                                                                    <label
                                                                        key={perm.id}
                                                                        className={`flex items-start gap-3 cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/5 hover:border-primary dark:hover:bg-meta-4'
                                                                            } p-3 rounded-lg border ${isChecked ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-stroke dark:border-strokedark'} transition-all min-h-[50px]`}
                                                                    >
                                                                        <div className="flex items-center h-5 mt-0.5">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isChecked}
                                                                                disabled={isDisabled}
                                                                                onChange={async (e) => {
                                                                                    if (isDisabled) return;

                                                                                    if (e.target.checked) {
                                                                                        // Assign permission
                                                                                        try {
                                                                                            const res = await apiClient.post("/role-permission/assign-permissions", {
                                                                                                role_id: selectedRole.id,
                                                                                                permission_ids: [perm.id]
                                                                                            });
                                                                                            if (res) {
                                                                                                fetchRoleDetails(selectedRole.id);
                                                                                            }
                                                                                        } catch (error: any) {
                                                                                            console.error("Error assigning permission:", error);
                                                                                            Swal.fire({
                                                                                                title: 'Gagal',
                                                                                                text: error?.response?.data?.detail || "Gagal memberikan hak akses",
                                                                                                icon: 'error',
                                                                                                toast: true,
                                                                                                position: 'top-end',
                                                                                                showConfirmButton: false,
                                                                                                timer: 3000
                                                                                            });
                                                                                        }
                                                                                    } else {
                                                                                        // Remove permission
                                                                                        removePermission(selectedRole.id, perm.id);
                                                                                    }
                                                                                }}
                                                                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                                            />
                                                                        </div>
                                                                        <span className="text-sm font-medium text-black dark:text-white flex-1 leading-tight break-words">
                                                                            {perm.name.replace(`${group.name.toLowerCase()}.`, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                                        </span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex h-64 items-center justify-center text-body dark:text-bodydark">
                                    <p>Select a role to view details</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "permissions" && (
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
                        <h3 className="font-medium text-black dark:text-white">
                            All Permissions ({permissions.length})
                        </h3>
                    </div>
                    <div className="p-6">
                        {permissionGroups.map((group) => {
                            const groupPerms = permissions.filter(
                                (p) => p.id_permission_group === group.id
                            );
                            if (groupPerms.length === 0) return null;

                            return (
                                <div key={group.id} className="mb-6">
                                    <h4 className="mb-3 font-medium text-black dark:text-white">
                                        {group.name} ({groupPerms.length})
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                                        {groupPerms.map((perm) => (
                                            <div
                                                key={perm.id}
                                                className="rounded border border-stroke p-3 dark:border-strokedark"
                                            >
                                                <p className="text-sm font-medium text-black dark:text-white">
                                                    {perm.name}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </MainLayout>
    );
}

function RolePermissionPage() {
    return (
        <Suspense fallback={
            <MainLayout>
                <div className="flex h-screen items-center justify-center">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            </MainLayout>
        }>
            <RolePermissionContent />
        </Suspense>
    );
}

// Protect page with permission
export default withPermission(RolePermissionPage, {
    permissions: ['super_admin_only']
});
