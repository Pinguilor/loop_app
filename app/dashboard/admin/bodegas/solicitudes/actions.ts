'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ─────────────────────────────────────────────────────────────────────────────
// Obtener todas las solicitudes (para vista del Bodeguero)
// ─────────────────────────────────────────────────────────────────────────────
export async function getSolicitudesMaterialesAction() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'No autorizado.', data: [] };

        const { data: profile } = await supabase
            .from('profiles').select('rol').eq('id', user.id).maybeSingle();

        const rol = profile?.rol?.toUpperCase() || '';
        const rolesPermitidos = ['ADMIN_BODEGA', 'ADMIN', 'COORDINADOR'];
        if (!rolesPermitidos.includes(rol)) return { error: 'Permisos insuficientes.', data: [] };

        const { data, error } = await supabase
            .from('solicitudes_materiales')
            .select(`
                *,
                tecnico:tecnico_id ( id, full_name ),
                bodeguero:bodeguero_id ( full_name ),
                ticket:ticket_id ( id, numero_ticket, titulo ),
                solicitud_items (
                    id,
                    cantidad,
                    inventario:inventario_id (
                        id, modelo, familia, es_serializado, numero_serie, cantidad
                    )
                )
            `)
            .order('creado_en', { ascending: false });

        if (error) throw new Error(error.message);

        // Pendientes primero
        const sorted = (data || []).sort((a: any, b: any) => {
            const order: Record<string, number> = { pendiente: 0, aprobada: 1, rechazada: 2 };
            return (order[a.estado] ?? 3) - (order[b.estado] ?? 3);
        });

        return { data: sorted };
    } catch (e: any) {
        return { error: e.message, data: [] };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Obtener Bodegas Centrales (para selector en modal de aprobación)
// ─────────────────────────────────────────────────────────────────────────────
export async function getBodegasCentralesAction() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'No autorizado.', data: [] };

        const { data, error } = await supabase
            .from('bodegas')
            .select('id, nombre, tipo')
            .ilike('tipo', 'CENTRAL')
            .order('nombre', { ascending: true });

        if (error) throw new Error(error.message);
        return { data: data || [] };
    } catch (e: any) {
        return { error: e.message, data: [] };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Aprobar solicitud → llama a la RPC transaccional en PostgreSQL
// Soporta aprobación parcial (solo los ítems en approvedItemIds se mueven)
// ─────────────────────────────────────────────────────────────────────────────
export async function aprobarSolicitudAction(
    solicitudId: string,
    bodegaCentralId: string,
    approvedItemIds: string[],       // IDs de solicitud_items que el bodeguero aprobó
    comentario: string | null = null // Comentario de entrega opcional
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'No autorizado.' };

        const { data: profile } = await supabase
            .from('profiles').select('rol').eq('id', user.id).maybeSingle();

        if (profile?.rol?.toUpperCase() !== 'ADMIN_BODEGA') {
            return { error: 'Solo el bodeguero puede aprobar solicitudes.' };
        }

        if (!approvedItemIds || approvedItemIds.length === 0) {
            return { error: 'Debes seleccionar al menos un ítem para aprobar.' };
        }

        // Llamar a la función RPC atómica actualizada
        const { data, error } = await supabase.rpc('aprobar_solicitud_rpc', {
            p_solicitud_id:       solicitudId,
            p_bodeguero_id:       user.id,
            p_bodega_central:     bodegaCentralId,
            p_approved_item_ids:  approvedItemIds,
            p_comentario:         comentario ?? null,
        });

        if (error) throw new Error(error.message);

        // La RPC devuelve { success: true } o { error: "..." }
        const result = data as { success?: boolean; error?: string };
        if (result?.error) return { error: result.error };

        revalidatePath('/dashboard/admin/bodegas/solicitudes');
        revalidatePath('/dashboard/admin/solicitudes');
        return { success: true };
    } catch (e: any) {
        return { error: e.message || 'Error interno al aprobar la solicitud.' };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Rechazar solicitud → llama a la RPC de rechazo
// ─────────────────────────────────────────────────────────────────────────────
export async function rechazarSolicitudAction(solicitudId: string, motivo: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'No autorizado.' };

        const { data: profile } = await supabase
            .from('profiles').select('rol').eq('id', user.id).maybeSingle();

        if (profile?.rol?.toUpperCase() !== 'ADMIN_BODEGA') {
            return { error: 'Solo el bodeguero puede rechazar solicitudes.' };
        }

        if (!motivo?.trim()) return { error: 'El motivo de rechazo es obligatorio.' };

        const { data, error } = await supabase.rpc('rechazar_solicitud_rpc', {
            p_solicitud_id: solicitudId,
            p_bodeguero_id: user.id,
            p_motivo: motivo.trim(),
        });

        if (error) throw new Error(error.message);

        const result = data as { success?: boolean; error?: string };
        if (result?.error) return { error: result.error };

        revalidatePath('/dashboard/admin/bodegas/solicitudes');
        revalidatePath('/dashboard/admin/solicitudes');
        return { success: true };
    } catch (e: any) {
        return { error: e.message || 'Error interno al rechazar la solicitud.' };
    }
}
