'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { TicketStatus } from '@/types/database.types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const BUCKET_NAME = 'ticket-attachments';

export async function addTicketMessageAction(formData: FormData) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { error: 'No estás autenticado.' };
    }

    const ticketId = formData.get('ticketId') as string;
    const message = formData.get('message') as string;
    const resolveTicket = formData.get('resolveTicket') === 'true';
    const rawMessyText = message.replace(/(<([^>]+)>)/gi, "").trim();
    const adjuntos = formData.getAll('adjuntos') as File[];

    if (!ticketId || (!rawMessyText && adjuntos.length === 0)) {
        return { error: 'El mensaje no puede estar vacío si no hay adjuntos.' };
    }

    if (adjuntos.length > 5) {
        return { error: 'Puedes subir un máximo de 5 adjuntos por mensaje.' };
    }

    const fileUrls: string[] = [];

    // Process and upload files
    for (const file of adjuntos) {
        if (file.size > MAX_FILE_SIZE) {
            return { error: `El archivo ${file.name} supera el límite de 5MB.` };
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return { error: `El archivo ${file.name} tiene un tipo no permitido.` };
        }

        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const timestamp = Date.now();
        const filePath = `${ticketId}/${timestamp}_${sanitizedFileName}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file);

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return { error: `Error subiendo ${file.name}: ${uploadError.message}` };
        }

        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        fileUrls.push(publicUrl);
    }

    const { error } = await supabase
        .from('ticket_messages')
        .insert({
            ticket_id: ticketId,
            sender_id: user.id,
            mensaje: message,
            adjuntos: fileUrls.length > 0 ? fileUrls : null,
        });

    if (error) {
        console.error('Error adding message:', error);
        return { error: 'Error interno al enviar el mensaje.' };
    }

    if (resolveTicket) {
        const { error: updateError } = await supabase
            .from('tickets')
            .update({ estado: 'resuelto', fecha_resolucion: new Date().toISOString() })
            .eq('id', ticketId)
            .select() // Ensures execution completion
            .single();

        if (updateError) {
            console.error('Error auto-resolving ticket:', updateError);
            return { error: `Mensaje enviado, pero falló la reasignación de estado a Resuelto: ${updateError.message}` };
        }
    }

    // --- NOTIFICATION LOGIC ---
    // Fetch the ticket to see who created it
    const { data: ticket } = await supabase
        .from('tickets')
        .select('creado_por, numero_ticket')
        .eq('id', ticketId)
        .single();

    if (ticket && ticket.creado_por !== user.id) {
        // If the sender is not the creator, they are an agent answering the requester.
        // Insert a notification for the requester.
        await supabase.from('notifications').insert({
            user_id: ticket.creado_por,
            ticket_id: ticketId,
            mensaje: `El agente ha respondido a tu solicitud NC-${ticket.numero_ticket}`,
            leida: false
        });
    }
    // -------------------------

    revalidatePath(`/dashboard/ticket/${ticketId}`);
    revalidatePath('/dashboard/ticket/[id]', 'page');
    revalidatePath('/dashboard/solicitante');
    revalidatePath('/dashboard/agente');
    return { success: true };
}

export async function updateTicketPropertiesAction(ticketId: string, updates: { estado?: TicketStatus, prioridad?: string, agente_asignado_id?: string | null, vencimiento_sla?: string | null }) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { error: 'No estás autenticado.' };
    }

    // Only agents can update properties
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();

    if (profile?.role !== 'AGENTE') {
        return { error: 'No tienes permisos para realizar esta acción.' };
    }

    if (Object.keys(updates).length === 0) return { success: true };

    if (updates.estado === 'esperando_agente') {
        updates.agente_asignado_id = null;
    }

    if (updates.prioridad) {
        const { data: ticketData } = await supabase.from('tickets').select('fecha_creacion').eq('id', ticketId).single();
        if (ticketData) {
            const creacion = new Date(ticketData.fecha_creacion);
            let horasSla = 72; // Baja Default
            switch (updates.prioridad) {
                case 'crítica': horasSla = 4; break;
                case 'alta': horasSla = 24; break;
                case 'media': horasSla = 48; break;
            }
            creacion.setHours(creacion.getHours() + horasSla);
            updates.vencimiento_sla = creacion.toISOString();
        }
    }

    const { data: updatedTicket, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticketId)
        .select()
        .single();

    if (error || !updatedTicket) {
        console.error('Error updating ticket properties:', error);
        return { error: 'Error interno: La base de datos denegó la actualización de las propiedades (Posible bloqueo de RLS o fila nula).' };
    }

    // Insert System Message
    let systemMessage = '';
    if (updates.estado === 'esperando_agente') {
        systemMessage = 'El ticket ha sido liberado y está esperando asignación.';
    } else if (updates.estado) {
        const estadoLabel = updates.estado.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        systemMessage = `Estado cambiado a ${estadoLabel}.`;
    } else if (updates.prioridad) {
        const prioridadLabel = updates.prioridad.replace(/\b\w/g, l => l.toUpperCase());
        systemMessage = `Prioridad cambiada a ${prioridadLabel}.`;
    }

    if (systemMessage) {
        await supabase.from('ticket_messages').insert({
            ticket_id: ticketId,
            sender_id: user.id,
            mensaje: systemMessage,
            es_sistema: true
        });
    }

    revalidatePath(`/dashboard/ticket/${ticketId}`);
    // Also revalidate the agente table just in case
    revalidatePath('/dashboard/agente');
    return { success: true };
}

export async function assignTicketToMeAction(ticketId: string) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { error: 'No estás autenticado.' };
    }

    // Only agents can self-assign
    const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();

    if (profile?.role !== 'AGENTE') {
        return { error: 'Solo los agentes pueden asignarse tickets.' };
    }

    // Update the ticket to assign the agent and change state to abierto
    const { error } = await supabase
        .from('tickets')
        .update({
            agente_asignado_id: user.id,
            estado: 'abierto'
        })
        .eq('id', ticketId);

    if (error) {
        console.error('Error assigning ticket:', error);
        return { error: 'Fallo al intentar asignarte el ticket.' };
    }

    // Record Audit Trail Message
    await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        sender_id: user.id,
        mensaje: `El agente ${profile.full_name || 'Desconocido'} se ha asignado este ticket.`,
        es_sistema: true
    });

    revalidatePath(`/dashboard/ticket/${ticketId}`);
    revalidatePath('/dashboard/agente');
    return { success: true };
}

export async function approveResolutionAction(ticketId: string, calificacion: number, feedback: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autorizado' };

    const { error } = await supabase
        .from('tickets')
        .update({
            estado: 'cerrado',
            calificacion,
            feedback_cliente: feedback || null
        })
        .eq('id', ticketId);

    if (error) return { error: 'Fallo al procesar la aprobación.' };

    // --- NOTIFY ALL AGENTS ---
    const { data: ticket } = await supabase.from('tickets').select('numero_ticket').eq('id', ticketId).single();
    if (ticket) {
        const { data: agents } = await supabase.from('profiles').select('id').eq('role', 'AGENTE');
        if (agents && agents.length > 0) {
            const notifications = agents.map(agent => ({
                user_id: agent.id,
                ticket_id: ticketId,
                mensaje: `El ticket NC-${ticket.numero_ticket} ha sido aprobado y cerrado por el cliente.`,
                leida: false
            }));
            await supabase.from('notifications').insert(notifications);
        }
    }
    // -------------------------

    revalidatePath(`/dashboard/ticket/${ticketId}`);
    revalidatePath('/dashboard/ticket/[id]', 'page');
    revalidatePath('/dashboard/solicitante');
    return { success: true };
}

export async function rejectResolutionAction(ticketId: string, motivo: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autorizado' };

    // 1. Return to open
    const { error: updateError } = await supabase
        .from('tickets')
        .update({ estado: 'abierto' })
        .eq('id', ticketId);

    if (updateError) return { error: 'Fallo al reabrir el ticket.' };

    // 2. Insert message specifying rejection reason
    const { error: msgError } = await supabase
        .from('ticket_messages')
        .insert({
            ticket_id: ticketId,
            sender_id: user.id,
            mensaje: `[Resolución Rechazada] Motivo: ${motivo}`
        });

    if (msgError) return { error: 'Se reabrió pero falló al enviar el motivo al chat.' };

    // --- NOTIFY ALL AGENTS ---
    const { data: ticket } = await supabase.from('tickets').select('numero_ticket').eq('id', ticketId).single();
    if (ticket) {
        const { data: agents } = await supabase.from('profiles').select('id').eq('role', 'AGENTE');
        if (agents && agents.length > 0) {
            const notifications = agents.map(agent => ({
                user_id: agent.id,
                ticket_id: ticketId,
                mensaje: `El cliente ha rechazado la resolución del ticket NC-${ticket.numero_ticket}.`,
                leida: false
            }));
            await supabase.from('notifications').insert(notifications);
        }
    }
    // -------------------------

    revalidatePath(`/dashboard/ticket/${ticketId}`);
    revalidatePath('/dashboard/ticket/[id]', 'page');
    revalidatePath('/dashboard/solicitante');
    return { success: true };
}

export async function scheduleVisitAction(ticketId: string, fecha: string, nota: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autorizado' };

    // 1. Actualizar el ticket a "programado" (Quitamos la línea conflictiva)
    const { error: updateError } = await supabase
        .from('tickets')
        .update({
            estado: 'programado',
            fecha_programada: fecha
        })
        .eq('id', ticketId);

    if (updateError) {
        console.error('Error scheduling visit:', updateError);
        return { error: 'Fallo al intentar programar la visita técnica.' };
    }

    // Transformar la fecha (ej: de "2026-03-12" a "12/03/2026")
    const [year, month, day] = fecha.split('-');
    const fechaFormateada = `${day}/${month}/${year}`;

    // Limpiar texto vacío o basura del editor Quill
    const cleanNota = nota.replace(/(<([^>]+)>)/gi, "").trim();
    const htmlNota = cleanNota ? nota : '<p>Se ha programado una visita técnica en terreno.</p>';

    // Crear el mensaje del agente inyectando una etiqueta con la fecha arriba del texto
    const mensajeAgente = `<div class="mb-3"><span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-100 uppercase tracking-widest">📅 Visita Agendada: ${fechaFormateada}</span></div>${htmlNota}`;

    // 2. PRIMERO: Guardamos el mensaje del Agente (quedará "abajo" por ser más antiguo)
    await supabase
        .from('ticket_messages')
        .insert({
            ticket_id: ticketId,
            sender_id: user.id,
            mensaje: mensajeAgente,
            es_sistema: false
        });

    // 3. PAUSA TÁCTICA: Obligamos al servidor a esperar 1 segundo (1000ms)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. SEGUNDO: Guardamos el mensaje del sistema (quedará "arriba" por ser 1 segundo más nuevo)
    await supabase
        .from('ticket_messages')
        .insert({
            ticket_id: ticketId,
            sender_id: user.id,
            mensaje: 'Estado cambiado a Programado.',
            es_sistema: true
        });

    // Notificaciones
    const { data: ticket } = await supabase.from('tickets').select('creado_por, numero_ticket').eq('id', ticketId).single();
    if (ticket && ticket.creado_por !== user.id) {
        await supabase.from('notifications').insert({
            user_id: ticket.creado_por,
            ticket_id: ticketId,
            mensaje: `Se ha programado una visita técnica para tu ticket NC-${ticket.numero_ticket}`,
            leida: false
        });
    }

    revalidatePath(`/dashboard/ticket/${ticketId}`);
    revalidatePath('/dashboard/ticket/[id]', 'page');
    revalidatePath('/dashboard/solicitante');
    revalidatePath('/dashboard/agente');
    return { success: true };
}