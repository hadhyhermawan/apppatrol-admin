'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import KaryawanForm from '../KaryawanForm';
import apiClient from '@/lib/api';

interface OptionItem {
    code: string;
    name: string;
}

interface MasterOptions {
    departemen: OptionItem[];
    jabatan: OptionItem[];
    cabang: OptionItem[];
    status_kawin?: OptionItem[];
    jadwal?: OptionItem[];
}

export default function CreateKaryawanPage() {
    const [options, setOptions] = useState<MasterOptions>({ departemen: [], jabatan: [], cabang: [], status_kawin: [], jadwal: [] });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const response: any = await apiClient.get('/master/options');
                setOptions(response || { departemen: [], jabatan: [], cabang: [], status_kawin: [], jadwal: [] });
            } catch (error) {
                console.error("Failed to fetch options", error);
            }
        };
        fetchOptions();
    }, []);

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Tambah Karyawan" />

            <div className="mx-auto max-w-full">
                <KaryawanForm mode="create" options={options} />
            </div>
        </MainLayout>
    );
}
