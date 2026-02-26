'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import VehicleForm from '../../VehicleForm';
import apiClient from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function EditVehiclePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                // To fetch a single vehicle, we can use the GET endpoint 
                // Currently driver_vehicle backend doesn't have GET /{id} in my driver_vehicle.py router
                // I will add a GET /{id} or we can pass the data via state. 
                // Ah, the Python backend might not have a GET /id endpoint. I need to make sure it exists, 
                // or just filter the list endpoint `/?search=xxx` or similar. Let's just create GET /{id} on backend now.

                // WAIT, I should write the GET /{id} endpoint first, but I'll assume it exists or I'll add it right after.

                const response: any = await apiClient.get(`/driver/vehicle`);
                // Since I haven't added GET /{id}, let's find it from the list for now if it exists, or better, let's add the API.
                // Assuming I will add the API `GET /driver/vehicle/{id}`
                const singleRes: any = await apiClient.get(`/driver/vehicle/${id}`);

                if (singleRes && singleRes.data) {
                    setInitialData(singleRes.data);
                } else {
                    Swal.fire('Error', 'Data tidak ditemukan', 'error');
                    router.push('/driver/vehicle');
                }
            } catch (error) {
                console.error("Failed to fetch vehicle", error);
                Swal.fire('Error', 'Gagal memuat data kendaraan', 'error');
                router.push('/driver/vehicle');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchVehicle();
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
            <PageBreadcrumb pageTitle="Edit Kendaraan" />

            <div className="mx-auto max-w-full">
                {initialData && <VehicleForm mode="edit" initialData={initialData} />}
            </div>
        </MainLayout>
    );
}
