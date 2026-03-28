'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const RUTA = '/dashboard/admin/catalogo';

async function assertAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado.' };
    const { data: profile } = await supabase
        .from('profiles').select('rol').eq('id', user.id).maybeSingle();
    if (profile?.rol?.toUpperCase() !== 'ADMIN')
        return { error: 'Solo el administrador puede modificar el catálogo.' };
    return { supabase, user };
}

// ─────────────────────────────────────────────────────────────
// NIVEL 1 — ticket_tipos_servicio
// ─────────────────────────────────────────────────────────────
export async function crearTipoServicioAction(nombre: string, clienteId?: string) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_tipos_servicio').insert({
        nombre: nombre.trim(),
        activo: true,
        ...(clienteId ? { cliente_id: clienteId } : {}),
    });
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

export async function actualizarTipoServicioAction(id: string, nombre: string) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_tipos_servicio').update({ nombre: nombre.trim() }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

export async function toggleTipoServicioAction(id: string, activo: boolean) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_tipos_servicio').update({ activo: !activo }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

export async function eliminarTipoServicioAction(id: string) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_tipos_servicio').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

// ─────────────────────────────────────────────────────────────
// NIVEL 2 — ticket_categorias
// ─────────────────────────────────────────────────────────────
export async function crearCategoriaAction(nombre: string, tipoServicioId: string) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_categorias').insert({
        nombre: nombre.trim(), tipo_servicio_id: tipoServicioId, activo: true
    });
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

export async function actualizarCategoriaAction(id: string, nombre: string) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_categorias').update({ nombre: nombre.trim() }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

export async function toggleCategoriaAction(id: string, activo: boolean) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_categorias').update({ activo: !activo }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

export async function eliminarCategoriaAction(id: string) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_categorias').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

// ─────────────────────────────────────────────────────────────
// NIVEL 3 — ticket_subcategorias
// ─────────────────────────────────────────────────────────────
export async function crearSubcategoriaAction(nombre: string, categoriaId: string) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_subcategorias').insert({
        nombre: nombre.trim(), categoria_id: categoriaId, activo: true
    });
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

export async function actualizarSubcategoriaAction(id: string, nombre: string) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_subcategorias').update({ nombre: nombre.trim() }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

export async function toggleSubcategoriaAction(id: string, activo: boolean) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_subcategorias').update({ activo: !activo }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

export async function eliminarSubcategoriaAction(id: string) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_subcategorias').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

// ─────────────────────────────────────────────────────────────
// NIVEL 4 — ticket_acciones
// ─────────────────────────────────────────────────────────────
export async function crearAccionAction(nombre: string, subcategoriaId: string) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_acciones').insert({
        nombre: nombre.trim(), subcategoria_id: subcategoriaId, activo: true
    });
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

export async function actualizarAccionAction(id: string, nombre: string) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_acciones').update({ nombre: nombre.trim() }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

export async function toggleAccionAction(id: string, activo: boolean) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_acciones').update({ activo: !activo }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

export async function eliminarAccionAction(id: string) {
    const guard = await assertAdmin();
    if (guard.error) return { error: guard.error };
    const { error } = await guard.supabase!.from('ticket_acciones').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath(RUTA);
    return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Kept for backward compat (old flat catalogo_servicios)
// ─────────────────────────────────────────────────────────────
export async function crearCatalogoAction(formData: FormData) {
    return { error: 'Función deprecada. Use el catálogo jerárquico.' };
}
export async function actualizarCatalogoAction(formData: FormData) {
    return { error: 'Función deprecada. Use el catálogo jerárquico.' };
}
export async function eliminarCatalogoAction(id: string) {
    return { error: 'Función deprecada. Use el catálogo jerárquico.' };
}
export async function toggleActivoCatalogoAction(id: string, activo: boolean) {
    return { error: 'Función deprecada. Use el catálogo jerárquico.' };
}
