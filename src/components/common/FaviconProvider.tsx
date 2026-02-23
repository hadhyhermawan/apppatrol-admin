'use client';

import { useEffect } from 'react';
import apiClient from '@/lib/api';

export default function FaviconProvider() {
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data: any = await apiClient.get('/settings/general');
                if (data && data.logo) {
                    const logoUrl = `${process.env.NEXT_PUBLIC_API_URL}/storage/logo/${data.logo}`;

                    // Find existing favicon or create a new one
                    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
                    if (!link) {
                        link = document.createElement('link');
                        link.rel = 'icon';
                        document.head.appendChild(link);
                    }
                    link.href = logoUrl;
                }
            } catch (error) {
                console.error('Failed to fetch general settings for favicon:', error);
            }
        };

        fetchSettings();
    }, []);

    return null;
}
