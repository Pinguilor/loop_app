import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect, notFound } from 'next/navigation';
import { ClientHubClient } from './ClientHubClient';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();
    const { data } = await supabase
        .from('clientes')
        .select('nombre_fantasia')
        .eq('id', id)
        .maybeSingle();
    return {
        title: `${data?.nombre_fantasia ?? 'Cliente'} — Systel Loop`,
        description: `Panel de gestión del cliente ${data?.nombre_fantasia ?? ''}.`,
    };
}

export default async function ClientHubPage({ params }: Props) {
    const { id } = await params;

    // ── Auth guard ────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .maybeSingle();

    if (profile?.rol?.toUpperCase() !== 'ADMIN') redirect('/dashboard/configuracion/clientes');

    // ── Fetch cliente ─────────────────────────────────────────────
    const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .select('id, nombre_fantasia, razon_social, rut, logo_url, activo, creado_en')
        .eq('id', id)
        .maybeSingle();

    if (clienteError || !cliente) notFound();

    // ── Admin client para bypass RLS ──────────────────────────────
    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── Fetch paralelo: usuarios del cliente + tipos de servicio ──
    const [authResult, profilesResult, tiposResult] = await Promise.all([
        adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
        adminSupabase
            .from('profiles')
            .select('id, full_name, rol, cliente_id')
            .eq('cliente_id', id),
        supabase
            .from('ticket_tipos_servicio')
            .select('id, nombre, activo')
            .eq('cliente_id', id)
            .order('nombre'),
    ]);

    // Construir mapa auth → email
    const authMap = new Map(
        (authResult.data?.users ?? []).map(u => [u.id, { email: u.email ?? null, created_at: u.created_at ?? null }])
    );

    const usuariosCliente = (profilesResult.data ?? []).map(p => {
        const auth = authMap.get(p.id);
        return {
            id:         p.id,
            full_name:  p.full_name as string | null,
            email:      auth?.email ?? null,
            rol:        p.rol as string | null,
            cliente_id: id,
            empresa:    cliente.nombre_fantasia,
            created_at: auth?.created_at ?? null,
        };
    });

    const tiposServicio = (tiposResult.data ?? []).map(t => ({
        id:     t.id as string,
        nombre: t.nombre as string,
        activo: t.activo as boolean,
    }));

    return (
        <ClientHubClient
            cliente={cliente}
            usuariosCliente={usuariosCliente}
            tiposServicio={tiposServicio}
        />
    );
}
