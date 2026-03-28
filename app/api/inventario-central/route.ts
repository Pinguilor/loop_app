import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/inventario-central
 * 
 * Retorna todos los ítems de inventario pertenecientes a bodegas de tipo CENTRAL
 * que tengan stock disponible (genéricos: cantidad > 0 / serializados: estado = 'Disponible').
 * 
 * Acceso: Solo usuarios autenticados con rol tecnico, admin_bodega, admin, coordinador.
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Verificar auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
        }

        // 2. Verificar rol
        const { data: profile } = await supabase
            .from('profiles')
            .select('rol')
            .eq('id', user.id)
            .maybeSingle();

        const rolesPermitidos = ['TECNICO', 'ADMIN_BODEGA', 'ADMIN', 'COORDINADOR'];
        if (!rolesPermitidos.includes(profile?.rol?.toUpperCase() || '')) {
            return NextResponse.json({ error: 'Permisos insuficientes.' }, { status: 403 });
        }

        // 3. Obtener las IDs de bodegas tipo CENTRAL
        const { data: bodegas, error: bodegaError } = await supabase
            .from('bodegas')
            .select('id')
            .ilike('tipo', 'CENTRAL');

        if (bodegaError) throw new Error(`Error al buscar bodegas: ${bodegaError.message}`);
        if (!bodegas || bodegas.length === 0) {
            return NextResponse.json({ data: [] });
        }

        const bodegaIds = bodegas.map(b => b.id);

        // 4. Obtener inventario disponible de esas bodegas
        //    - Genéricos: cantidad > 0 (sin filtro de estado, la cantidad ES el stock)
        //    - Serializados: estado = 'Disponible' (son filas únicas, cantidad siempre 1)
        const { data: inventario, error: invError } = await supabase
            .from('inventario')
            .select('id, modelo, familia, es_serializado, numero_serie, cantidad, estado, bodega_id')
            .in('bodega_id', bodegaIds)
            .or('es_serializado.eq.false,and(es_serializado.eq.true,estado.ilike.Disponible)')
            .gt('cantidad', 0)
            .order('familia', { ascending: true })
            .order('modelo', { ascending: true });

        if (invError) throw new Error(`Error al obtener inventario: ${invError.message}`);

        return NextResponse.json({ data: inventario || [] });

    } catch (error: any) {
        console.error('[API /inventario-central] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor.' },
            { status: 500 }
        );
    }
}
