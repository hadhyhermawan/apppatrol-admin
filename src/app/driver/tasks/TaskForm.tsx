'use client';

import { useState, useEffect } from 'react';
import { ClipboardCheck, Save, Calendar, User, Info, Navigation } from 'lucide-react';
import apiClient from '@/lib/api';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SearchableSelect from '@/components/form/SearchableSelect';
import dynamic from 'next/dynamic';

const DatePicker = dynamic(() => import('@/components/form/date-picker'), {
    ssr: false,
    loading: () => <input type="text" className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input text-black dark:text-white" disabled />
});

interface TaskFormProps {
    mode: 'create' | 'edit';
    initialData?: any;
    options: any;
}

const InputGroup = ({ label, required = false, children, error }: any) => (
    <div className="mb-4">
        <label className="mb-2 block text-sm font-semibold text-black dark:text-white">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
);

const SectionTitle = ({ title, icon: Icon }: any) => (
    <div className="mb-6 flex items-center border-b border-gray-200 pb-3 dark:border-gray-700">
        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
            <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
);

export default function TaskForm({ mode, initialData, options }: TaskFormProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('informasi');
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (initialData && mode === 'edit') {
            setFormData({
                ...initialData
            });
        } else {
            setFormData({
                user_id: '',
                p2h_id: '',
                nama_tamu: '',
                tujuan_perjalanan: '',
                lokasi_jemput: '',
                lokasi_tujuan: '',
                jadwal_jemput: '',
                status: 'ASSIGNED'
            });
        }
    }, [initialData, mode]);

    const handleChangeText = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.user_id || !formData.jadwal_jemput) {
            Swal.fire('Error', 'Mohon lengkapi data wajib (Driver & Jadwal Jemput)', 'error');
            return;
        }

        setLoading(true);
        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined) {
                    submitData.append(key, formData[key]);
                }
            });

            if (mode === 'create') {
                await apiClient.post('/driver/tasks', submitData, { headers: { 'Content-Type': 'multipart/form-data' } });
                Swal.fire('Sukses', 'Job Order Driver berhasil ditambahkan', 'success').then(() => {
                    router.push('/driver/tasks');
                });
            } else {
                await apiClient.put(`/driver/tasks/${formData.id}`, submitData, { headers: { 'Content-Type': 'multipart/form-data' } });
                Swal.fire('Sukses', 'Job Order Driver berhasil diperbarui', 'success').then(() => {
                    router.push('/driver/tasks');
                });
            }
        } catch (error: any) {
            console.error(error);
            Swal.fire('Error', error.response?.data?.detail || 'Terjadi kesalahan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input text-black dark:text-white";

    const tabs = [
        { id: 'informasi', label: 'Form Job Order', icon: Navigation }
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col border-b border-gray-200 lg:flex-row dark:border-gray-800">
                    <nav className="flex w-full overflow-x-auto lg:w-64 lg:flex-col lg:border-r border-gray-200 dark:border-gray-800 lg:p-4 bg-gray-50/50 dark:bg-gray-800/50">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex w-full min-w-max items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? 'bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400'
                                        : 'text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                                        }`}
                                >
                                    <Icon className={`mr-3 h-5 w-5 ${activeTab === tab.id ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="flex-1 p-6 lg:p-8">
                        <div className={activeTab === 'informasi' ? 'block' : 'hidden'}>
                            <SectionTitle title="Informasi Job Order / Penugasan Driver" icon={Navigation} />

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <InputGroup label="Pilih Driver" required>
                                    <SearchableSelect
                                        options={[
                                            { value: '', label: '-- Pilih Driver --' },
                                            ...(options?.drivers?.map((d: any) => ({ value: d.id, label: d.name })) || [])
                                        ]}
                                        value={formData.user_id || ''}
                                        onChange={(val) => setFormData({ ...formData, user_id: val })}
                                        placeholder="Cari Driver..."
                                        usePortal={true}
                                    />
                                </InputGroup>

                                <InputGroup label="Pilih P2H Aktif (Opsional)">
                                    <SearchableSelect
                                        options={[
                                            { value: '', label: '-- Tidak Asign P2H Sekarang --' },
                                            ...(options?.p2h?.map((v: any) => ({ value: v.id, label: v.name })) || [])
                                        ]}
                                        value={formData.p2h_id || ''}
                                        onChange={(val) => setFormData({ ...formData, p2h_id: val })}
                                        placeholder="Cari Data P2H Hari Ini..."
                                        usePortal={true}
                                    />
                                    <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">Jika driver sudah melengkapi P2H, Anda bisa tautkan ke job ini.</p>
                                </InputGroup>

                                <InputGroup label="Nama Tamu / PIC">
                                    <input
                                        type="text"
                                        name="nama_tamu"
                                        placeholder="Cth: Bapak Direktur"
                                        value={formData.nama_tamu || ''}
                                        onChange={handleChangeText}
                                        className={inputClass}
                                    />
                                </InputGroup>

                                <InputGroup label="Tujuan Perjalanan">
                                    <input
                                        type="text"
                                        name="tujuan_perjalanan"
                                        placeholder="Cth: Kunjungan Proyek"
                                        value={formData.tujuan_perjalanan || ''}
                                        onChange={handleChangeText}
                                        className={inputClass}
                                    />
                                </InputGroup>

                                <InputGroup label="Lokasi Penjemputan">
                                    <input
                                        type="text"
                                        name="lokasi_jemput"
                                        placeholder="Cth: Bandara Soekarno Hatta"
                                        value={formData.lokasi_jemput || ''}
                                        onChange={handleChangeText}
                                        className={inputClass}
                                    />
                                </InputGroup>

                                <InputGroup label="Lokasi Tujuan">
                                    <input
                                        type="text"
                                        name="lokasi_tujuan"
                                        placeholder="Cth: Hotel Mulia Senayan"
                                        value={formData.lokasi_tujuan || ''}
                                        onChange={handleChangeText}
                                        className={inputClass}
                                    />
                                </InputGroup>

                                <InputGroup label="Jadwal Jemput (Tgl & Jam)" required>
                                    <input
                                        type="datetime-local"
                                        name="jadwal_jemput"
                                        value={formData.jadwal_jemput || ''}
                                        onChange={handleChangeText}
                                        className={inputClass}
                                    />
                                </InputGroup>

                                <InputGroup label="Status">
                                    <SearchableSelect
                                        options={[
                                            { value: 'ASSIGNED', label: 'Assigned' },
                                            { value: 'ON_THE_WAY_PICKUP', label: 'Menuju Penjemputan' },
                                            { value: 'PICKED_UP', label: 'Tamu Sudah Dijemput' },
                                            { value: 'COMPLETED', label: 'Selesai' },
                                            { value: 'CANCELED', label: 'Dibatalkan' }
                                        ]}
                                        value={formData.status || 'ASSIGNED'}
                                        onChange={(val) => setFormData({ ...formData, status: val })}
                                        placeholder="Status Perjalanan"
                                        usePortal={true}
                                    />
                                </InputGroup>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
                    <Link
                        href="/driver/tasks"
                        className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-hidden focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                    >
                        Batal
                    </Link>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 focus:outline-hidden focus:ring-4 focus:ring-brand-200 disabled:opacity-50 dark:focus:ring-brand-900"
                    >
                        {loading ? (
                            <>
                                <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Simpan Data
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

