'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { User, Mail, Phone, MapPin, Calendar, Briefcase, Shield, Camera, Save, X, Edit2, Key } from 'lucide-react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import apiClient from '@/lib/api';

type UserProfile = {
    id: number;
    username: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    photo: string | null;
    roles: string[];
    permissions: string[];
    created_at: string;
};

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        photo: null as File | null
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            // Get current user from localStorage
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setProfile(user);
                setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    address: user.address || '',
                    photo: null
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
            Swal.fire('Error', 'Gagal memuat profil', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData({ ...formData, photo: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            if (formData.email) data.append('email', formData.email);
            if (formData.phone) data.append('phone', formData.phone);
            if (formData.address) data.append('address', formData.address);
            if (formData.photo) data.append('photo', formData.photo);

            // Note: You'll need to create this endpoint in backend
            await apiClient.put('/auth/profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Swal.fire({
                title: 'Berhasil!',
                text: 'Profil berhasil diperbarui',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            setIsEditing(false);
            fetchProfile();
        } catch (error: any) {
            console.error(error);
            Swal.fire('Gagal!', error.response?.data?.detail || 'Gagal memperbarui profil', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            Swal.fire('Error', 'Password baru tidak cocok', 'error');
            return;
        }

        if (passwordData.new_password.length < 6) {
            Swal.fire('Error', 'Password minimal 6 karakter', 'error');
            return;
        }

        setIsSaving(true);
        try {
            await apiClient.post('/auth/change-password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });

            Swal.fire({
                title: 'Berhasil!',
                text: 'Password berhasil diubah',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            setIsChangingPassword(false);
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (error: any) {
            console.error(error);
            Swal.fire('Gagal!', error.response?.data?.detail || 'Gagal mengubah password', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    if (loading) {
        return (
            <MainLayout>
                <PageBreadcrumb pageTitle="Profil Saya" />
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
                        <p className="mt-4 text-gray-500">Memuat profil...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!profile) {
        return (
            <MainLayout>
                <PageBreadcrumb pageTitle="Profil Saya" />
                <div className="text-center py-10">
                    <p className="text-gray-500">Profil tidak ditemukan</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Profil Saya" />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="text-center">
                            {/* Profile Photo */}
                            <div className="relative mx-auto mb-4 h-32 w-32">
                                {profile.photo || previewImage ? (
                                    <Image
                                        src={previewImage || profile.photo || ''}
                                        alt={profile.name}
                                        fill
                                        className="rounded-full object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-3xl font-bold text-white">
                                        {getInitials(profile.name)}
                                    </div>
                                )}
                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-brand-500 text-white shadow-lg hover:bg-brand-600 transition">
                                        <Camera className="h-5 w-5" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Name & Username */}
                            <h2 className="text-2xl font-bold text-black dark:text-white">
                                {profile.name}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">@{profile.username}</p>

                            {/* Roles */}
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                {profile.roles.map((role, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-500"
                                    >
                                        <Shield className="h-3 w-3" />
                                        {role}
                                    </span>
                                ))}
                            </div>

                            {/* Member Since */}
                            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    Bergabung sejak{' '}
                                    {new Date(profile.created_at).toLocaleDateString('id-ID', {
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 space-y-2">
                                {!isEditing && (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                            Edit Profil
                                        </button>
                                        <button
                                            onClick={() => setIsChangingPassword(true)}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition"
                                        >
                                            <Key className="h-4 w-4" />
                                            Ubah Password
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details & Forms */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Details / Edit Form */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-black dark:text-white">
                                {isEditing ? 'Edit Profil' : 'Informasi Profil'}
                            </h3>
                            {isEditing && (
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setPreviewImage(null);
                                        fetchProfile();
                                    }}
                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                        Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                        Nomor Telepon
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                        Alamat
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Simpan Perubahan
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setPreviewImage(null);
                                            fetchProfile();
                                        }}
                                        className="px-6 rounded-lg border border-stroke bg-white text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 rounded-lg bg-gray-50 p-4 dark:bg-meta-4/20">
                                    <User className="mt-1 h-5 w-5 text-brand-500" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Nama Lengkap</p>
                                        <p className="mt-1 font-medium text-black dark:text-white">{profile.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 rounded-lg bg-gray-50 p-4 dark:bg-meta-4/20">
                                    <Mail className="mt-1 h-5 w-5 text-brand-500" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                        <p className="mt-1 font-medium text-black dark:text-white">
                                            {profile.email || '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 rounded-lg bg-gray-50 p-4 dark:bg-meta-4/20">
                                    <Phone className="mt-1 h-5 w-5 text-brand-500" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Nomor Telepon</p>
                                        <p className="mt-1 font-medium text-black dark:text-white">
                                            {profile.phone || '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 rounded-lg bg-gray-50 p-4 dark:bg-meta-4/20">
                                    <MapPin className="mt-1 h-5 w-5 text-brand-500" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Alamat</p>
                                        <p className="mt-1 font-medium text-black dark:text-white">
                                            {profile.address || '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 rounded-lg bg-gray-50 p-4 dark:bg-meta-4/20">
                                    <Briefcase className="mt-1 h-5 w-5 text-brand-500" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Username</p>
                                        <p className="mt-1 font-medium text-black dark:text-white">
                                            {profile.username}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Change Password Form */}
                    {isChangingPassword && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-black dark:text-white">
                                    Ubah Password
                                </h3>
                                <button
                                    onClick={() => {
                                        setIsChangingPassword(false);
                                        setPasswordData({
                                            current_password: '',
                                            new_password: '',
                                            confirm_password: ''
                                        });
                                    }}
                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                        Password Lama
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.current_password}
                                        onChange={e => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                        Password Baru
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.new_password}
                                        onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                        required
                                        minLength={6}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Minimal 6 karakter</p>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                        Konfirmasi Password Baru
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.confirm_password}
                                        onChange={e => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <Key className="h-4 w-4" />
                                                Ubah Password
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsChangingPassword(false);
                                            setPasswordData({
                                                current_password: '',
                                                new_password: '',
                                                confirm_password: ''
                                            });
                                        }}
                                        className="px-6 rounded-lg border border-stroke bg-white text-black hover:bg-gray-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:bg-opacity-90 transition"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Permissions Card */}
                    {!isEditing && !isChangingPassword && profile.permissions.length > 0 && (
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                            <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
                                Hak Akses
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.permissions.slice(0, 20).map((permission, idx) => (
                                    <span
                                        key={idx}
                                        className="inline-flex rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-meta-4 dark:text-gray-300"
                                    >
                                        {permission}
                                    </span>
                                ))}
                                {profile.permissions.length > 20 && (
                                    <span className="inline-flex rounded-md bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-500">
                                        +{profile.permissions.length - 20} lainnya
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
