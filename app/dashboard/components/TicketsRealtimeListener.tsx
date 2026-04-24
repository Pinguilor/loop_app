'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function TicketsRealtimeListener() {
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();

        const channel = supabase
            .channel('tickets-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'tickets' },
                () => router.refresh(),
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'tickets' },
                () => router.refresh(),
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router]);

    return null;
}
