-- =============================================================================
--  MIGRACIÓN: Despacho Multibodega (Split Fulfillment)
--  Ejecutar UNA VEZ en Supabase Dashboard → SQL Editor → New query → Run
--  ORDEN: ejecutar este archivo ANTES de aprobar_solicitud_rpc.sql
-- =============================================================================

-- 1. Agregar bodega_origen_id a nivel de ítem (nulo hasta que se aprueba)
ALTER TABLE solicitud_items
ADD COLUMN IF NOT EXISTS bodega_origen_id UUID REFERENCES bodegas(id);

-- 2. Eliminar la firma antigua de la RPC (firma con p_bodega_central UUID)
--    La nueva RPC acepta p_item_bodegas JSONB en su lugar.
DROP FUNCTION IF EXISTS aprobar_solicitud_rpc(UUID, UUID, UUID, UUID[], TEXT);
