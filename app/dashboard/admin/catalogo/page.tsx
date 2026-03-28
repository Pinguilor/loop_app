import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CatalogoServiciosClient } from './CatalogoServiciosClient';

export const metadata = {
    title: 'Catálogo de Servicios — Systel Loop',
    description: 'Gestiona la clasificación jerárquica de tickets: Tipos, Categorías, Subcategorías y Acciones.',
};

export default async function CatalogoPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .maybeSingle();

    const rol = profile?.rol?.toUpperCase() ?? '';
    if (!['ADMIN', 'COORDINADOR'].includes(rol)) redirect('/dashboard');

    // ── Prefetch del Nivel 1 (Tipos de Servicio) ──────────────
    const { data: tiposServicio, error: e1 } = await supabase
        .from('ticket_tipos_servicio')
        .select('id, nombre, activo')
        .order('nombre', { ascending: true });

    if (e1) console.error('[CatalogoPage] Error tipos_servicio:', e1.message);

    return (
        <CatalogoServiciosClient
            tiposServicio={tiposServicio ?? []}
            isAdmin={rol === 'ADMIN'}
        />
    );
}
