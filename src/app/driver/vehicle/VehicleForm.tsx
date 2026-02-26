'use client';

import { useState, useEffect } from 'react';
import { Car, Save } from 'lucide-react';
import apiClient from '@/lib/api';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface VehicleFormProps {
    mode: 'create' | 'edit';
    initialData?: any;
}

const InputGroup = ({ label, required = false, children, error }: any) => (
    <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
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

export default function VehicleForm({ mode, initialData }: VehicleFormProps) {
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
                nama_kendaraan: '',
                plat_nomor: '',
                jenis: 'BBM',
                status: 'AVAILABLE',
                odometer_terakhir: 0
            });
        }
    }, [initialData, mode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.nama_kendaraan || !formData.plat_nomor || !formData.jenis) {
            Swal.fire('Error', 'Mohon lengkapi data wajib (Nama Kendaraan, Plat Nomor, Jenis)', 'error');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'create') {
                await apiClient.post('/driver/vehicle', formData);
                Swal.fire('Sukses', 'Kendaraan berhasil ditambahkan', 'success').then(() => {
                    router.push('/driver/vehicle');
                });
            } else {
                await apiClient.put(`/driver/vehicle/${formData.id}`, formData);
                Swal.fire('Sukses', 'Data kendaraan berhasil diperbarui', 'success').then(() => {
                    router.push('/driver/vehicle');
                });
            }
        } catch (error: any) {
            console.error(error);
            Swal.fire('Error', error.response?.data?.detail || 'Terjadi kesalahan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-brand-500 dark:focus:ring-brand-500";

    const tabs = [
        { id: 'informasi', label: 'Informasi Kendaraan', icon: Car }
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col border-b border-gray-200 lg:flex-row dark:border-gray-800">
                    {/* Sidebar Tabs */}
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

                    {/* Form Content */}
                    <div className="flex-1 p-6 lg:p-8">
                        {/* 1. INFORMASI KENDARAAN */}
                        <div className={activeTab === 'informasi' ? 'block' : 'hidden'}>
                            <SectionTitle title="Informasi Identitas Kendaraan" icon={Car} />
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <InputGroup label="Nama Kendaraan" required>
                                    <input
                                        type="text"
                                        name="nama_kendaraan"
                                        value={formData.nama_kendaraan || ''}
                                        onChange={handleChange}
                                        className={inputClass}
                                        placeholder="Contoh: Toyota Avanza"
                                    />
                                </InputGroup>
                                <InputGroup label="Plat Nomor" required>
                                    <input
                                        type="text"
                                        name="plat_nomor"
                                        value={formData.plat_nomor || ''}
                                        onChange={handleChange}
                                        className={inputClass}
                                        placeholder="Contoh: B 1234 CD"
                                    />
                                </InputGroup>

                                <InputGroup label="Jenis Kendaraan" required>
                                    <select name="jenis" value={formData.jenis || 'BBM'} onChange={handleChange} className={inputClass}>
                                        <option value="BBM">BBM (Bahan Bakar Minyak)</option>
                                        <option value="EV">EV (Electric Vehicle)</option>
                                    </select>
                                </InputGroup>

                                <InputGroup label="Status">
                                    <select name="status" value={formData.status || 'AVAILABLE'} onChange={handleChange} className={inputClass}>
                                        <option value="AVAILABLE">Available</option>
                                        <option value="IN_USE">In Use</option>
                                        <option value="MAINTENANCE">Maintenance</option>
                                    </select>
                                </InputGroup>

                                <InputGroup label="Odometer Terakhir">
                                    <input
                                        type="number"
                                        name="odometer_terakhir"
                                        value={formData.odometer_terakhir || 0}
                                        onChange={handleChange}
                                        className={inputClass}
                                    />
                                </InputGroup>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
                    <Link
                        href="/driver/vehicle"
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
