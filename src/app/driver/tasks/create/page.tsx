'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import TaskForm from '../TaskForm';
import apiClient from '@/lib/api';

export default function CreateDriverTaskPage() {
    const [options, setOptions] = useState({ drivers: [], p2h: [] });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res: any = await apiClient.get('/driver/tasks/options');
                setOptions(res);
            } catch (error) {
                console.error("Failed to fetch options", error);
            }
        };
        fetchOptions();
    }, []);

    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Tambah Penugasan Driver Baru" />
            <div className="mx-auto max-w-full">
                <TaskForm mode="create" options={options} />
            </div>
        </MainLayout>
    );
}

