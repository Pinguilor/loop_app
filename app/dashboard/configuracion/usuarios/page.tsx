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

    // Solo personal interno de Systel: perfiles sin cliente_id asignado
    const [authResult, profilesResult] = await Promise.all([
        adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
        adminSupabase.from('profiles').select('id, full_name, rol').is('cliente_id', null),
    ]);

    const profileMap = new Map((profilesResult.data ?? []).map(p => [p.id, p]));

    const usuarios = (authResult.data?.users ?? [])
        .filter(authUser => profileMap.has(authUser.id))
        .map(authUser => {
            const p = profileMap.get(authUser.id)!;
            return {
                id:         authUser.id,
                email:      authUser.email ?? null,
                full_name:  p.full_name ?? (authUser.user_metadata?.full_name as string | null) ?? null,
                rol:        p.rol       ?? (authUser.user_metadata?.rol        as string | null) ?? null,
                created_at: authUser.created_at ?? null,
            };
        })
        .sort((a, b) =>
            new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        );

    return <GestionUsuariosClient usuarios={usuarios} />;
}
