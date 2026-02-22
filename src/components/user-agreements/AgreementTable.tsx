'use client';

import { Activity, Calendar, Monitor, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export type AgreementRow = {
    id: number;
    user_name: string;
    user_email: string;
    department: string;
    branch: string;
    position: string;
    terms_version: string;
    privacy_version: string;
    device_info: string;
    agreed_at: string;
};

type AgreementTableProps = {
    data: AgreementRow[];
    loading: boolean;
};

export default function AgreementTable({ data, loading }: AgreementTableProps) {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 w-full">
                <Activity className="animate-spin h-8 w-8 text-blue-500" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 border border-dashed border-gray-300 rounded-xl bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
                <FileText className="h-12 w-12 mb-4 text-gray-400" />
                <p className="text-lg font-medium">Tidak Ada Data</p>
                <p className="text-sm">Belum ada riwayat persetujuan atau tidak sesuai filter.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
            <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 w-full">
                        <tr>
                            <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Pegawai</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Departemen</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Persetujuan</th>
                            <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Waktu & Perangkat</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 dark:bg-gray-800 dark:divide-gray-700 w-full">
                        {data.map((row) => (
                            <tr key={row.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors w-full">
                                {/* Profil Info */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white dark:ring-gray-800">
                                            {row.user_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{row.user_name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{row.user_email}</div>
                                        </div>
                                    </div>
                                </td>

                                {/* Role Info */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-white font-medium">{row.department}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mix-blend-multiply">{row.position} • {row.branch}</div>
                                </td>

                                {/* Compliance Info */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 w-max border border-emerald-200">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Terms: {row.terms_version}
                                        </div>
                                        <div className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 w-max border border-blue-200">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Privacy: {row.privacy_version}
                                        </div>
                                    </div>
                                </td>

                                {/* Audit Trail Info */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                            <span>
                                                {row.agreed_at
                                                    ? format(new Date(row.agreed_at), 'dd MMM yyyy, HH:mm')
                                                    : '-'}
                                            </span>
                                        </div>
                                        <div className="flex items-center group relative cursor-help">
                                            <Monitor className="w-4 h-4 mr-2 text-gray-400" />
                                            <span className="truncate max-w-[150px] font-mono text-xs bg-gray-100 px-1 rounded dark:bg-gray-700 text-gray-500">
                                                {row.device_info || 'Unknown Device'}
                                            </span>
                                            {/* Simple Tooltip on hover */}
                                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs p-2 rounded whitespace-nowrap z-10 shadow-lg">
                                                {row.device_info || 'Unknown Device'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
