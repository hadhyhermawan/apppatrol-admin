'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { Save } from 'lucide-react';
import Input from '@/components/form/input/InputField';
import TextArea from '@/components/form/input/TextArea';
import Switch from '@/components/form/switch/Switch';
import { withPermission } from '@/hoc/withPermission';
import { usePermissions } from '@/contexts/PermissionContext';

function GeneralSettingPage() {
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Initial state matching DTO
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data: any = await apiClient.get('/settings/general');
            setFormData(data);
            if (data.logo) {
                setLogoPreview(`${process.env.NEXT_PUBLIC_API_URL}/storage/logo/${data.logo}`);
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Gagal memuat pengaturan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleTextAreaChange = (name: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (name: string, checked: boolean) => {
        setFormData((prev: any) => ({ ...prev, [name]: checked ? 1 : 0 }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const data = new FormData();

            // Append all fields
            Object.keys(formData).forEach(key => {
                // Skip special fields or handle nulls
                if (key !== 'logo' && key !== 'created_at' && key !== 'updated_at' && formData[key] !== null) {
                    data.append(key, formData[key]);
                }
            });

            if (logoFile) {
                data.append('logo', logoFile);
            }

            await apiClient.put('/settings/general', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            Swal.fire('Berhasil', 'Pengaturan berhasil disimpan', 'success');
            fetchSettings(); // Refresh data

        } catch (error: any) {
            console.error(error);
            Swal.fire('Gagal', error.response?.data?.detail || 'Gagal menyimpan pengaturan', 'error');
        }
    };

    if (loading) return <MainLayout><div className="p-6">Memuat...</div></MainLayout>;

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="General Setting" />

            {/* Form wrapper */}
            <div className="grid grid-cols-1 gap-9 sm:grid-cols-2">
                <form id="settings-form" onSubmit={handleSubmit} className="contents">

                    {/* Profil Perusahaan */}
                    <div className="flex flex-col gap-9">
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                                <h3 className="font-medium text-black dark:text-white">Profil Perusahaan</h3>
                            </div>
                            <div className="p-6.5 flex flex-col gap-5">
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Nama Perusahaan</label>
                                    <Input
                                        type="text"
                                        name="nama_perusahaan"
                                        defaultValue={formData.nama_perusahaan}
                                        onChange={handleInputChange}
                                        placeholder="Masukkan nama perusahaan"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Alamat</label>
                                    <TextArea
                                        value={formData.alamat}
                                        onChange={(val) => handleTextAreaChange('alamat', val)}
                                        rows={3}
                                        placeholder="Masukkan alamat lengkap"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Telepon</label>
                                    <Input
                                        type="text"
                                        name="telepon"
                                        defaultValue={formData.telepon}
                                        onChange={handleInputChange}
                                        placeholder="Nomor telepon"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Logo</label>
                                    <div className="rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="w-full cursor-pointer file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-solid file:border-inherit file:bg-primary file:px-5 file:py-2.5 file:text-white file:hover:bg-primary/90 file:focus:border-primary file:active:border-primary disabled:pointer-events-none disabled:opacity-50"
                                        />
                                    </div>
                                    {logoPreview && (
                                        <div className="mt-4">
                                            <img src={logoPreview} alt="Logo Preview" className="h-20 object-contain rounded border border-stroke p-2 dark:border-strokedark bg-white dark:bg-meta-4" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Pengaturan Presensi */}
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                                <h3 className="font-medium text-black dark:text-white">Pengaturan Presensi & Laporan</h3>
                            </div>
                            <div className="p-6.5 flex flex-col gap-5">
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Total Jam Kerja / Bulan</label>
                                    <Input
                                        type="number"
                                        name="total_jam_bulan"
                                        defaultValue={formData.total_jam_bulan}
                                        onChange={handleInputChange}
                                        placeholder="Contoh: 173"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-1/2">
                                        <label className="mb-2.5 block text-black dark:text-white">Laporan Dari (Tgl)</label>
                                        <Input
                                            type="number"
                                            name="periode_laporan_dari"
                                            defaultValue={formData.periode_laporan_dari}
                                            onChange={handleInputChange}
                                            placeholder="1"
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label className="mb-2.5 block text-black dark:text-white">Sampai (Tgl)</label>
                                        <Input
                                            type="number"
                                            name="periode_laporan_sampai"
                                            defaultValue={formData.periode_laporan_sampai}
                                            onChange={handleInputChange}
                                            placeholder="31"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Switch
                                        label="Periode Laporan Lintas Bulan"
                                        defaultChecked={formData.periode_laporan_next_bulan === 1}
                                        onChange={(checked) => handleSwitchChange('periode_laporan_next_bulan', checked)}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Batas Jam Absen (Menit Toleransi)</label>
                                    <Input
                                        type="number"
                                        name="batas_jam_absen"
                                        defaultValue={formData.batas_jam_absen}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Batas Presensi Lintashari (Jam Reset)</label>
                                    <Input
                                        type="time"
                                        name="batas_presensi_lintashari"
                                        defaultValue={formData.batas_presensi_lintashari}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="flex flex-col gap-4 pt-2">
                                    <Switch
                                        label="Aktifkan Denda Keterlambatan"
                                        defaultChecked={formData.denda === 1}
                                        onChange={(checked) => handleSwitchChange('denda', checked)}
                                    />
                                    <Switch
                                        label="Batasi Absen (Lock Location)"
                                        defaultChecked={formData.batasi_absen === 1}
                                        onChange={(checked) => handleSwitchChange('batasi_absen', checked)}
                                    />
                                    <Switch
                                        label="Izinkan Multi Lokasi"
                                        defaultChecked={formData.multi_lokasi === 1}
                                        onChange={(checked) => handleSwitchChange('multi_lokasi', checked)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kolom Kanan */}
                    <div className="flex flex-col gap-9">
                        {/* Integrasi System */}
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                                <h3 className="font-medium text-black dark:text-white">Integrasi Sistem & Keamanan</h3>
                            </div>
                            <div className="p-6.5 flex flex-col gap-5">
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Cloud ID (Fingerspot)</label>
                                    <Input
                                        type="text"
                                        name="cloud_id"
                                        defaultValue={formData.cloud_id}
                                        onChange={handleInputChange}
                                        placeholder="Cloud ID"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Authorization Key (Fingerspot)</label>
                                    <Input
                                        type="text"
                                        name="api_key"
                                        defaultValue={formData.api_key}
                                        onChange={handleInputChange}
                                        placeholder="API Key"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Domain Email (Validasi Login)</label>
                                    <Input
                                        type="text"
                                        name="domain_email"
                                        defaultValue={formData.domain_email}
                                        onChange={handleInputChange}
                                        placeholder="contoh: k3guard.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notifikasi WA */}
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                                <h3 className="font-medium text-black dark:text-white">WhatsApp Gateway</h3>
                            </div>
                            <div className="p-6.5 flex flex-col gap-5">
                                <div className="mb-2">
                                    <Switch
                                        label="Aktifkan Notifikasi WA"
                                        defaultChecked={formData.notifikasi_wa === 1}
                                        onChange={(checked) => handleSwitchChange('notifikasi_wa', checked)}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">WA Gateway Domain</label>
                                    <Input
                                        type="text"
                                        name="domain_wa_gateway"
                                        defaultValue={formData.domain_wa_gateway}
                                        onChange={handleInputChange}
                                        placeholder="https://"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">WA API Key</label>
                                    <Input
                                        type="text"
                                        name="wa_api_key"
                                        defaultValue={formData.wa_api_key}
                                        onChange={handleInputChange}
                                        placeholder="Key"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Face Recognition Settings */}
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                                <h3 className="font-medium text-black dark:text-white">Face Recognition System (Mobile)</h3>
                            </div>
                            <div className="p-6.5 flex flex-col gap-5">
                                <div className="flex flex-col gap-4 mb-2">
                                    <Switch
                                        label="Wajib Face Recognition saat Absen"
                                        defaultChecked={formData.face_recognition === 1}
                                        onChange={(checked) => handleSwitchChange('face_recognition', checked)}
                                    />
                                    <Switch
                                        label="Block jika gagal berkali-kali"
                                        defaultChecked={formData.enable_face_block_system === 1}
                                        onChange={(checked) => handleSwitchChange('enable_face_block_system', checked)}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Limit Gagal (Block)</label>
                                    <Input
                                        type="number"
                                        name="face_block_limit"
                                        defaultValue={formData.face_block_limit}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Limit Liveness Check</label>
                                    <Input
                                        type="number"
                                        name="face_check_liveness_limit"
                                        defaultValue={formData.face_check_liveness_limit}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* App Version */}
                        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                                <h3 className="font-medium text-black dark:text-white">App Version Control</h3>
                            </div>
                            <div className="p-6.5 flex flex-col gap-5">
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Min Supported Version Code</label>
                                    <Input
                                        type="number"
                                        name="min_supported_version_code"
                                        defaultValue={formData.min_supported_version_code}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Latest Version Code</label>
                                    <Input
                                        type="number"
                                        name="latest_version_code"
                                        defaultValue={formData.latest_version_code}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Update URL (Play Store / APK Link)</label>
                                    <Input
                                        type="text"
                                        name="update_url"
                                        defaultValue={formData.update_url}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="mt-4">
                                    <button
                                        type="submit"
                                        form="settings-form"
                                        className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90"
                                    >
                                        <Save className="mr-2" /> Simpan Pengaturan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}

// Protect page with permission
export default withPermission(GeneralSettingPage, {
    permissions: ['generalsetting.index']
});
