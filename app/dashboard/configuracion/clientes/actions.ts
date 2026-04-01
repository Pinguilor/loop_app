'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const RUTA = '/dashboard/configuracion/clientes';

// ─── Guard: Solo ADMIN ────────────────────────────────────────
async function assertAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado.' };

    const { data: profile } = await supabase
        .from('profiles').select('rol').eq('id', user.id).maybeSingle();

    if (profile?.rol?.toUpperCase() !== 'ADMIN')
        return { error: 'Solo el administrador puede gestionar clientes.' };

    return { supabase, user };
}

// ─────────────────────────────────────────────────────────────
// CREAR cliente
// ─────────────────────────────────────────────────────────────
export async function crearClienteAction(formData: FormData) {
    try {
        const guard = await assertAdmin();
        if (guard.error) return { error: guard.error };

        const nombre_fantasia = (formData.get('nombre_fantasia') as string)?.trim();
        const razon_social    = (formData.get('razon_social')    as string)?.trim() || null;
        const rut             = (formData.get('rut')             as string)?.trim() || null;
        const logo_url        = (formData.get('logo_url')        as string)?.trim() || null;

        if (!nombre_fantasia) return { error: 'El área / nombre de fantasía es obligatorio.' };
        if (!razon_social)    return { error: 'La razón social es obligatoria.' };

        const { error } = await guard.supabase!
            .from('clientes')
            .insert({ nombre_fantasia, razon_social, rut, logo_url, activo: true });

        if (error) {
            if (error.code === '23505') return { error: 'Esta área ya está registrada con ese RUT y nombre. Usa un nombre distinto para diferenciarla.' };
            throw new Error(error.message);
        }

        revalidatePath(RUTA);
        revalidatePath('/dashboard/configuracion');
        return { success: true };
    } catch (e: any) {
        return { error: e.message || 'Error interno al crear el cliente.' };
    }
}

// ─────────────────────────────────────────────────────────────
// ACTUALIZAR cliente
// ─────────────────────────────────────────────────────────────
export async function actualizarClienteAction(formData: FormData) {
    try {
        const guard = await assertAdmin();
        if (guard.error) return { error: guard.error };

        const id              = (formData.get('id')              as string)?.trim();
        const nombre_fantasia = (formData.get('nombre_fantasia') as string)?.trim();
        const razon_social    = (formData.get('razon_social')    as string)?.trim() || null;
        const rut             = (formData.get('rut')             as string)?.trim() || null;
        const logo_url        = (formData.get('logo_url')        as string)?.trim() || null;

        if (!id || !nombre_fantasia) return { error: 'ID y nombre son obligatorios.' };
        if (!razon_social)           return { error: 'La razón social es obligatoria.' };

        const { error } = await guard.supabase!
            .from('clientes')
            .update({ nombre_fantasia, razon_social, rut, logo_url })
            .eq('id', id);

        if (error) {
            if (error.code === '23505') return { error: 'Esta área ya está registrada con ese RUT y nombre. Usa un nombre distinto para diferenciarla.' };
            throw new Error(error.message);
        }

        revalidatePath(RUTA);
        return { success: true };
    } catch (e: any) {
        return { error: e.message || 'Error interno al actualizar el cliente.' };
    }
}

// ─────────────────────────────────────────────────────────────
// TOGGLE activo / inactivo (no eliminación física)
// ─────────────────────────────────────────────────────────────
export async function toggleActivoClienteAction(id: string, activo: boolean) {
    try {
        const guard = await assertAdmin();
        if (guard.error) return { error: guard.error };

        const { error } = await guard.supabase!
            .from('clientes')
            .update({ activo: !activo })
            .eq('id', id);

        if (error) throw new Error(error.message);

        revalidatePath(RUTA);
        return { success: true };
    } catch (e: any) {
        return { error: e.message || 'Error al cambiar el estado del cliente.' };
    }
}

// ─────────────────────────────────────────────────────────────
// GET clientes activos (para selectores en otros módulos)
// ─────────────────────────────────────────────────────────────
export async function getClientesActivosAction() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('clientes')
            .select('id, nombre_fantasia')
            .eq('activo', true)
            .order('nombre_fantasia');

        if (error) throw new Error(error.message);
        return { data: data ?? [] };
    } catch (e: any) {
        return { error: e.message, data: [] };
    }
}
