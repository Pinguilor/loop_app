import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TrazabilidadClient } from './TrazabilidadClient';

export const dynamic = 'force-dynamic';

export interface SerializadoInstalado {
    inventario_id: string;
    modelo: string;
    familia: string;
    numero_serie: string;
    fecha_instalacion: string;
    ticket_id: string;
    ticket_numero: number;
    tecnico_nombre: string;
    restaurante_id: string;
    restaurante_nombre: string;
    restaurante_sigla: string;
}

export default async function TrazabilidadPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('rol')
        .eq('id', user.id)
        .maybeSingle();

    const rol = profile?.rol?.toUpperCase() || '';
    if (rol !== 'ADMIN' && rol !== 'ADMIN_BODEGA') redirect('/dashboard/usuario');

    // ── Consulta principal ──────────────────────────────────────────────────
    // Cruzamos:
    //   movimientos_inventario  (el evento de instalación, bodega_destino = bodega de tipo Local)
    //   inventario              (para modelo, familia, numero_serie, es_serializado)
    //   bodegas (destino)       (para filtrar solo bodegas tipo Local y obtener local_id)
    //   restaurantes            (nombre, sigla del restaurante dueño de esa bodega)
    //   tickets                 (numero_ticket del ticket origen)
    //   profiles (realizado_por)(nombre del técnico)
    //
    // Regla: solo serializados (es_serializado = true), solo destino tipo 'Local',
    //        agrupamos en JS por restaurante_id eliminando los sin nombre.

    // Ruta: movimientos_inventario → inventario (es_serializado) + bodegas_destino (tipo=Local)
    //        + tickets → restaurantes (nombre, sigla)  +  profiles (técnico)
    // Se usa tickets→restaurantes en lugar de bodegas.local_id porque local_id puede ser null.
    const { data: movimientos, error } = await supabase
        .from('movimientos_inventario')
        .select(`
            id,
            fecha_movimiento,
            inventario_id,
            ticket_id,
            realizado_por,
            inventario!inner (
                id,
                modelo,
                familia,
                numero_serie,
                es_serializado
            ),
            bodega_destino:bodegas!movimientos_inventario_bodega_destino_id_fkey (
                id,
                tipo
            ),
            tickets!inner (
                numero_ticket,
                restaurantes (
                    id,
                    nombre_restaurante,
                    sigla
                )
            ),
            profiles:realizado_por (
                full_name
            )
        `)
        .eq('inventario.es_serializado', true)
        .order('fecha_movimiento', { ascending: false });

    if (error) {
        console.error('Error trazabilidad:', error.message);
    }

    // ── Filtrar: solo movimientos cuyo destino es una bodega tipo Local ──────
    const soloLocales = (movimientos || []).filter((m: any) => {
        const tipo = m.bodega_destino?.tipo?.toUpperCase();
        return tipo === 'LOCAL' && m.tickets?.restaurantes;
    });

    // ── Construir lista tipada ────────────────────────────────────────────────
    const serializados: SerializadoInstalado[] = soloLocales
        .map((m: any) => {
            const restaurante = m.tickets?.restaurantes;
            if (!restaurante) return null;

            return {
                inventario_id: m.inventario_id,
                modelo: m.inventario?.modelo ?? '—',
                familia: m.inventario?.familia ?? '—',
                numero_serie: m.inventario?.numero_serie ?? '—',
                fecha_instalacion: m.fecha_movimiento,
                ticket_id: m.ticket_id,
                ticket_numero: m.tickets?.numero_ticket ?? 0,
                tecnico_nombre: m.profiles?.full_name ?? 'Desconocido',
                restaurante_id: restaurante.id,
                restaurante_nombre: restaurante.nombre_restaurante,
                restaurante_sigla: restaurante.sigla ?? '',
            } satisfies SerializadoInstalado;
        })
        .filter(Boolean) as SerializadoInstalado[];

    return <TrazabilidadClient serializados={serializados} />;
}
