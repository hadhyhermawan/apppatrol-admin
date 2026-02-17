'use client';

import dynamic from 'next/dynamic';
import MainLayout from '@/components/layout/MainLayout';
import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import React from 'react';
import { withPermission } from '@/hoc/withPermission';

// Import TrackingView dynamically to ensure Leaflet (window) is only accessed on client
const TrackingView = dynamic(
    () => import('@/components/security/tracking/TrackingView'),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[calc(100vh-120px)] w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-brand-500 border-t-transparent"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading Map...</p>
                </div>
            </div>
        )
    }
);

function TrackingPage() {
    return (
        <MainLayout>
            <PageBreadcrumb pageTitle="Employee Tracking" />
            <TrackingView />
        </MainLayout>
    );
}

// Protect page with permission
export default withPermission(TrackingPage, {
    permissions: ['tracking.index']
});
