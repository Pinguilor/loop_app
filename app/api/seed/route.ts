import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const TITULOS = [
    'Falla de POS01 en Mostrador', 'Pantalla DMB apagada', 'Revisión de botonera AutoMac',
    'Impresora térmica no corta papel', 'KVS no actualiza pedidos', 'Sin conexión de red en McCafe',
    'Cambio de pantalla NGK', 'El sistema operativo del servidor está lento', 'Gaveta de dinero no abre',
    'Revisión general de equipos por apertura'
];

const DESCRIPCIONES = [
    'Hola equipo, desde el turno de mañana el equipo presenta fallas. Se reinicia solo al intentar procesar un pedido. Necesitamos apoyo urgente.',
    'Estimados, la pantalla quedó en negro después del corte de luz de anoche. Ya revisamos los enchufes.',
    'Se solicita revisión física del equipo. Al parecer un cable está haciendo mal contacto y el personal no puede operar con normalidad.',
    'Favor enviar técnico para reemplazo de partes, el equipo ya cumplió su vida útil según el inventario.'
];

const RESPUESTAS = [
    'Recibido, derivando al equipo de terreno.',
    '¿Podrían confirmar si la IP del equipo responde a ping?',
    'Ya realizamos el reinicio de fábrica, pero el problema persiste.',
    'El técnico Juan Pérez va en camino a la sucursal.',
    'Equipo reemplazado y operativo. Adjunto firma de gerente de local en sistema.',
    'Estimado, por favor validar si con la actualización de hoy quedó resuelto.',
    'Validado, todo funcionando correctamente. Pueden cerrar el caso.'
];

const PRIORIDADES = ['baja', 'media', 'alta', 'crítica'] as const;

const ESTADOS = [
    ...Array(10).fill('abierto'),
    ...Array(30).fill('esperando_agente'),
    ...Array(10).fill('resuelto')
] as const;

function getRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomDateWithinLastDays(days: number) {
    const now = new Date();
    const past = new Date(now.getTime() - Math.random() * days * 24 * 60 * 60 * 1000);
    return past.toISOString();
}

// Generate a random UUID
function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (parseInt(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> parseInt(c) / 4).toString(16)
    );
}

export async function GET() {
    const supabase = await createClient();

    try {
        const { data: restaurantes } = await supabase.from('restaurantes').select('id');
        const { data: catalogos } = await supabase.from('catalogo_servicios').select('id');
        const { data: zonas } = await supabase.from('zonas').select('id');

        if (!restaurantes?.length || !catalogos?.length || !zonas?.length) {
            return new NextResponse('Error: Faltan datos maestros (Restaurantes, Catalogos, Zonas) en la BD. Crea al menos uno de cada uno.', { status: 400 });
        }

        // Hardcoded users from the provided screenshot
        const usuario_id = 'fe8a87e6-2181-46bd-bfda-ba734a502af3'; // Mauricio Labra
        const agente_id = 'be04d9e9-f2c8-4c4a-a02f-33ad29675f80'; // Calamardo

        let sqlQuery = `-- ==========================================\n`;
        sqlQuery += `-- SCRIPT DE INYECCIÓN DE PRUEBAS PARA SUPABASE\n`;
        sqlQuery += `-- Pegar directamente en el SQL Editor y ejecutar\n`;
        sqlQuery += `-- ==========================================\n\n`;

        for (let i = 0; i < 50; i++) {
            const ticket_id = uuidv4();
            const fechaCreacion = getRandomDateWithinLastDays(30);

            const titulo = getRandom(TITULOS).replace(/'/g, "''");
            const descripcion = `<p>${getRandom(DESCRIPCIONES)}</p>`.replace(/'/g, "''");
            const prioridad = getRandom([...PRIORIDADES]);
            const estado = ESTADOS[i];
            const restaurante_id = getRandom(restaurantes).id;
            const catalogo_id = getRandom(catalogos).id;
            const zona_id = getRandom(zonas).id;

            sqlQuery += `INSERT INTO tickets (id, titulo, descripcion, prioridad, estado, creado_por, restaurante_id, catalogo_servicio_id, zona_id, fecha_creacion)\n`;
            sqlQuery += `VALUES ('${ticket_id}', '${titulo}', '${descripcion}', '${prioridad}', '${estado}', '${usuario_id}', '${restaurante_id}', '${catalogo_id}', '${zona_id}', '${fechaCreacion}');\n\n`;

            const numMessages = Math.floor(Math.random() * 6) + 3;
            let messageDate = new Date(fechaCreacion);

            for (let m = 0; m < numMessages; m++) {
                messageDate = new Date(messageDate.getTime() + (Math.floor(Math.random() * 115) + 5) * 60000);
                const isUser = m % 2 === 0;
                const sender_id = isUser ? usuario_id : agente_id;
                const mensaje = `<p>${getRandom(RESPUESTAS)}</p>`.replace(/'/g, "''");

                sqlQuery += `INSERT INTO ticket_messages (ticket_id, sender_id, mensaje, creado_en)\n`;
                sqlQuery += `VALUES ('${ticket_id}', '${sender_id}', '${mensaje}', '${messageDate.toISOString()}');\n`;
            }
            sqlQuery += `\n`;
        }

        sqlQuery += `-- FIN DEL SCRIPT\n`;

        return new NextResponse(sqlQuery, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8'
            }
        });

    } catch (error: any) {
        return new NextResponse(`Error interno: ${error.message}`, { status: 500 });
    }
}
