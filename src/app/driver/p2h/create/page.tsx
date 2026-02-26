'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import P2HForm from '../P2HForm';
import apiClient from '@/lib/api';

export default function CreateP2HPage() {
    const [options, setOptions] = useState<any>({ drivers: [], vehicles: [] });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const response: any = await apiClient.get('/driver/p2h/options');
                if (response) {
                    setOptions({ drivers: response.drivers || [], vehicles: response.vehicles || [] });
                }
            } catch (error) {
                console.error("Failed to fetch P2H options", error);
            }
        };
        fetchOptions();
    }, []);

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Tambah Data P2H" />

            <div className="mx-auto max-w-full">
                <P2HForm mode="create" options={options} />
            </div>
        </MainLayout>
    );
}

