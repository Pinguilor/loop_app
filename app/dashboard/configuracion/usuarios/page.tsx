import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { GestionUsuariosClient } from './GestionUsuariosClient';

export const metadata = {
    title: 'Gestión de Usuarios — Systel Loop',
    description: 'Administra el personal y sus roles en la plataforma Loop.',
};

export default async function UsuariosPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .maybeSingle();

    if (profile?.rol?.toUpperCase() !== 'ADMIN') redirect('/dashboard');

    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Leer auth.users + profiles (con cliente_id) + clientes activos en paralelo
    const [authResult, profilesResult, clientesResult] = await Promise.all([
        adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
        adminSupabase.from('profiles').select('id, full_name, rol, cliente_id'),
        adminSupabase.from('clientes').select('id, nombre_fantasia').eq('activo', true).order('nombre_fantasia'),
    ]);

    const profileMap = new Map((profilesResult.data ?? []).map(p => [p.id, p]));
    const clienteMap = new Map((clientesResult.data ?? []).map(c => [c.id, c.nombre_fantasia as string]));

    const usuarios = (authResult.data?.users ?? []).map(authUser => {
        const p = profileMap.get(authUser.id);
        return {
            id:         authUser.id,
            email:      authUser.email ?? null,
            full_name:  p?.full_name  ?? (authUser.user_metadata?.full_name as string | null) ?? null,
            rol:        p?.rol        ?? (authUser.user_metadata?.rol        as string | null) ?? null,
            cliente_id: (p?.cliente_id as string | null) ?? null,
            empresa:    p?.cliente_id ? (clienteMap.get(p.cliente_id as string) ?? null) : null,
            created_at: authUser.created_at ?? null,
        };
    }).sort((a, b) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    );

    const clientes = (clientesResult.data ?? []).map(c => ({
        id: c.id as string,
        nombre_fantasia: c.nombre_fantasia as string,
    }));

    return <GestionUsuariosClient usuarios={usuarios} clientes={clientes} />;
}
