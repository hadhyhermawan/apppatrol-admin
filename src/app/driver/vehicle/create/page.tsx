'use client';

import MainLayout from '@/components/layout/MainLayout';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import VehicleForm from '../VehicleForm';

export default function CreateVehiclePage() {
    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Tambah Kendaraan" />

            <div className="mx-auto max-w-full">
                <VehicleForm mode="create" />
            </div>
        </MainLayout>
    );
}
