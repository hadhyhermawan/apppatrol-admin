'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import TaskForm from '../../TaskForm';
import apiClient from '@/lib/api';
import Swal from 'sweetalert2';

export default function EditDriverTaskPage() {
    const params = useParams();
    const router = useRouter();
    const [initialData, setInitialData] = useState<any>(null);
    const [options, setOptions] = useState({ drivers: [], p2h: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [optsRes, dataRes]: any = await Promise.all([
                    apiClient.get('/driver/tasks/options'),
                    apiClient.get(`/driver/tasks/${params.id}`)
                ]);
                setOptions(optsRes);
                if (dataRes.status) {
                    setInitialData(dataRes.data);
                }
            } catch (error) {
                console.error("Failed to fetch initial data", error);
                Swal.fire('Error', 'Gagal memuat data task', 'error').then(() => {
                    router.push('/driver/tasks');
                });
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchData();
        }
    }, [params.id, router]);

    if (loading) {
        return (
            <MainLayout>
                <div className="flex justify-center p-12">Memuat data...</div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle={`Edit Job Order / Task #${params.id}`} />
            <div className="mx-auto max-w-full">
                <TaskForm mode="edit" initialData={initialData} options={options} />
            </div>
        </MainLayout>
    );
}

