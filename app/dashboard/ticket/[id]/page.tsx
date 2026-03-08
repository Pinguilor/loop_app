import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TicketTimeline from './components/TicketTimeline';
import TicketSidebar from './components/TicketSidebar';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();

    // Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect('/login');
    }

    // Unwrap params in Next.js 15+ 
    const unwrappedParams = await params;
    const ticketId = unwrappedParams.id;

    // Get User Role to handle permissions
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const isAgent = profile?.role === 'AGENTE';

    // Fetch the Ticket
    // We get the ticket itself, the requester's profile, and all messages with their respective sender profiles
    const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
            *,
            profiles:creado_por (full_name),
            agente:agente_asignado_id (full_name),
            restaurantes (*),
            catalogo_servicios (*),
            ticket_messages (
                id,
                mensaje,
                creado_en,
                sender_id,
                adjuntos,
                es_sistema,
                profiles:sender_id (full_name, role)
            )
        `)
        .eq('id', ticketId)
        .maybeSingle();

    if (ticketError) {
        console.error('--------------------------------');
        console.error('ERROR AL OBTENER TICKET:', ticketError);
        console.error('--------------------------------');
    }

    if (ticketError || !ticket) {
        // If ticket doesn't exist or RLS hides it
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 text-center bg-white p-10 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Ticket no encontrado</h2>
                    <p className="mt-2 text-sm text-gray-600">El ticket que buscas no existe o no tienes permiso para verlo.</p>
                    <Link href={isAgent ? '/dashboard/agente' : '/dashboard/solicitante'} className="mt-4 font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    // Strict Security Check for Solicitante
    if (!isAgent && ticket.creado_por !== user.id) {
        // A requester is trying to view a ticket they didn't create
        redirect('/dashboard/solicitante');
    }

    // Sort messages chronologically (Supabase returns them usually unordered or by id if not specified)
    const sortedMessages = (ticket.ticket_messages || []).sort((a: any, b: any) =>
        new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime()
    );

    return (
        <div className="py-6 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Main Two-Column Layout */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

                    {/* Left Column: Timeline & Chat */}
                    <div className="flex-1 min-w-0">
                        <TicketTimeline
                            ticket={ticket}
                            messages={sortedMessages}
                            currentUserId={user.id}
                            isAgent={isAgent}
                        />
                    </div>

                    {/* Right Column: Properties Sidebar */}
                    <div className="w-full lg:w-80 shrink-0">
                        <TicketSidebar
                            ticket={ticket}
                            isAgent={isAgent}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
}
