'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import apiClient from '@/lib/api';
import Swal from 'sweetalert2';
import { withPermission } from '@/hoc/withPermission';

type VendorItem = {
    id: number;
    nama_vendor: string;
    alamat?: string;
    kontak?: string;
    is_active: number;
    created_at?: string;
};

function EditVendorPage() {
    const router = useRouter();
    const params = useParams();
    const vendorId = params?.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [formData, setFormData] = useState<any>({
        nama_vendor: '',
        alamat: '',
        kontak: '',
        is_active: true,
        features: {}
    });

    useEffect(() => {
        if (!vendorId) return;

        // Fetch vendor data and features
        const fetchVendor = async () => {
            try {
                const resList = await apiClient.get('/vendors');
                const vendors = Array.isArray(resList) ? resList : (resList.data || []);
                const foundVendor = vendors.find((v: VendorItem) => v.id === parseInt(vendorId));

                if (!foundVendor) {
                    setErrorMsg("Vendor tidak ditemukan");
                    setIsLoading(false);
                    return;
                }

                // Fetch features from profile endpoint
                let features = {};
                try {
                    const profileRes: any = await apiClient.get(`/vendors/${vendorId}/profile`);
                    features = profileRes.features || {};
                } catch (e) {
                    console.error("Gagal mendapatkan profile vendor", e);
                }

                setFormData({
                    nama_vendor: foundVendor.nama_vendor,
                    alamat: foundVendor.alamat || '',
                    kontak: foundVendor.kontak || '',
                    is_active: foundVendor.is_active === 1,
                    features: features
                });

            } catch (error) {
                console.error("Error fetching vendor:", error);
                setErrorMsg("Terjadi kesalahan saat mengambil data vendor");
            } finally {
                setIsLoading(false);
            }
        };

        fetchVendor();
    }, [vendorId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.nama_vendor.trim()) {
            setErrorMsg('Harap isi nama vendor.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Post form data structure since /vendors/{id}/profile expects form data for features
            const fd = new FormData();
            fd.append('nama_vendor', formData.nama_vendor);
            if (formData.alamat) fd.append('alamat', formData.alamat);
            if (formData.kontak) fd.append('kontak', formData.kontak);
            if (formData.features) {
                fd.append('features', JSON.stringify(formData.features));
            }

            await apiClient.post(`/vendors/${vendorId}/profile`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update basic info that is not covered by profile update
            const payload = {
                nama_vendor: formData.nama_vendor,
                alamat: formData.alamat,
                kontak: formData.kontak,
                is_active: formData.is_active ? 1 : 0
            };
            await apiClient.put(`/vendors/${vendorId}`, payload);

            Swal.fire({
                title: 'Berhasil!',
                text: 'Data berhasil diperbarui.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            router.push('/master/vendor');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail || 'Terjadi kesalahan saat menyimpan.';
            setErrorMsg(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <MainLayout>
                <PageBreadcrumb pageTitle="Edit Vendor" />
                <div className="flex h-40 items-center justify-center">
                    <p className="text-gray-500">Memuat data vendor...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <PageBreadcrumb pageTitle="Edit Profil & Akses Vendor" />
            </div>

            <div className="rounded-2xl border border-stroke bg-white px-6 py-6 shadow-sm dark:border-strokedark dark:bg-boxdark max-w-4xl">
                <form onSubmit={handleSubmit}>
                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30 mb-6">
                            {errorMsg}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Kolom Kiri - Data Utama */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-black dark:text-white mb-2">Nama Vendor</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                    placeholder="Contoh: PT. Keamanan Abadi"
                                    value={formData.nama_vendor}
                                    onChange={e => setFormData({ ...formData, nama_vendor: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-black dark:text-white mb-2">Alamat Vendor</label>
                                <textarea
                                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                    placeholder="Alamat kantor..."
                                    rows={3}
                                    value={formData.alamat}
                                    onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-black dark:text-white mb-2">Kontak</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:focus:border-brand-500"
                                    placeholder="No HP / Email"
                                    value={formData.kontak}
                                    onChange={e => setFormData({ ...formData, kontak: e.target.value })}
                                />
                            </div>

                            <hr className="my-4 border-stroke dark:border-strokedark" />

                            <div className="flex flex-col gap-3">
                                <label className="block text-sm font-semibold text-black dark:text-white">Status Lisensi Vendor</label>
                                <label className="relative inline-flex items-center cursor-pointer max-w-max">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.is_active}
                                        onChange={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    />
                                    <div className="w-14 h-8 bg-red-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[24px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                                    <span className="ml-3 text-sm font-bold text-gray-900 dark:text-gray-300">
                                        {formData.is_active ? "Aktif (Lisensi Bekerja)" : "Blokir (Dihentikan)"}
                                    </span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Peringatan: Menonaktifkan lisensi vendor akan secara instan **memblokir** seluruh Satpam yang bernaung di bawah Vendor ini dari aplikasi Web maupun Android.
                                </p>
                            </div>
                        </div>

                        {/* Kolom Kanan - Modul */}
                        <div className="border border-stroke rounded-xl p-5 dark:border-strokedark bg-gray-50 dark:bg-boxdark/30">
                            <h4 className="font-semibold text-black dark:text-white mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                                Akses Modul B2B (Feature Toggles)
                            </h4>
                            <p className="text-xs text-gray-500 mb-6 pb-4 border-b border-stroke dark:border-strokedark">
                                Centang fitur di bawah ini untuk mengaktifkan modul bagi Vendor ini. Modul yang tidak tercentang otomatis akan disembunyikan di Dashboard Vendor dan Cabangnya.
                            </p>

                            <div className="space-y-5 pl-1">
                                {[
                                    { id: 'surat', label: 'Modul Laporan Surat' },
                                    { id: 'turlalin', label: 'Modul Patroli Turlalin' },
                                    { id: 'barang', label: 'Modul Logbook Barang' },
                                    { id: 'safety', label: 'Modul Safety Briefing' },
                                    { id: 'tamu', label: 'Modul Laporan Tamu / Visitor' },
                                    { id: 'presensi', label: 'Modul Presensi & Kehadiran' },
                                    { id: 'ptt', label: 'Modul Push to Talk (Walkie Channel)' },
                                ].map((feature) => (
                                    <div key={feature.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`feat_${feature.id}`}
                                            checked={formData.features?.[feature.id] === true}
                                            onChange={(e) => {
                                                const currentFeatures = formData.features || {};
                                                setFormData({
                                                    ...formData,
                                                    features: {
                                                        ...currentFeatures,
                                                        [feature.id]: e.target.checked
                                                    }
                                                });
                                            }}
                                            className="w-5 h-5 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer transition-all"
                                        />
                                        <label htmlFor={`feat_${feature.id}`} className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer select-none">
                                            {feature.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-stroke dark:border-strokedark">
                        <button
                            type="button"
                            onClick={() => router.push('/master/vendor')}
                            className="rounded-lg border border-stroke px-6 py-2.5 font-medium text-black transition hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-strokedark"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-brand-500 px-6 py-2.5 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                        >
                            {isSubmitting ? (
                                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span>
                            ) : (
                                "Simpan Perubahan"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}

export default withPermission(EditVendorPage, {
    permissions: [] // or specific super admin permission if you have one
});
