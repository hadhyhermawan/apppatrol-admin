'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import P2HForm from '../../P2HForm';
import apiClient from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function EditP2HPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [options, setOptions] = useState<any>({ drivers: [], vehicles: [] });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [optRes, dataRes]: any = await Promise.all([
                    apiClient.get('/driver/p2h/options'),
                    apiClient.get(`/driver/p2h/${id}`)
                ]);

                if (optRes) {
                    setOptions({ drivers: optRes.drivers || [], vehicles: optRes.vehicles || [] });
                }

                if (dataRes && dataRes.status && dataRes.data) {
                    setInitialData(dataRes.data);
                } else {
                    Swal.fire('Error', 'Data P2H tidak ditemukan', 'error');
                    router.push('/driver/p2h');
                }
            } catch (error) {
                console.error("Failed to fetch", error);
                Swal.fire('Error', 'Gagal memuat data', 'error');
                router.push('/driver/p2h');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, router]);

    if (loading) {
        return (
            <MainLayout>
                <div className="flex h-[50vh] items-center justify-center">
                    <p className="text-gray-500">Memuat data...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Edit Data P2H" />

            <div className="mx-auto max-w-full">
                {initialData && <P2HForm mode="edit" initialData={initialData} options={options} />}
            </div>
        </MainLayout>
    );
}
