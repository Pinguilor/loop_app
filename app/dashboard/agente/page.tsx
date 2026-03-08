import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminTicketList } from './components/AdminTicketList';
import AgentAnalytics from './components/AgentAnalytics';

export default async function AgenteDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get true role from database to avoid stale metadata
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

    if (profile?.role !== 'AGENTE') {
        redirect('/dashboard/solicitante');
    }

    // Fetch ALL tickets, joining with the `profiles` table to get full_name
    // We use profiles:creado_por to avoid ambiguity since tickets has multiple FKs to profiles
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*, profiles:creado_por(full_name), restaurantes(nombre_restaurante), catalogo_servicios(categoria, subcategoria, elemento)')
        .order('fecha_creacion', { ascending: false });

    if (error) {
        console.error("Error al cargar todos los tickets para agente:", error.message);
    }

    return (
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 space-y-8">
            {/* Agent Analytics Dashboard */}
            <AgentAnalytics tickets={tickets || []} />

            <div className="w-full">
                <AdminTicketList initialTickets={tickets || []} currentAgentId={user.id} />
            </div>
        </div>
    )
}
