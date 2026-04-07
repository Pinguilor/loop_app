import TicketList from './components/TicketList';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardKPIs } from './components/DashboardAnalytics';
import Link from 'next/link';

// We need an intermediate client component to handle the Modal state for the New Ticket Form
import TicketDashboardLayout from './components/TicketDashboardLayout';

export default async function usuarioDashboard() {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login');
    }

    // Role verification against the database to prevent cross-dashboard access
    const { data: profile } = await supabase.from('profiles').select('rol, full_name').eq('id', user.id).maybeSingle();

    if (profile?.rol?.toUpperCase() === 'tecnico') {
        redirect('/dashboard/tecnico');
    }

    // Fetch all tickets for the analtyics
    const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('creado_por', user.id)
        .order('fecha_creacion', { ascending: false });

    const firstName = profile?.full_name?.split(' ')[0] ?? 'Usuario';

    return (
        <TicketDashboardLayout
            greeting={
                <div className="px-4 sm:px-0">
                    <p className="text-sm font-semibold text-slate-400 tracking-wide uppercase">Panel de Control</p>
                    <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                        Hola, {firstName} 👋
                    </h1>
                </div>
            }
            kpis={<DashboardKPIs tickets={tickets || []} />}
            dataTable={<TicketList />}
        />
    );
}
