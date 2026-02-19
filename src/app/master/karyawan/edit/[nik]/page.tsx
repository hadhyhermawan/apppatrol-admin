'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import KaryawanForm from '../../KaryawanForm';
import apiClient from '@/lib/api';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';

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

export default function EditKaryawanPage() {
    const params = useParams();
    const nik = params.nik;

    const [options, setOptions] = useState<MasterOptions>({ departemen: [], jabatan: [], cabang: [], status_kawin: [], jadwal: [] });
    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                // Fetch Options
                const optRes: any = await apiClient.get('/master/options');
                setOptions(optRes || { departemen: [], jabatan: [], cabang: [], status_kawin: [], jadwal: [] });

                // Fetch Karyawan Data
                // The main list endpoint supports search by NIK, so we can use that to find the specific employee
                // Alternatively, if we had a dedicated GET /karyawan/{nik}, we'd use that.
                // Based on previous files, we have a list endpoint. Let's see if we can filter by NIK.
                // The current backend implementation has GET /master/karyawan with search query.
                // Let's rely on search for now. Ideally backend should have GET /master/karyawan/{nik}

                const response = await apiClient.get(`/master/karyawan/${nik}`);
                console.log("[DEBUG] Fetch Karyawan Response:", response);

                // API mengembalikan { status: true, data: {...}, message: ... }
                // Karena apiClient interceptor sudah return response.data (body),
                // maka response variable berisi body tersebut.
                if (response && response.data) {
                    console.log("[DEBUG] Sc Setting Initial Data:", response.data);
                    setInitialData(response.data);
                } else {
                    console.error("[DEBUG] Data karyawan tidak ditemukan dalam response");
                    Swal.fire('Error', 'Data karyawan tidak ditemukan', 'error');
                }

            } catch (error) {
                console.error("[DEBUG] Failed to load data", error);
                Swal.fire('Error', 'Gagal memuat data', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (nik) {
            load();
        }
    }, [nik]);

    if (loading) return (
        <MainLayout>
            <div className="flex h-screen items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-brand-500 border-t-transparent"></div>
            </div>
        </MainLayout>
    );

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Edit Karyawan" />

            <div className="mx-auto max-w-full">
                <KaryawanForm mode="edit" options={options} initialData={initialData} />
            </div>
        </MainLayout>
    );
}
