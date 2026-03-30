'use server';

import { createClient } from '@/lib/supabase/server';

const VIATICO_REGEX = /Viático de \$(\d+) asignado\. Comentario: (.*)/;

/** Elimina etiquetas HTML y decodifica entidades básicas para texto plano */
function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, ' ')          // elimina tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s{2,}/g, ' ')           // colapsa espacios múltiples
        .trim();
}

export interface TicketMaestroRow {
    'N° Ticket': string;
    'Título': string;
    'Estado': string;
    'Prioridad': string;
    'Cliente': string;
    'Restaurante': string;
    'Categoría': string;
    'Subcategoría': string;
    'Elemento': string;
    'Acción': string;
    'Creado Por': string;
    'Técnico Asignado': string;
    'Fecha Creación': string;
    'Fecha Resolución': string;
    'Materiales Usados': string;
    'Viáticos Total': string;
    'Detalle Viáticos': string;
    'Último Comentario': string;
}

export async function exportTicketsMaestroAction(): Promise<
    { data: TicketMaestroRow[] } | { error: string }
> {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'No estás autenticado.' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .maybeSingle();

    const rol = profile?.rol?.toLowerCase() ?? '';
    if (!['admin', 'coordinador'].includes(rol)) {
        return { error: 'Sin permisos para exportar el reporte maestro.' };
    }

    // ── 1. Tickets con todos los JOINs necesarios ──────────────────────────
    const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
            id,
            numero_ticket,
            titulo,
            estado,
            prioridad,
            fecha_creacion,
            fecha_resolucion,
            profiles:creado_por(full_name),
            agente:agente_asignado_id(full_name),
            restaurantes(nombre_restaurante),
            clientes(nombre_fantasia),
            tipo_servicio:ticket_tipos_servicio(nombre),
            categoria:ticket_categorias(nombre),
            subcategoria:ticket_subcategorias(nombre),
            accion:ticket_acciones(nombre),
            ticket_messages(
                id,
                mensaje,
                es_sistema,
                es_interno,
                creado_en
            )
        `)
        .order('fecha_creacion', { ascending: false });

    if (ticketsError || !tickets) {
        return { error: `Error obteniendo tickets: ${ticketsError?.message ?? 'Sin datos'}` };
    }

    // ── 2. Movimientos de inventario para todos los tickets ─────────────────
    const ticketIds = tickets.map(t => t.id);

    const { data: movimientos } = ticketIds.length > 0
        ? await supabase
            .from('movimientos_inventario')
            .select(`
                ticket_id,
                cantidad,
                tipo_movimiento,
                inventario(modelo)
            `)
            .in('ticket_id', ticketIds)
            .eq('tipo_movimiento', 'salida')
        : { data: [] };

    // Agrupar movimientos por ticket: { ticketId -> "2x KVS T655, 1x Cable Red" }
    const movimientosByTicket: Record<string, string[]> = {};
    for (const mov of movimientos ?? []) {
        if (!mov.ticket_id) continue;
        const modelo = (mov.inventario as any)?.modelo ?? 'Hardware s/n';
        if (!movimientosByTicket[mov.ticket_id]) {
            movimientosByTicket[mov.ticket_id] = [];
        }
        movimientosByTicket[mov.ticket_id].push(`${mov.cantidad}x ${modelo}`);
    }

    // ── 3. Mapear a filas planas ────────────────────────────────────────────
    const rows: TicketMaestroRow[] = tickets.map(ticket => {
        // Materiales
        const materialesArr = movimientosByTicket[ticket.id];
        const materiales = materialesArr?.length
            ? materialesArr.join(', ')
            : 'Sin materiales';

        // Viáticos: parsear desde ticket_messages con bandera es_sistema + es_interno
        const msgs = (ticket.ticket_messages as any[]) ?? [];
        const viaticoMsgs = msgs.filter(
            m => m.es_sistema && m.es_interno && VIATICO_REGEX.test(m.mensaje ?? '')
        );
        let totalViaticos = 0;
        const viaticoItems: string[] = [];
        for (const msg of viaticoMsgs) {
            const match = VIATICO_REGEX.exec(msg.mensaje ?? '');
            if (match) {
                const monto = parseInt(match[1], 10);
                totalViaticos += monto;
                const comentario = match[2]?.trim();
                viaticoItems.push(`$${monto.toLocaleString('es-CL')}${comentario ? ` (${comentario})` : ''}`);
            }
        }
        const viaticoTotal = totalViaticos > 0
            ? `$${totalViaticos.toLocaleString('es-CL')}`
            : '$0';
        const viaticoDetalle = viaticoItems.length > 0
            ? viaticoItems.join(' + ')
            : 'Sin viáticos';

        // Último comentario público (no sistema, no interno)
        const comentariosPublicos = msgs
            .filter(m => !m.es_sistema && !m.es_interno && m.mensaje)
            .sort(
                (a: any, b: any) =>
                    new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
            );
        const rawComentario = comentariosPublicos[0]?.mensaje ?? '';
        const ultimoComentario = rawComentario
            ? stripHtml(rawComentario).slice(0, 300) || 'Sin comentarios'
            : 'Sin comentarios';

        return {
            'N° Ticket': `NC-${ticket.numero_ticket}`,
            'Título': ticket.titulo ?? '—',
            'Estado': ticket.estado ?? '—',
            'Prioridad': ticket.prioridad ?? '—',
            'Cliente': (ticket.clientes as any)?.nombre_fantasia ?? '—',
            'Restaurante': (ticket.restaurantes as any)?.nombre_restaurante ?? '—',
            'Categoría': (ticket.tipo_servicio as any)?.nombre ?? '—',
            'Subcategoría': (ticket.categoria as any)?.nombre ?? '—',
            'Elemento': (ticket.subcategoria as any)?.nombre ?? '—',
            'Acción': (ticket.accion as any)?.nombre ?? '—',
            'Creado Por': (ticket.profiles as any)?.full_name ?? '—',
            'Técnico Asignado': (ticket.agente as any)?.full_name ?? 'Sin asignar',
            'Fecha Creación': ticket.fecha_creacion
                ? new Date(ticket.fecha_creacion).toLocaleDateString('es-CL')
                : '—',
            'Fecha Resolución': ticket.fecha_resolucion
                ? new Date(ticket.fecha_resolucion).toLocaleDateString('es-CL')
                : '—',
            'Materiales Usados': materiales,
            'Viáticos Total': viaticoTotal,
            'Detalle Viáticos': viaticoDetalle,
            'Último Comentario': ultimoComentario,
        };
    });

    return { data: rows };
}
