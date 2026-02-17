import { useState, useEffect } from 'react';
import { X, Save, Clock, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api';
import Swal from 'sweetalert2';

interface SetJamKerjaModalProps {
    nik: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

interface JamKerjaOption {
    kode_jam_kerja: string;
    nama_jam_kerja: string;
    jam_masuk: string;
    jam_pulang: string;
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function SetJamKerjaModal({ nik, onClose, onSuccess }: SetJamKerjaModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [options, setOptions] = useState<JamKerjaOption[]>([]);

    // State untuk mapping hari -> kode_jam_kerja
    const [schedule, setSchedule] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (nik) {
            loadData();
        }
    }, [nik]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Load Options
            const resOptions: any = await apiClient.get('/master/jam-kerja-options');
            setOptions(resOptions || []);

            // 2. Load Existing Schedule
            const resSchedule: any = await apiClient.get(`/master/karyawan/${nik}/jam-kerja`);

            const currentSchedule: { [key: string]: string } = {};
            // Initialize empty first
            DAYS.forEach(d => currentSchedule[d] = '');

            // Fill with API data
            if (resSchedule && resSchedule.by_day) {
                resSchedule.by_day.forEach((item: any) => {
                    currentSchedule[item.hari] = item.kode_jam_kerja;
                });
            }
            setSchedule(currentSchedule);

        } catch (error) {
            console.error("Failed load jam kerja", error);
            Swal.fire("Error", "Gagal memuat data jam kerja", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (hari: string, value: string) => {
        setSchedule(prev => ({
            ...prev,
            [hari]: value
        }));
    };

    const handleSave = async () => {
        if (!nik) return;
        setSaving(true);

        // Prepare payload
        const payload = {
            jam_by_day: DAYS.map(hari => ({
                hari: hari,
                kode_jam_kerja: schedule[hari] || null
            }))
        };

        try {
            await apiClient.post(`/master/karyawan/${nik}/jam-kerja`, payload);

            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: 'Jam kerja berhasil disimpan',
                timer: 1500,
                showConfirmButton: false
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            Swal.fire("Gagal", error.response?.data?.detail || "Gagal menyimpan data", "error");
        } finally {
            setSaving(false);
        }
    };

    if (!nik) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-boxdark animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between border-b pb-4 border-stroke dark:border-strokedark">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-black dark:text-white">Set Jam Kerja</h3>
                            <p className="text-sm text-gray-500">Atur jadwal kerja harian karyawan</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-meta-4">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    {loading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {DAYS.map((hari) => (
                                <div key={hari} className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-3">
                                        <label className="font-medium text-black dark:text-white">{hari}</label>
                                    </div>
                                    <div className="col-span-9">
                                        <select
                                            value={schedule[hari] || ''}
                                            onChange={(e) => handleChange(hari, e.target.value)}
                                            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 focus:ring-1 ring-primary/20"
                                        >
                                            <option value="">-- Pilih Jam Kerja --</option>
                                            {options.map((opt) => (
                                                <option key={opt.kode_jam_kerja} value={opt.kode_jam_kerja}>
                                                    {opt.nama_jam_kerja} ({opt.jam_masuk} - {opt.jam_pulang})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 flex justify-end gap-3 border-t pt-4 border-stroke dark:border-strokedark">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-meta-4"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90 disabled:opacity-70 shadow-lg shadow-primary/30 transition-all"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>
        </div>
    );
}
