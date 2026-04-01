-- =============================================================================
--  aprobar_solicitud_rpc  ·  Systel Loop
--  Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
--
--  CAMBIO CLAVE respecto a la versión anterior:
--    Los ítems GENÉRICOS (es_serializado = false) se transfieren a la mochila
--    del técnico usando (bodega_id + modelo + familia + ticket_id) como clave
--    compuesta, en lugar de solo (bodega_id + modelo + familia).
--    Esto garantiza que cada ticket tenga su propia fila en el inventario
--    de la mochila y aparezca correctamente agrupado en la UI.
-- =============================================================================

CREATE OR REPLACE FUNCTION aprobar_solicitud_rpc(
    p_solicitud_id      UUID,
    p_bodeguero_id      UUID,
    p_bodega_central    UUID,
    p_approved_item_ids UUID[],   -- array de solicitud_items.id
    p_comentario        TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- Datos de la solicitud
    v_ticket_id  UUID;
    v_tecnico_id UUID;

    -- Mochila destino
    v_mochila_id UUID;

    -- Cursor para los ítems aprobados
    v_item       RECORD;   -- fila de solicitud_items
    v_inv        RECORD;   -- fila de inventario (fuente, bodega central)

    -- Ítem destino en mochila (genéricos)
    v_dest_id    UUID;
    v_dest_cant  INTEGER;
BEGIN

    -- ─────────────────────────────────────────────────────────────────────────
    -- 1. Obtener ticket_id y tecnico_id desde la solicitud
    -- ─────────────────────────────────────────────────────────────────────────
    SELECT ticket_id, tecnico_id
      INTO v_ticket_id, v_tecnico_id
      FROM solicitudes_materiales
     WHERE id = p_solicitud_id;

    IF NOT FOUND THEN
        RETURN json_build_object('error', 'Solicitud no encontrada.');
    END IF;


    -- ─────────────────────────────────────────────────────────────────────────
    -- 2. Localizar la mochila del técnico
    -- ─────────────────────────────────────────────────────────────────────────
    SELECT id INTO v_mochila_id
      FROM bodegas
     WHERE tecnico_id = v_tecnico_id
       AND UPPER(tipo) = 'MOCHILA'
     LIMIT 1;

    IF v_mochila_id IS NULL THEN
        RETURN json_build_object(
            'error',
            'El técnico no tiene una mochila asignada. Contacta al administrador.'
        );
    END IF;


    -- ─────────────────────────────────────────────────────────────────────────
    -- 3. Procesar cada ítem de la solicitud que fue aprobado
    -- ─────────────────────────────────────────────────────────────────────────
    FOR v_item IN
        SELECT si.id,
               si.cantidad,
               si.inventario_id
          FROM solicitud_items si
         WHERE si.solicitud_id = p_solicitud_id
           AND si.id = ANY(p_approved_item_ids)
    LOOP

        -- Obtener datos del ítem de inventario en bodega central
        SELECT id, modelo, familia, es_serializado,
               numero_serie, cantidad, bodega_id
          INTO v_inv
          FROM inventario
         WHERE id = v_item.inventario_id;

        IF NOT FOUND THEN
            RETURN json_build_object(
                'error',
                format('Ítem de inventario %s no encontrado.', v_item.inventario_id)
            );
        END IF;


        -- ── Rama A: Ítem SERIALIZADO ──────────────────────────────────────────
        IF v_inv.es_serializado THEN

            -- Validar que el ítem sigue disponible
            IF v_inv.cantidad < 1 THEN
                RETURN json_build_object(
                    'error',
                    format('Sin stock disponible para el serializado "%s" (SN: %s).',
                        v_inv.modelo,
                        COALESCE(v_inv.numero_serie, 'N/A'))
                );
            END IF;

            -- Mover la fila completa a la mochila, asignando ticket_id
            UPDATE inventario
               SET bodega_id = v_mochila_id,
                   ticket_id = v_ticket_id
             WHERE id = v_inv.id;

            -- Registrar movimiento
            INSERT INTO movimientos_inventario
                (inventario_id, ticket_id,
                 bodega_origen_id, bodega_destino_id,
                 cantidad, tipo_movimiento,
                 realizado_por, fecha_movimiento)
            VALUES
                (v_inv.id, v_ticket_id,
                 p_bodega_central, v_mochila_id,
                 1, 'salida',
                 p_bodeguero_id, NOW());


        -- ── Rama B: Ítem GENÉRICO (no serializado) ────────────────────────────
        ELSE

            -- Validar stock suficiente en bodega central
            IF v_inv.cantidad < v_item.cantidad THEN
                RETURN json_build_object(
                    'error',
                    format(
                        'Stock insuficiente en bodega central para "%s %s". '
                        'Disponible: %s ud., requerido: %s ud.',
                        v_inv.familia, v_inv.modelo,
                        v_inv.cantidad, v_item.cantidad
                    )
                );
            END IF;

            -- Descontar de la bodega central
            UPDATE inventario
               SET cantidad = cantidad - v_item.cantidad
             WHERE id = v_inv.id;

            -- ────────────────────────────────────────────────────────────────
            --  PARCHE CLAVE: buscar fila en mochila por
            --  (bodega_id + modelo + familia + ticket_id)
            --  → una fila por ticket, trazabilidad estricta
            -- ────────────────────────────────────────────────────────────────
            SELECT id, cantidad
              INTO v_dest_id, v_dest_cant
              FROM inventario
             WHERE bodega_id      = v_mochila_id
               AND modelo         = v_inv.modelo
               AND familia        = v_inv.familia
               AND es_serializado = false
               AND (
                     (ticket_id  = v_ticket_id)
                  OR (ticket_id IS NULL AND v_ticket_id IS NULL)
               )
             LIMIT 1;

            IF FOUND THEN
                -- Acumular en la fila existente del mismo ticket
                UPDATE inventario
                   SET cantidad = v_dest_cant + v_item.cantidad
                 WHERE id = v_dest_id;

            ELSE
                -- Crear fila nueva con ticket_id preservado
                INSERT INTO inventario
                    (bodega_id, modelo, familia,
                     es_serializado, cantidad,
                     estado, ticket_id)
                VALUES
                    (v_mochila_id, v_inv.modelo, v_inv.familia,
                     false, v_item.cantidad,
                     'Disponible', v_ticket_id)
                RETURNING id INTO v_dest_id;

            END IF;

            -- Registrar movimiento
            INSERT INTO movimientos_inventario
                (inventario_id, ticket_id,
                 bodega_origen_id, bodega_destino_id,
                 cantidad, tipo_movimiento,
                 realizado_por, fecha_movimiento)
            VALUES
                (v_dest_id, v_ticket_id,
                 p_bodega_central, v_mochila_id,
                 v_item.cantidad, 'salida',
                 p_bodeguero_id, NOW());

        END IF; -- fin rama serializado/genérico

    END LOOP; -- fin bucle ítems


    -- ─────────────────────────────────────────────────────────────────────────
    -- 4. Marcar la solicitud como APROBADA
    -- ─────────────────────────────────────────────────────────────────────────
    UPDATE solicitudes_materiales
       SET estado        = 'aprobada',
           bodeguero_id  = p_bodeguero_id,
           gestionado_en = NOW()
     WHERE id = p_solicitud_id;

    RETURN json_build_object('success', true);


-- ─────────────────────────────────────────────────────────────────────────────
-- Captura de errores inesperados
-- ─────────────────────────────────────────────────────────────────────────────
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);

END;
$$;

-- Asegurar que el rol autenticado pueda invocar la función
GRANT EXECUTE ON FUNCTION aprobar_solicitud_rpc(UUID, UUID, UUID, UUID[], TEXT)
    TO authenticated;
