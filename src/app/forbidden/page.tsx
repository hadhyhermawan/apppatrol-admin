'use client';

import Link from 'next/link';
import { ShieldX, Home, ArrowLeft, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ForbiddenPage() {
    const router = useRouter();

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
            <div className="w-full max-w-md text-center">
                {/* Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="rounded-full bg-red-500/10 p-6">
                        <ShieldX className="h-20 w-20 text-red-500" />
                    </div>
                </div>

                {/* Error Code */}
                <h1 className="mb-4 text-8xl font-bold text-white">403</h1>

                {/* Title */}
                <h2 className="mb-4 text-2xl font-semibold text-white">
                    Access Forbidden
                </h2>

                {/* Description */}
                <p className="mb-8 text-slate-400">
                    You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-600"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </button>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                    >
                        <Home className="h-4 w-4" />
                        Go to Dashboard
                    </Link>
                    <button
                        onClick={() => {
                            if (typeof window !== 'undefined') {
                                localStorage.removeItem('patrol_token');
                                localStorage.removeItem('patrol_user');
                                window.location.href = '/';
                            }
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/50 bg-transparent px-6 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>

                {/* Additional Info */}
                <div className="mt-12 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                    <p className="text-sm text-slate-400">
                        <span className="font-semibold text-white">Need access?</span>
                        <br />
                        Contact your system administrator to request the necessary permissions.
                    </p>
                </div>
            </div>
        </div>
    );
}
