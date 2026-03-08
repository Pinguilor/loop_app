'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function ErrorMessage() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    useEffect(() => {
        if (error) {
            console.error('Login Auth Error:', error);
        }
    }, [error]);

    if (!error) return null;

    return (
        <div className="bg-red-50 text-red-800 p-4 border border-red-200 rounded-md text-sm text-center mb-6">
            {error}
        </div>
    );
}
