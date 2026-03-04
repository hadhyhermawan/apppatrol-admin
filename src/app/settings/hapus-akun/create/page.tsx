'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import { Save, ArrowLeft } from 'lucide-react';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function CreateAccountDeletionPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ title: '', content: '', version: '', is_active: true });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        if (!formData.title.trim() || !formData.content.trim() || !formData.version.trim()) {
            setErrorMsg('Harap isi judul, konten, dan versi.');
            return;
        }

        setIsSubmitting(true);
        try {
            await apiClient.post('/account-deletion', formData);
            Swal.fire({
                title: 'Berhasil!',
                text: 'Data berhasil disimpan.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            router.push('/settings/hapus-akun');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail || 'Terjadi kesalahan saat menyimpan.';
            setErrorMsg(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Tulis Kebijakan Penghapusan Akun Baru" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 mb-6">
                <button
                    onClick={() => router.push('/settings/hapus-akun')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Daftar
                </button>

                <form id="privacyForm" onSubmit={handleSubmit} className="space-y-5">
                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                            {errorMsg}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-black dark:text-white mb-2">Judul Dokumen</label>
                            <input
                                type="text"
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input dsabled:bg-gray-100"
                                placeholder="Contoh: Kebijakan Penghapusan Akun & Data"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-black dark:text-white mb-2">Versi</label>
                            <input
                                type="text"
                                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input"
                                placeholder="Contoh: v1.0.1"
                                value={formData.version}
                                onChange={e => setFormData({ ...formData, version: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                            Konten Kebijakan (Bisa multi-paragraf)
                        </label>
                        <div className="bg-white dark:bg-form-input rounded-lg border-[1.5px] border-stroke dark:border-form-strokedark">
                            <ReactQuill
                                theme="snow"
                                value={formData.content}
                                onChange={(val) => setFormData({ ...formData, content: val })}
                                className="h-64 mb-12 text-black dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <input
                            type="checkbox"
                            id="isActiveToggle"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        />
                        <label htmlFor="isActiveToggle" className="text-sm font-medium text-black dark:text-white cursor-pointer select-none">
                            Setel sebagai <strong>Dokumen Aktif (Live)</strong>
                            <p className="font-normal text-xs text-blue-600 dark:text-blue-400 mt-0.5">Mencentang ini akan otomatis menonaktifkan versi lainnya.</p>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-stroke dark:border-strokedark">
                        <button
                            type="button"
                            onClick={() => router.push('/settings/hapus-akun')}
                            className="px-5 py-2.5 text-sm font-medium text-black dark:text-white bg-white border border-stroke rounded-lg hover:bg-gray-50 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-opacity-90 flex items-center shadow-sm disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <span className="animate-spin mr-2 border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Simpan Kebijakan Penghapusan Akun
                        </button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}
