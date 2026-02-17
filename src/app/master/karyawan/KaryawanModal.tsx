'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/modal';
import { X, Upload, FileText, User, Users, MapPin, TabletSmartphone, Settings, Save, Lock, Briefcase, Contact, Image as ImageIcon } from 'lucide-react';
import apiClient from '@/lib/api';
import Swal from 'sweetalert2';
import Image from 'next/image';

interface OptionItem {
    code: string;
    name: string;
}

interface MasterOptions {
    departemen: OptionItem[];
    jabatan: OptionItem[];
    cabang: OptionItem[];
    status_kawin: OptionItem[];
}

interface KaryawanModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'create' | 'edit';
    initialData?: any;
    options: MasterOptions;
    onSuccess: () => void;
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
        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
);

export default function KaryawanModal({ isOpen, onClose, mode, initialData, options, onSuccess }: KaryawanModalProps) {
    const [activeTab, setActiveTab] = useState('pribadi');
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<any>({});
    const [filePreview, setFilePreview] = useState<any>({});
    const [files, setFiles] = useState<any>({});

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab('pribadi');
            setFiles({});

            if (initialData && mode === 'edit') {
                // Parse dates if necessary or use defaults
                setFormData({
                    ...initialData,
                    password: '', // Don't show password
                    // Cast nulls to empty strings for inputs
                    no_ktp: initialData.no_ktp || '',
                    no_hp: initialData.no_hp || '',
                    alamat: initialData.alamat || '',
                    tempat_lahir: initialData.tempat_lahir || '',
                    tanggal_lahir: initialData.tanggal_lahir || '',
                    no_kartu_anggota: initialData.nik, // Force sync with NIK

                    // files
                    foto: null,
                    foto_ktp: null,
                    foto_kartu_anggota: null,
                    foto_ijazah: null,
                    foto_sim: null
                });

                // Set previews for existing images
                const getUrl = (path: string) => path ? path : null;
                setFilePreview({
                    foto: getUrl(initialData.foto),
                    foto_ktp: getUrl(initialData.foto_ktp),
                    foto_kartu_anggota: getUrl(initialData.foto_kartu_anggota),
                    foto_ijazah: getUrl(initialData.foto_ijazah),
                    foto_sim: getUrl(initialData.foto_sim),
                });
            } else {
                // Default CREATE
                setFormData({
                    nik: '',
                    nama_karyawan: '',
                    no_ktp: '',
                    jenis_kelamin: 'L',
                    kode_cabang: '',
                    kode_dept: '',
                    kode_jabatan: '',
                    tanggal_masuk: new Date().toISOString().split('T')[0],
                    status_karyawan: 'C',
                    status_aktif_karyawan: '1',
                    password: '',
                    tempat_lahir: '',
                    tanggal_lahir: '',
                    alamat: '',
                    no_hp: '',
                    kontak_darurat_nama: '',
                    kontak_darurat_hp: '',
                    kontak_darurat_alamat: '',
                    kode_status_kawin: '1', // Default Single usually
                    pendidikan_terakhir: 'SMA',
                    no_ijazah: '',
                    no_sim: '',
                    no_kartu_anggota: '',
                    pin: '',

                    lock_location: '1',
                    lock_device_login: '0',
                    allow_multi_device: '0',
                    lock_jam_kerja: '1',
                    lock_patrol: '1',
                });
                setFilePreview({});
            }
        }
    }, [isOpen, initialData, mode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFiles((prev: any) => ({ ...prev, [field]: file }));
            setFilePreview((prev: any) => ({ ...prev, [field]: URL.createObjectURL(file) }));
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.nik || !formData.nama_karyawan || !formData.password && mode === 'create') {
            Swal.fire('Error', 'Mohon lengkapi data wajib (NIK, Nama, Password)', 'error');
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();

            // Append all text fields
            Object.keys(formData).forEach(key => {
                if (key.startsWith('foto')) return; // skip file keys in formData
                if (formData[key] !== null && formData[key] !== undefined) {
                    data.append(key, formData[key]);
                }
            });

            // Append files if they exist in state
            Object.keys(files).forEach(key => {
                if (files[key]) {
                    data.append(key, files[key]);
                }
            });

            if (mode === 'create') {
                await apiClient.post('/master/karyawan', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                Swal.fire('Sukses', 'Karyawan berhasil ditambahkan', 'success');
            } else {
                await apiClient.put(`/master/karyawan/${formData.nik}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                Swal.fire('Sukses', 'Data karyawan berhasil diperbarui', 'success');
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            Swal.fire('Error', error.response?.data?.detail || 'Terjadi kesalahan', 'error');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500";

    const tabs = [
        { id: 'pribadi', label: 'Data Pribadi', icon: User },
        { id: 'pekerjaan', label: 'Data Pekerjaan', icon: Briefcase },
        { id: 'kontak', label: 'Kontak & Darurat', icon: Contact },
        { id: 'file', label: 'File & Dokumen', icon: FileText },
        { id: 'setting', label: 'System & Setting', icon: Settings },
    ];

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {mode === 'create' ? 'Tambah Karyawan Baru' : 'Edit Data Karyawan'}
                </h3>
                <button
                    onClick={onClose}
                    className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Content Container with Sidebar Tabs */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Tabs */}
                <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 overflow-y-auto">
                    <div className="space-y-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                                        }`}
                                >
                                    <Icon className={`mr-3 h-5 w-5 ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
                    {/* 1. DATA PRIBADI */}
                    <div className={activeTab === 'pribadi' ? 'block' : 'hidden'}>
                        <SectionTitle title="Informasi Identitas" icon={User} />
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <InputGroup label="NIK (Nomor Induk Karyawan)" required>
                                <input
                                    type="text"
                                    name="nik"
                                    value={formData.nik || ''}
                                    onChange={(e) => {
                                        handleChange(e);
                                        // Auto-sync no_kartu_anggota with NIK
                                        if (mode === 'create') {
                                            setFormData((prev: any) => ({ ...prev, nik: e.target.value, no_kartu_anggota: e.target.value }));
                                        }
                                    }}
                                    disabled={mode === 'edit'}
                                    className={inputClass}
                                    placeholder="Contoh: 2024001"
                                />
                            </InputGroup>
                            <InputGroup label="Nama Lengkap" required>
                                <input type="text" name="nama_karyawan" value={formData.nama_karyawan || ''} onChange={handleChange} className={inputClass} />
                            </InputGroup>

                            <InputGroup label="Nomor KTP">
                                <input
                                    type="text"
                                    name="no_ktp"
                                    value={formData.no_ktp || ''}
                                    onChange={(e) => {
                                        handleChange(e);
                                        if (mode === 'create') {
                                            const val = e.target.value;
                                            setFormData((prev: any) => ({
                                                ...prev,
                                                nik: val,
                                                password: val,
                                                no_kartu_anggota: val
                                            }));
                                        }
                                    }}
                                    className={inputClass}
                                />
                            </InputGroup>

                            <InputGroup label="Jenis Kelamin">
                                <select name="jenis_kelamin" value={formData.jenis_kelamin || 'L'} onChange={handleChange} className={inputClass}>
                                    <option value="L">Laki-Laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                            </InputGroup>

                            <InputGroup label="Tempat Lahir">
                                <input type="text" name="tempat_lahir" value={formData.tempat_lahir || ''} onChange={handleChange} className={inputClass} />
                            </InputGroup>
                            <InputGroup label="Tanggal Lahir">
                                <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir || ''} onChange={handleChange} className={inputClass} />
                            </InputGroup>

                            <InputGroup label="Status Pernikahan">
                                <select name="kode_status_kawin" value={formData.kode_status_kawin || ''} onChange={handleChange} className={inputClass}>
                                    <option value="">Pilih Status</option>
                                    {(options?.status_kawin && options.status_kawin.length > 0) ? (
                                        options.status_kawin.map(ok => <option key={ok.code} value={ok.code}>{ok.name}</option>)
                                    ) : (
                                        // Fallback options
                                        <>
                                            <option value="1">Belum Kawin</option>
                                            <option value="2">Kawin</option>
                                            <option value="3">Cerai Hidup</option>
                                            <option value="4">Cerai Mati</option>
                                        </>
                                    )}
                                </select>
                            </InputGroup>

                            <InputGroup label="Pendidikan Terakhir">
                                <select name="pendidikan_terakhir" value={formData.pendidikan_terakhir || ''} onChange={handleChange} className={inputClass}>
                                    <option value="SD">SD</option>
                                    <option value="SMP">SMP</option>
                                    <option value="SMA">SMA/SMK</option>
                                    <option value="D1">D1</option>
                                    <option value="D2">D2</option>
                                    <option value="D3">D3</option>
                                    <option value="S1">S1</option>
                                    <option value="S2">S2</option>
                                    <option value="S3">S3</option>
                                </select>
                            </InputGroup>
                        </div>
                    </div>

                    {/* 2. DATA PEKERJAAN */}
                    <div className={activeTab === 'pekerjaan' ? 'block' : 'hidden'}>
                        <SectionTitle title="Detail Pekerjaan & Posisi" icon={Briefcase} />
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <InputGroup label="Cabang Penempatan" required>
                                <select name="kode_cabang" value={formData.kode_cabang || ''} onChange={handleChange} className={inputClass}>
                                    <option value="">Pilih Cabang</option>
                                    {(options.cabang && options.cabang.length > 0) ? (
                                        options.cabang.map(c => <option key={c.code} value={c.code}>{c.name}</option>)
                                    ) : (
                                        <>
                                            <option value="PST">Kantor Pusat</option>
                                            <option value="CBG">Cabang Utama</option>
                                        </>
                                    )}
                                </select>
                            </InputGroup>
                            <InputGroup label="Departemen" required>
                                <select name="kode_dept" value={formData.kode_dept || ''} onChange={handleChange} className={inputClass}>
                                    <option value="">Pilih Departemen</option>
                                    {(options.departemen && options.departemen.length > 0) ? (
                                        options.departemen.map(d => <option key={d.code} value={d.code}>{d.name}</option>)
                                    ) : (
                                        <>
                                            <option value="UK3">Unit K3L & Keamanan</option>
                                            <option value="UCS">Unit Cleaning Service</option>
                                            <option value="UDV">Unit Driver</option>
                                            <option value="HRD">Human Resource</option>
                                            <option value="FIN">Finance</option>
                                            <option value="IT">Information Technology</option>
                                        </>
                                    )}
                                </select>
                            </InputGroup>
                            <InputGroup label="Jabatan" required>
                                <select name="kode_jabatan" value={formData.kode_jabatan || ''} onChange={handleChange} className={inputClass}>
                                    <option value="">Pilih Jabatan</option>
                                    {(options.jabatan && options.jabatan.length > 0 ? options.jabatan : [
                                        { code: 'DNR', name: 'Danru (Komandan Regu)' },
                                        { code: 'KRD', name: 'Koordinator' },
                                        { code: 'STP', name: 'Satpam (Security)' },
                                        { code: 'CSV', name: 'Cleaning Service' },
                                        { code: 'DRV', name: 'Driver' },
                                        { code: 'MGR', name: 'Manager' },
                                        { code: 'STF', name: 'Staff' }
                                    ]).map(j => <option key={j.code} value={j.code}>{j.name}</option>)}
                                </select>
                            </InputGroup>

                            <InputGroup label="Status Karyawan">
                                <select name="status_karyawan" value={formData.status_karyawan || 'C'} onChange={handleChange} className={inputClass}>
                                    <option value="C">Kontrak (PKWT)</option>
                                    <option value="P">Tetap (PKWTT)</option>
                                    <option value="M">Magang</option>
                                    <option value="H">Harian</option>
                                </select>
                            </InputGroup>

                            <InputGroup label="Tanggal Masuk">
                                <input type="date" name="tanggal_masuk" value={formData.tanggal_masuk || ''} onChange={handleChange} className={inputClass} />
                            </InputGroup>

                            <InputGroup label="Status Aktif">
                                <select name="status_aktif_karyawan" value={formData.status_aktif_karyawan || '1'} onChange={handleChange} className={inputClass}>
                                    <option value="1">Aktif</option>
                                    <option value="0">Non-Aktif</option>
                                </select>
                            </InputGroup>

                            <InputGroup label="Nomor Kartu Anggota">
                                <input type="text" name="no_kartu_anggota" value={formData.no_kartu_anggota || ''} onChange={handleChange} className={inputClass} />
                            </InputGroup>
                        </div>
                    </div>

                    {/* 3. KONTAK */}
                    <div className={activeTab === 'kontak' ? 'block' : 'hidden'}>
                        <SectionTitle title="Alamat & Kontak" icon={Contact} />
                        <div className="grid grid-cols-1 gap-6">
                            <InputGroup label="Alamat Lengkap">
                                <textarea name="alamat" rows={3} value={formData.alamat || ''} onChange={handleChange} className={inputClass} />
                            </InputGroup>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup label="No. Handphone">
                                    <input type="text" name="no_hp" value={formData.no_hp || ''} onChange={handleChange} className={inputClass} />
                                </InputGroup>
                                <InputGroup label="PIN (Untuk Akses)">
                                    <input type="number" name="pin" value={formData.pin || ''} onChange={handleChange} className={inputClass} />
                                </InputGroup>
                            </div>
                        </div>

                        <div className="mt-8">
                            <SectionTitle title="Kontak Darurat" icon={Contact} />
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <InputGroup label="Nama Kontak Darurat">
                                    <input type="text" name="kontak_darurat_nama" value={formData.kontak_darurat_nama || ''} onChange={handleChange} className={inputClass} />
                                </InputGroup>
                                <InputGroup label="No. HP Kontak Darurat">
                                    <input type="text" name="kontak_darurat_hp" value={formData.kontak_darurat_hp || ''} onChange={handleChange} className={inputClass} />
                                </InputGroup>
                                <div className="md:col-span-2">
                                    <InputGroup label="Alamat Kontak Darurat">
                                        <textarea name="kontak_darurat_alamat" rows={2} value={formData.kontak_darurat_alamat || ''} onChange={handleChange} className={inputClass} />
                                    </InputGroup>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. FILES */}
                    <div className={activeTab === 'file' ? 'block' : 'hidden'}>
                        <SectionTitle title="Dokumen & Foto" icon={FileText} />

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Foto Profil */}
                            <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg dark:border-gray-600">
                                <div className="mb-4 h-32 w-32 relative overflow-hidden rounded-full bg-gray-100">
                                    {filePreview.foto ? (
                                        <Image src={filePreview.foto} alt="Preview" fill className="object-cover" unoptimized />
                                    ) : (
                                        <User className="h-full w-full p-6 text-gray-400" />
                                    )}
                                </div>
                                <label className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                                    <span>Upload Foto Profil</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'foto')} />
                                </label>
                                <p className="mt-2 text-xs text-gray-500">JPG, PNG max 2MB</p>
                            </div>

                            {/* Other Docs */}
                            {[
                                { id: 'foto_ktp', label: 'Foto KTP' },
                                { id: 'foto_kartu_anggota', label: 'Foto Kartu Anggota' },
                                { id: 'foto_ijazah', label: 'Foto Ijazah' },
                                { id: 'foto_sim', label: 'Foto SIM' },
                            ].map((doc) => (
                                <div key={doc.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                                    <h4 className="mb-3 text-sm font-medium">{doc.label}</h4>
                                    {filePreview[doc.id] && (
                                        <div className="mb-3 relative h-32 w-full rounded bg-gray-200">
                                            <Image src={filePreview[doc.id]} alt="Preview" fill className="object-cover rounded" unoptimized />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, doc.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 5. SYSTEM SETTINGS */}
                    <div className={activeTab === 'setting' ? 'block' : 'hidden'}>
                        <SectionTitle title="Pengaturan Sistem & Keamanan" icon={Settings} />

                        <div className="mb-6 rounded-lg bg-orange-50 p-4 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
                            <InputGroup label="Password Akun" required={mode === 'create'}>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password || ''}
                                        onChange={handleChange}
                                        className={`${inputClass} pl-10`}
                                        placeholder={mode === 'edit' ? 'Kosongkan jika tidak ingin mengubah password' : 'Masukkan password'}
                                    />
                                </div>
                                {mode === 'create' && <p className="mt-1 text-xs text-gray-500">Wajib diisi untuk akun baru</p>}
                            </InputGroup>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900 dark:text-white">Pengaturan Lokasi & Device</h4>

                                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                    <span className="text-sm">Lock Location (Wajib GPS Di Area)</span>
                                    <select name="lock_location" value={formData.lock_location} onChange={handleChange} className="rounded border bg-transparent p-1 text-sm">
                                        <option value="1">Ya (Locked)</option>
                                        <option value="0">Tidak</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                    <span className="text-sm">Lock Device Login (IMEI)</span>
                                    <select name="lock_device_login" value={formData.lock_device_login} onChange={handleChange} className="rounded border bg-transparent p-1 text-sm">
                                        <option value="1">Ya (Locked)</option>
                                        <option value="0">Tidak</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                    <span className="text-sm">Allow Multi Device</span>
                                    <select name="allow_multi_device" value={formData.allow_multi_device} onChange={handleChange} className="rounded border bg-transparent p-1 text-sm">
                                        <option value="1">Ya (Boleh)</option>
                                        <option value="0">Tidak</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900 dark:text-white">Pengaturan Tugas</h4>

                                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                    <span className="text-sm">Wajib Ikut Jam Kerja (Presensi)</span>
                                    <select name="lock_jam_kerja" value={formData.lock_jam_kerja} onChange={handleChange} className="rounded border bg-transparent p-1 text-sm">
                                        <option value="1">Ya</option>
                                        <option value="0">Tidak (Bebas)</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                                    <span className="text-sm">Wajib Patroli</span>
                                    <select name="lock_patrol" value={formData.lock_patrol} onChange={handleChange} className="rounded border bg-transparent p-1 text-sm">
                                        <option value="1">Ya (Aktif)</option>
                                        <option value="0">Tidak</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3 dark:border-gray-700 dark:bg-gray-800">
                <button
                    onClick={onClose}
                    className="rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                    Batal
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
        </Modal>
    );
}
