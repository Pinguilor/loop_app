'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const RUTA = '/dashboard/admin/mochilas';

async function assertSupervisor() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado.' };

    const { data: profile } = await supabase
        .from('profiles').select('rol').eq('id', user.id).maybeSingle();

    const rol = profile?.rol?.toUpperCase() ?? '';
    if (!['ADMIN', 'COORDINADOR'].includes(rol)) {
        return { error: 'Solo administradores o coordinadores pueden realizar esta acción.' };
    }
    return { user };
}

// ─────────────────────────────────────────────────────────────
// INICIALIZAR MOCHILA para un técnico que no tiene una
// ─────────────────────────────────────────────────────────────
export async function inicializarMochilaAction(tecnicoId: string, tecnicoName: string) {
    try {
        const guard = await assertSupervisor();
        if (guard.error) return { error: guard.error };

        const supabase = await createClient();

        // Verificar que no tenga mochila ya
        const { data: existing } = await supabase
            .from('bodegas')
            .select('id')
            .eq('tecnico_id', tecnicoId)
            .eq('tipo', 'MOCHILA')
            .maybeSingle();

        if (existing) return { error: 'Este técnico ya tiene una mochila asignada.' };

        const { error: insertError } = await supabase.from('bodegas').insert({
            nombre:     `Mochila - ${tecnicoName}`,
            tipo:       'MOCHILA',
            tecnico_id: tecnicoId,
        });

        if (insertError) throw new Error(insertError.message);

        revalidatePath(RUTA);
        return { success: true };
    } catch (e: any) {
        return { error: e.message || 'Error al inicializar la mochila.' };
    }
}
