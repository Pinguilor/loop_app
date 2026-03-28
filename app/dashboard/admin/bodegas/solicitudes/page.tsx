import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GestionSolicitudesClient } from './GestionSolicitudesClient';
import { getSolicitudesMaterialesAction, getBodegasCentralesAction } from './actions';

export const metadata = {
    title: 'Solicitudes de Materiales — Systel Loop',
    description: 'Gestión de solicitudes de materiales enviadas por técnicos a bodega.',
};

export default async function SolicitudesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .maybeSingle();

    const rol = profile?.rol?.toUpperCase() || '';

    // Solo admin_bodega, admin y coordinador pueden acceder
    if (!['ADMIN_BODEGA', 'ADMIN', 'COORDINADOR'].includes(rol)) {
        redirect('/dashboard');
    }

    // Fetch en paralelo
    const [solicitudesResult, bodegasResult] = await Promise.all([
        getSolicitudesMaterialesAction(),
        getBodegasCentralesAction(),
    ]);

    return (
        <GestionSolicitudesClient
            solicitudes={solicitudesResult.data ?? []}
            bodegasCentrales={bodegasResult.data ?? []}
        />
    );
}
