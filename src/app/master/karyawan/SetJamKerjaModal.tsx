import { useState, useEffect, useMemo } from 'react';
import { X, Save, Watch, Loader2, Calendar, Plus, Trash, Trash2 } from 'lucide-react';
import apiClient from '@/lib/api';
import Swal from 'sweetalert2';
import clsx from 'clsx';
import SearchableSelect from '@/components/ui/SearchableSelect';
import DatePicker from '@/components/form/date-picker';

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

interface DailySchedule {
    nik: string;
    tanggal: string;
    kode_jam_kerja: string;
    nama_jam_kerja: string;
    jam_masuk: string;
    jam_pulang: string;
}

interface ExtraSchedule extends DailySchedule {
    jenis: string;
    keterangan: string | null;
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function SetJamKerjaModal({ nik, onClose, onSuccess }: SetJamKerjaModalProps) {
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<JamKerjaOption[]>([]);

    // Tabs: 'weekly' | 'daily'
    const [activeTab, setActiveTab] = useState<'weekly' | 'daily'>('weekly');

    // -- WEEKLY STATES --
    const [weeklySchedule, setWeeklySchedule] = useState<{ [key: string]: string }>({});
    const [savingWeekly, setSavingWeekly] = useState(false);

    // -- DAILY STATES --
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [dailySchedules, setDailySchedules] = useState<DailySchedule[]>([]);
    const [extraSchedules, setExtraSchedules] = useState<ExtraSchedule[]>([]);

    // Form Daily
    const [formDate, setFormDate] = useState('');
    const [formShift, setFormShift] = useState('');

    // Form Extra
    const [formExtraDate, setFormExtraDate] = useState('');
    const [formExtraShift, setFormExtraShift] = useState('');
    const [formExtraType, setFormExtraType] = useState('double_shift');
    const [formExtraDesc, setFormExtraDesc] = useState('');

    const jamKerjaOptions = useMemo(() => {
        return options.map(opt => ({
            value: opt.kode_jam_kerja,
            label: opt.nama_jam_kerja,
            description: `${opt.jam_masuk?.substring(0, 5)} - ${opt.jam_pulang?.substring(0, 5)}`
        }));
    }, [options]);

    useEffect(() => {
        if (nik) {
            loadInitialData();
        }
    }, [nik]);

    useEffect(() => {
        if (activeTab === 'daily' && nik) {
            loadDailyData();
        }
    }, [activeTab, selectedMonth, selectedYear, nik]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            // Options
            const resOptions: any = await apiClient.get('/master/jam-kerja-options');
            setOptions(resOptions || []);

            // Weekly Schedule
            const resSchedule: any = await apiClient.get(`/master/karyawan/${nik}/jam-kerja`);
            const currentSchedule: { [key: string]: string } = {};
            DAYS.forEach(d => currentSchedule[d] = '');
            if (resSchedule && resSchedule.by_day) {
                resSchedule.by_day.forEach((item: any) => {
                    currentSchedule[item.hari] = item.kode_jam_kerja;
                });
            }
            setWeeklySchedule(currentSchedule);
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Gagal memuat data", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadDailyData = async () => {
        try {
            // Regular Daily
            const resDaily: any = await apiClient.get(`/master/karyawan/${nik}/jam-kerja-date`, {
                params: { bulan: selectedMonth, tahun: selectedYear }
            });
            setDailySchedules(resDaily || []);

            // Extra
            const resExtra: any = await apiClient.get(`/master/karyawan/${nik}/jam-kerja-extra`, {
                params: { bulan: selectedMonth, tahun: selectedYear }
            });
            setExtraSchedules(resExtra || []);
        } catch (error) {
            console.error(error);
        }
    };

    // --- WEEKLY HANDLERS ---
    const handleWeeklyChange = (hari: string, value: string) => {
        setWeeklySchedule(prev => ({ ...prev, [hari]: value }));
    };

    const saveWeekly = async () => {
        if (!nik) return;
        setSavingWeekly(true);
        try {
            const payload = {
                jam_by_day: DAYS.map(hari => ({
                    hari: hari,
                    kode_jam_kerja: weeklySchedule[hari] || null
                }))
            };
            await apiClient.post(`/master/karyawan/${nik}/jam-kerja`, payload);
            Swal.fire('Berhasil', 'Jadwal mingguan berhasil disimpan', 'success');
            onSuccess();
        } catch (error: any) {
            console.error(error);
            Swal.fire("Gagal", error.response?.data?.detail || "Gagal menyimpan", "error");
        } finally {
            setSavingWeekly(false);
        }
    };

    // --- DAILY HANDLERS ---
    const addDailySchedule = async () => {
        if (!formDate || !formShift) {
            return Swal.fire('Error', 'Tanggal dan Shift harus diisi', 'warning');
        }
        try {
            await apiClient.post(`/master/karyawan/${nik}/jam-kerja-date`, {
                tanggal: formDate,
                kode_jam_kerja: formShift
            });
            Swal.fire({ icon: 'success', title: 'Berhasil', showConfirmButton: false, timer: 1000 });
            setFormDate('');
            setFormShift('');
            loadDailyData();
        } catch (error: any) {
            console.error(error);
            Swal.fire("Gagal", error.response?.data?.detail || "Gagal menyimpan jadwal harian", "error");
        }
    };

    const deleteDailySchedule = async (tanggal: string) => {
        const result = await Swal.fire({
            title: 'Hapus Jadwal?',
            text: `Hapus jadwal tanggal ${tanggal}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        });
        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/master/karyawan/${nik}/jam-kerja-date`, {
                params: { tanggal }
            });
            loadDailyData();
            Swal.fire({ icon: 'success', title: 'Terhapus', showConfirmButton: false, timer: 1000 });
        } catch (error: any) {
            console.error(error);
            Swal.fire("Gagal", "Gagal menghapus data", "error");
        }
    };

    // --- EXTRA HANDLERS ---
    const addExtraSchedule = async () => {
        if (!formExtraDate || !formExtraShift) {
            return Swal.fire('Error', 'Tanggal dan Shift harus diisi', 'warning');
        }
        try {
            await apiClient.post(`/master/karyawan/${nik}/jam-kerja-extra`, {
                tanggal: formExtraDate,
                kode_jam_kerja: formExtraShift,
                jenis: formExtraType,
                keterangan: formExtraDesc
            });
            Swal.fire({ icon: 'success', title: 'Berhasil', showConfirmButton: false, timer: 1000 });
            setFormExtraDate('');
            setFormExtraShift('');
            setFormExtraDesc('');
            loadDailyData();
        } catch (error: any) {
            console.error(error);
            Swal.fire("Gagal", error.response?.data?.detail || "Gagal menyimpan jadwal tambahan", "error");
        }
    };

    const deleteExtraSchedule = async (tanggal: string) => {
        const result = await Swal.fire({
            title: 'Hapus Jadwal Tambahan?',
            text: `Hapus jadwal tambahan tanggal ${tanggal}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        });
        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/master/karyawan/${nik}/jam-kerja-extra`, {
                params: { tanggal }
            });
            loadDailyData();
            Swal.fire({ icon: 'success', title: 'Terhapus', showConfirmButton: false, timer: 1000 });
        } catch (error: any) {
            console.error(error);
            Swal.fire("Gagal", "Gagal menghapus data", "error");
        }
    };

    if (!nik) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-boxdark animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between border-b pb-4 border-stroke dark:border-strokedark">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                            <Watch className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-black dark:text-white">Set Jam Kerja</h3>
                            <p className="text-sm text-gray-500">Pengaturan shift dan jadwal karyawan</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-meta-4">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex space-x-4 border-b border-stroke dark:border-strokedark">
                    <button
                        onClick={() => setActiveTab('weekly')}
                        className={clsx(
                            "pb-2 px-4 font-medium text-sm transition-colors border-b-2",
                            activeTab === 'weekly'
                                ? "border-brand-500 text-brand-500"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        )}
                    >
                        Pola Mingguan (Set Jam Kerja)
                    </button>
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={clsx(
                            "pb-2 px-4 font-medium text-sm transition-colors border-b-2",
                            activeTab === 'daily'
                                ? "border-brand-500 text-brand-500"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        )}
                    >
                        Jadwal Harian (By Date)
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    {loading && activeTab === 'weekly' ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                        </div>
                    ) : activeTab === 'weekly' ? (
                        // WEEKLY CONTENT
                        <div className="space-y-4">
                            <div className="flex justify-end mb-2">
                                <button
                                    onClick={() => {
                                        const mondayVal = weeklySchedule['Senin'];
                                        if (mondayVal) {
                                            const newSchedule = { ...weeklySchedule };
                                            DAYS.forEach(d => newSchedule[d] = mondayVal);
                                            setWeeklySchedule(newSchedule);
                                            Swal.fire({
                                                icon: 'info',
                                                title: 'Disalin!',
                                                text: 'Jadwal Senin disalin ke semua hari',
                                                timer: 1000,
                                                showConfirmButton: false,
                                                toast: true,
                                                position: 'top-end'
                                            });
                                        } else {
                                            Swal.fire('Info', 'Pilih jadwal Senin terlebih dahulu', 'info');
                                        }
                                    }}
                                    className="text-xs font-medium text-brand-500 hover:text-brand-600 underline"
                                >
                                    Salin Senin ke Semua Hari
                                </button>
                            </div>

                            <div className="grid grid-cols-12 gap-4 pb-2 border-b border-stroke dark:border-strokedark font-medium text-sm text-gray-500">
                                <div className="col-span-3">Hari</div>
                                <div className="col-span-9">Shift Kerja</div>
                            </div>

                            {DAYS.map((hari) => (
                                <div key={hari} className="grid grid-cols-12 gap-4 items-center py-2 border-b border-stroke/50 dark:border-strokedark/50 hover:bg-gray-50 dark:hover:bg-meta-4/30 rounded px-2">
                                    <div className="col-span-3"><label className="font-medium text-black dark:text-white">{hari}</label></div>
                                    <div className="col-span-9">
                                        <SearchableSelect
                                            options={jamKerjaOptions}
                                            value={weeklySchedule[hari] || ''}
                                            onChange={(val) => handleWeeklyChange(hari, val)}
                                            placeholder="-- Libur / Tidak Set --"
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={saveWeekly}
                                    disabled={savingWeekly}
                                    className="flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2 font-medium text-white hover:bg-opacity-90 disabled:opacity-70 shadow-lg shadow-brand-500/30"
                                >
                                    {savingWeekly ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </div>
                    ) : (
                        // DAILY CONTENT
                        <div className="space-y-6">
                            {/* Filter Bulan Tahun */}
                            <div className="flex gap-4">
                                <SearchableSelect
                                    options={Array.from({ length: 12 }, (_, i) => ({
                                        value: String(i + 1),
                                        label: new Date(0, i).toLocaleString('id-ID', { month: 'long' })
                                    }))}
                                    value={String(selectedMonth)}
                                    onChange={(val) => setSelectedMonth(parseInt(val))}
                                    placeholder="Pilih Bulan"
                                    className="w-1/2"
                                />
                                <SearchableSelect
                                    options={Array.from({ length: 5 }, (_, i) => {
                                        const y = new Date().getFullYear() - 1 + i;
                                        return { value: String(y), label: String(y) };
                                    })}
                                    value={String(selectedYear)}
                                    onChange={(val) => setSelectedYear(parseInt(val))}
                                    placeholder="Pilih Tahun"
                                    className="w-1/2"
                                />
                            </div>

                            <hr className="border-stroke dark:border-strokedark" />

                            {/* Form Add Daily */}
                            <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 dark:bg-meta-4/20 p-4 rounded-lg">
                                <div className="w-full md:w-1/3">
                                    <label className="mb-1 block text-sm font-medium">Tanggal</label>
                                    <DatePicker
                                        id="daily-date"
                                        onChange={(dates: Date[], dateStr: string) => setFormDate(dateStr)}
                                        defaultDate={formDate}
                                        allowInput={true}
                                        staticDisplay={false}
                                    />
                                </div>
                                <div className="w-full md:w-1/2">
                                    <label className="mb-1 block text-sm font-medium">Jam Kerja</label>
                                    <SearchableSelect
                                        options={jamKerjaOptions}
                                        value={formShift}
                                        onChange={setFormShift}
                                        placeholder="Pilih Shift..."
                                    />
                                </div>
                                <div className="w-full md:w-auto">
                                    <button
                                        onClick={addDailySchedule}
                                        className="flex w-full items-center justify-center gap-2 rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                                    >
                                        <Plus className="h-4 w-4" /> Add
                                    </button>
                                </div>
                            </div>

                            {/* Table Daily */}
                            <table className="w-full table-auto border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-meta-4 text-left">
                                        <th className="px-4 py-2 text-sm font-medium rounded-l-lg">Tanggal</th>
                                        <th className="px-4 py-2 text-sm font-medium">Jam Kerja</th>
                                        <th className="px-4 py-2 text-sm font-medium rounded-r-lg text-center">#</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailySchedules.length === 0 ? (
                                        <tr><td colSpan={3} className="text-center py-4 text-sm text-gray-500">Belum ada jadwal harian di bulan ini</td></tr>
                                    ) : (
                                        dailySchedules.map((item, idx) => (
                                            <tr key={idx} className="bg-white dark:bg-boxdark hover:bg-gray-50 dark:hover:bg-strokedark">
                                                <td className="px-4 py-2 text-sm border-y border-l border-stroke dark:border-strokedark rounded-l-lg">{item.tanggal}</td>
                                                <td className="px-4 py-2 text-sm border-y border-stroke dark:border-strokedark">
                                                    {item.nama_jam_kerja} ({item.jam_masuk?.substring(0, 5)} - {item.jam_pulang?.substring(0, 5)})
                                                </td>
                                                <td className="px-4 py-2 text-center border-y border-r border-stroke dark:border-strokedark rounded-r-lg">
                                                    <button onClick={() => deleteDailySchedule(item.tanggal)} className="text-red-500 hover:text-red-700">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            <hr className="border-stroke dark:border-strokedark mt-6" />
                            <h4 className="font-semibold text-black dark:text-white">Jam Kerja Tambahan (Max 1 per tanggal)</h4>

                            {/* Form Extra */}
                            <div className="flex flex-col md:flex-row flex-wrap gap-4 items-end bg-gray-50 dark:bg-meta-4/20 p-4 rounded-lg">
                                <div className="w-full md:w-1/4">
                                    <label className="mb-1 block text-sm font-medium">Tanggal</label>
                                    <DatePicker
                                        id="extra-date"
                                        onChange={(dates: Date[], dateStr: string) => setFormExtraDate(dateStr)}
                                        defaultDate={formExtraDate}
                                        allowInput={true}
                                        staticDisplay={false}
                                    />
                                </div>
                                <div className="w-full md:w-1/3">
                                    <label className="mb-1 block text-sm font-medium">Shift</label>
                                    <SearchableSelect
                                        options={jamKerjaOptions}
                                        value={formExtraShift}
                                        onChange={setFormExtraShift}
                                        placeholder="Pilih Shift..."
                                    />
                                </div>
                                <div className="w-full md:w-1/4">
                                    <label className="mb-1 block text-sm font-medium">Jenis</label>
                                    <SearchableSelect
                                        options={[
                                            { value: 'double_shift', label: 'Jadwal 2x' },
                                            { value: 'lembur', label: 'Lembur' }
                                        ]}
                                        value={formExtraType}
                                        onChange={setFormExtraType}
                                        placeholder="Pilih Jenis"
                                    />
                                </div>
                                <div className="w-full">
                                    <input
                                        type="text"
                                        placeholder="Keterangan (opsional)"
                                        value={formExtraDesc}
                                        onChange={(e) => setFormExtraDesc(e.target.value)}
                                        className="w-full rounded border border-stroke bg-white px-3 py-2 text-sm outline-none dark:border-strokedark dark:bg-meta-4"
                                    />
                                </div>
                                <div className="w-full">
                                    <button
                                        onClick={addExtraSchedule}
                                        className="flex w-full items-center justify-center gap-2 rounded bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                                    >
                                        <Plus className="h-4 w-4" /> Add Extra
                                    </button>
                                </div>
                            </div>

                            {/* Table Extra */}
                            <table className="w-full table-auto border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-meta-4 text-left">
                                        <th className="px-4 py-2 text-sm font-medium rounded-l-lg">Tanggal</th>
                                        <th className="px-4 py-2 text-sm font-medium">Jam Kerja</th>
                                        <th className="px-4 py-2 text-sm font-medium">Jenis</th>
                                        <th className="px-4 py-2 text-sm font-medium rounded-r-lg text-center">#</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {extraSchedules.length === 0 ? (
                                        <tr><td colSpan={4} className="text-center py-4 text-sm text-gray-500">Belum ada jadwal tambahan</td></tr>
                                    ) : (
                                        extraSchedules.map((item, idx) => (
                                            <tr key={idx} className="bg-white dark:bg-boxdark hover:bg-gray-50 dark:hover:bg-strokedark">
                                                <td className="px-4 py-2 text-sm border-y border-l border-stroke dark:border-strokedark rounded-l-lg">{item.tanggal}</td>
                                                <td className="px-4 py-2 text-sm border-y border-stroke dark:border-strokedark">
                                                    {item.nama_jam_kerja} ({item.jam_masuk?.substring(0, 5)} - {item.jam_pulang?.substring(0, 5)})
                                                    <div className="text-xs text-gray-500">{item.keterangan || '-'}</div>
                                                </td>
                                                <td className="px-4 py-2 text-sm border-y border-stroke dark:border-strokedark">
                                                    <span className={clsx("px-2 py-0.5 rounded text-xs", item.jenis === 'lembur' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700')}>
                                                        {item.jenis === 'lembur' ? 'Lembur' : 'Jadwal 2x'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-center border-y border-r border-stroke dark:border-strokedark rounded-r-lg">
                                                    <button onClick={() => deleteExtraSchedule(item.tanggal)} className="text-red-500 hover:text-red-700">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
