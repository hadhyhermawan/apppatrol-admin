'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import apiClient from '@/lib/api';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import FilterBar from '@/components/user-agreements/FilterBar';
import AgreementTable, { AgreementRow } from '@/components/user-agreements/AgreementTable';
import { ShieldCheck } from 'lucide-react';
import { withPermission } from '@/hoc/withPermission';

function UserAgreementsPage() {
    const [data, setData] = useState<AgreementRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<{ id: number; nama_dept: string }[]>([]);

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, selectedDepartment]);

    const fetchDepartments = async () => {
        try {
            const res = await apiClient.get('/api/master/departemen');
            setDepartments(res.data.data || res.data || []);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (selectedDepartment) params.append('department_id', selectedDepartment);

            const res = await apiClient.get(`/api/compliance/agreements?${params.toString()}`);
            setData(res.data);
        } catch (err) {
            console.error('Error fetching agreements data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (data.length === 0) return;

        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Nama User,Email/NIK,Departemen,Jabatan,Cabang,Terms Version,Privacy Version,Device Info,Tanggal Persetujuan\n';

        data.forEach(row => {
            const rowData = [
                `"${row.user_name}"`,
                `"${row.user_email}"`,
                `"${row.department}"`,
                `"${row.position}"`,
                `"${row.branch}"`,
                `"${row.terms_version}"`,
                `"${row.privacy_version}"`,
                `"${row.device_info}"`,
                `"${row.agreed_at ? new Date(row.agreed_at).toLocaleString() : '-'}"`
            ];
            csvContent += rowData.join(',') + '\n';
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `User_Agreements_Audit_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <MainLayout>
            <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
                {/* Header Section */}
                <div>
                    <PageBreadcrumb pageTitle="Persetujuan Pengguna" />
                    <div className="flex items-center gap-3 mt-4 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daftar Persetujuan (Audit & Compliance)</h1>
                            <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                                Laporan audit karyawan yang telah menyetujui kebijakan dan syarat ketentuan aplikasi Guard System.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <FilterBar
                    departments={departments}
                    onSearch={setSearchTerm}
                    onDepartmentChange={setSelectedDepartment}
                    onExportCSV={handleExportCSV}
                />

                {/* Table Section */}
                <AgreementTable data={data} loading={loading} />
            </div>
        </MainLayout>
    );
}

export default withPermission(UserAgreementsPage, { permissions: ['users.index'] });
