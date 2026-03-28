import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GestionClientesClient } from './GestionClientesClient';

export const metadata = {
    title: 'Gestión de Clientes — Systel Loop',
    description: 'Administra las empresas cliente de Systel en la plataforma Loop.',
};

export default async function ClientesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .maybeSingle();

    if (profile?.rol?.toUpperCase() !== 'ADMIN') redirect('/dashboard/configuracion');

    // Fetch clientes con conteo de usuarios y tickets asociados
    const { data: clientes, error } = await supabase
        .from('clientes')
        .select(`
            id,
            nombre_fantasia,
            razon_social,
            rut,
            logo_url,
            activo,
            creado_en
        `)
        .order('nombre_fantasia', { ascending: true });

    if (error) console.error('[ClientesPage] Error:', error.message);

    return <GestionClientesClient clientes={clientes ?? []} />;
}
