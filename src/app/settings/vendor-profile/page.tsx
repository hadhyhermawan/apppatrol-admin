'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Camera, Building2, UserCircle, Briefcase, Mail, KeyRound, Loader2, Save, Plus, Trash2 } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';
import Swal from 'sweetalert2';
import Link from 'next/link';

function VendorProfilePage() {
    const { isSuperAdmin, vendorId } = usePermissions();

    // Determine which vendor_id to load/save
    // If the user has a vendor_id directly, they are a Vendor Admin
    // If it's a super admin, for now this page might just load their first vendor or require an ID.
    // Wait, the user asked for 1 page "pada halaman super admin... agar bisa merubah masing masing vendornya".
    // If Super Admin, let's allow them to pick a vendor first? Or maybe this page is just "Profil Perusahaan" for Vendor Admins to change their own. 
    // Wait, if it's Super Admin viewing it, they can select a Vendor or pass `?vendorId=...`. Let's support a query param.
    // Actually, "mereka juga bisa mengupload foto perusahaannya" means the Vendors themselves use this page. So it acts primarily as "My Company Profile".
    const [activeVendorId, setActiveVendorId] = useState<number | null>(null);
    const [vendorsAvailable, setVendorsAvailable] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        nama_vendor: '',
        alamat: '',
        kontak: '',
        admin_name: '',
        admin_username: '',
        admin_email: '',
        admin_password: '',
    });
    const [signatories, setSignatories] = useState<{ id?: number, nama: string, jabatan: string }[]>([]);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);

    useEffect(() => {
        if (isSuperAdmin) {
            // Fetch list of vendors for SuperAdmin to select
            apiClient.get('/vendors').then((res: any) => {
                if (Array.isArray(res)) setVendorsAvailable(res);
            }).catch(console.error);
        } else if (vendorId) {
            setActiveVendorId(Number(vendorId));
        }
    }, [isSuperAdmin, vendorId]);

    useEffect(() => {
        if (activeVendorId !== null) {
            fetchVendorProfile(activeVendorId);
        } else {
            // Reset form if no vendor picked
            setFormData({
                nama_vendor: '', alamat: '', kontak: '',
                admin_name: '', admin_username: '',
                admin_email: '', admin_password: ''
            });
            setSignatories([]);
            setLogoPreview(null);
            setLogoFile(null);
        }
    }, [activeVendorId]);

    const fetchVendorProfile = async (id: number) => {
        setLoading(true);
        try {
            const res: any = await apiClient.get(`/vendors/${id}/profile`);
            if (res) {
                setFormData({
                    nama_vendor: res.nama_vendor || '',
                    alamat: res.alamat || '',
                    kontak: res.kontak || '',
                    admin_name: res.admin_name || '',
                    admin_username: res.admin_username || '',
                    admin_email: res.admin_email || '',
                    admin_password: '', // clear password implicitly
                });
                setSignatories(res.signatories || []);
                setLogoPreview(res.logo || null);
            }
        } catch (error: any) {
            Swal.fire("Gagal", error?.response?.data?.detail || "Gagal memuat profil vendor", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSignatoryChange = (index: number, field: string, value: string) => {
        const newSig = [...signatories];
        newSig[index] = { ...newSig[index], [field]: value };
        setSignatories(newSig);
    };

    const addSignatory = () => {
        setSignatories([...signatories, { nama: '', jabatan: '' }]);
    };

    const removeSignatory = (index: number) => {
        const newSig = [...signatories];
        newSig.splice(index, 1);
        setSignatories(newSig);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeVendorId) {
            Swal.fire("Pilih vendor", "Pilih vendor terlebih dahulu!", "warning");
            return;
        }

        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('nama_vendor', formData.nama_vendor);
            if (formData.alamat) fd.append('alamat', formData.alamat);
            if (formData.kontak) fd.append('kontak', formData.kontak);
            if (formData.admin_name) fd.append('admin_name', formData.admin_name);
            if (formData.admin_username) fd.append('admin_username', formData.admin_username);
            if (formData.admin_email) fd.append('admin_email', formData.admin_email);
            if (formData.admin_password) fd.append('admin_password', formData.admin_password);

            // Append signatories as JSON
            fd.append('signatories', JSON.stringify(signatories));

            if (logoFile) {
                fd.append('logo_file', logoFile);
            }

            const res: any = await apiClient.post(`/vendors/${activeVendorId}/profile`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Swal.fire("Berhasil", "Profil perusahaan berhasil diperbarui!", "success");
            setFormData(prev => ({ ...prev, admin_password: '' })); // clear pwd input
            if (res.logo) setLogoPreview(res.logo);

        } catch (error: any) {
            Swal.fire("Gagal", error?.response?.data?.detail || "Gagal menyimpan perubahan", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <MainLayout>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <PageBreadcrumb pageTitle="Profil Perusahaan & Pengaturan" />
            </div>

            {isSuperAdmin && (
                <div className="mb-6 p-4 md:p-6 bg-white dark:bg-boxdark rounded-2xl shadow-sm border border-gray-100 dark:border-strokedark flex flex-col sm:flex-row items-center gap-4">
                    <label className="font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Pilih Vendor untuk diedit: </label>
                    <select
                        className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-meta-4 dark:border-strokedark dark:text-white transition-all outline-none"
                        value={activeVendorId || ""}
                        onChange={(e) => setActiveVendorId(e.target.value ? Number(e.target.value) : null)}
                    >
                        <option value="">-- Pilih Vendor --</option>
                        {vendorsAvailable.map(v => (
                            <option key={v.id} value={v.id}>{v.nama_vendor}</option>
                        ))}
                    </select>
                </div>
            )}

            {!activeVendorId && !loading && (
                <div className="text-center py-20 bg-white dark:bg-boxdark rounded-2xl shadow-sm border border-gray-100 dark:border-strokedark">
                    <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Pilih Vendor</h3>
                    <p className="text-gray-500 mt-2">Silakan pilih vendor di atas untuk melihat dan mengubah profil.</p>
                </div>
            )}

            {loading && activeVendorId ? (
                <div className="flex justify-center items-center py-32 bg-white dark:bg-boxdark rounded-2xl shadow-sm">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
            ) : (activeVendorId && (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT COL - LOGO & BASE INFO */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-boxdark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-strokedark">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b pb-3 mb-6 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                Logo Perusahaan
                            </h3>

                            <div className="flex flex-col items-center gap-4">
                                <div className="w-48 h-48 rounded-xl bg-gray-50 dark:bg-meta-4 border-2 border-dashed border-gray-300 dark:border-strokedark flex items-center justify-center overflow-hidden relative group transition-all hover:border-blue-400">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <div className="text-center text-gray-400 flex flex-col items-center">
                                            <Camera className="w-10 h-10 mb-2 opacity-50" />
                                            <span className="text-sm font-medium">Unggah Logo</span>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <label htmlFor="logo-upload" className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-lg font-medium text-sm hover:scale-105 transition-transform shadow-lg">
                                            Pilih Foto
                                        </label>
                                    </div>
                                    <input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                <p className="text-xs text-center text-gray-500 px-4">
                                    Format direkomendasikan: PNG transparan atau JPG. Ukuran maks 2MB. Logo ini akan dicetak pada Laporan PDF.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COL - FORM FIELDS */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Detail Perusahaan */}
                        <div className="bg-white dark:bg-boxdark rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-strokedark">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b pb-3 mb-6 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                                Detail Perusahaan & Penandatangan
                            </h3>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Vendor / Perusahaan <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="nama_vendor"
                                        placeholder="Platform Security Group"
                                        value={formData.nama_vendor}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-5 py-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-strokedark dark:bg-meta-4 dark:text-white placeholder-gray-400 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Alamat Lengkap</label>
                                    <textarea
                                        name="alamat"
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-5 py-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-strokedark dark:bg-meta-4 dark:text-white placeholder-gray-400 outline-none transition disabled:bg-gray-100"
                                        placeholder="Jl. Thamrin No. 9..."
                                        rows={2}
                                        value={formData.alamat}
                                        onChange={handleChange as any}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Signatories Section */}
                        <div className="bg-white dark:bg-boxdark rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-strokedark">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-6 gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <UserCircle className="w-5 h-5 text-blue-600" />
                                        Penandatangan Laporan (PDF)
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Peran pada dokumen PDF otomatis disusun berdasarkan urutan kotak di bawah.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addSignatory}
                                    className="flex items-center gap-2 text-sm font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tambah
                                </button>
                            </div>

                            {signatories.length === 0 ? (
                                <p className="text-sm text-gray-500 italic text-center py-6 bg-gray-50 rounded-xl">Belum ada penandatangan yang ditambahkan.</p>
                            ) : (
                                <div className="space-y-4">
                                    {signatories.map((sig, index) => (
                                        <div key={index} className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 dark:bg-meta-4 p-5 rounded-xl border border-gray-200 dark:border-strokedark relative pt-10 md:pt-8 md:mt-2">
                                            <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-4 py-1.5 rounded-tr-xl rounded-bl-lg text-xs font-bold shadow-sm">
                                                Sebagai: {index === 0 ? "Mengetahui," : index === signatories.length - 1 ? "Dibuat Oleh," : "Disetujui Oleh,"}
                                            </div>

                                            <div className="flex-1 w-full">
                                                <label className="mb-2 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Penandatangan</label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: Ir. Sudirman"
                                                    value={sig.nama}
                                                    onChange={(e) => handleSignatoryChange(index, 'nama', e.target.value)}
                                                    required
                                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-strokedark dark:bg-boxdark dark:text-white outline-none"
                                                />
                                            </div>
                                            <div className="flex-1 w-full">
                                                <label className="mb-2 block text-xs font-semibold text-gray-500 uppercase tracking-wider">Jabatan</label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: Manager Operasional"
                                                    value={sig.jabatan}
                                                    onChange={(e) => handleSignatoryChange(index, 'jabatan', e.target.value)}
                                                    required
                                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-strokedark dark:bg-boxdark dark:text-white outline-none"
                                                />
                                            </div>
                                            <div className="pb-1">
                                                <button
                                                    type="button"
                                                    onClick={() => removeSignatory(index)}
                                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors tooltip tooltip-bottom"
                                                    title="Hapus Penandatangan"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Akun Vendor Admin */}
                        <div className="bg-white dark:bg-boxdark rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-strokedark relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <KeyRound className="w-32 h-32" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b pb-3 mb-6 flex items-center gap-2 relative z-10">
                                <UserCircle className="w-5 h-5 text-blue-600" />
                                Kredensial Akun Utama Vendor
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap Admin <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="admin_name"
                                        placeholder="Admin Vendor A"
                                        value={formData.admin_name}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-5 py-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-strokedark dark:bg-meta-4 dark:text-white placeholder-gray-400 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Email Admin <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        name="admin_email"
                                        placeholder="admin@vendor.com"
                                        value={formData.admin_email}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-5 py-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-strokedark dark:bg-meta-4 dark:text-white placeholder-gray-400 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Username Login <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="admin_username"
                                        placeholder="vendoradmin"
                                        value={formData.admin_username}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-5 py-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-strokedark dark:bg-meta-4 dark:text-white placeholder-gray-400 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Password Baru <span className="text-xs text-gray-400 font-normal">(Kosongkan jika tidak ingin diubah)</span></label>
                                    <input
                                        type="password"
                                        name="admin_password"
                                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-5 py-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-strokedark dark:bg-meta-4 dark:text-white placeholder-gray-400 outline-none transition disabled:bg-gray-100"
                                        placeholder="••••••••"
                                        value={formData.admin_password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SUBMIT BUTTON */}
                        <div className="flex justify-end pt-4 pb-10">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {saving ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                        </div>
                    </div>
                </form>
            ))}
        </MainLayout>
    );
}

export default withPermission(VendorProfilePage, { permissions: [] });
