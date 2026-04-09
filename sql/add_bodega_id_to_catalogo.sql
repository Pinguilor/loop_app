-- ============================================================
-- Migración: Aislar catálogo de equipos por bodega
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- IMPORTANTE: Si ya ejecutaste la versión anterior de este archivo,
-- ejecuta solo los pasos 3 y 4 (las columnas ya existen).
-- ============================================================

-- 1. Agregar bodega_id a familias_hardware (nullable para no romper datos existentes)
ALTER TABLE familias_hardware
    ADD COLUMN IF NOT EXISTS bodega_id uuid REFERENCES bodegas(id) ON DELETE CASCADE;

-- 2. Agregar bodega_id a catalogo_equipos (nullable para no romper datos existentes)
ALTER TABLE catalogo_equipos
    ADD COLUMN IF NOT EXISTS bodega_id uuid REFERENCES bodegas(id) ON DELETE CASCADE;

-- 3. Índices para rendimiento en los filtros
CREATE INDEX IF NOT EXISTS idx_familias_hardware_bodega_id ON familias_hardware(bodega_id);
CREATE INDEX IF NOT EXISTS idx_catalogo_equipos_bodega_id  ON catalogo_equipos(bodega_id);

-- ============================================================
-- PASO CRÍTICO: Reemplazar el UNIQUE constraint de nombre solo
-- por uno compuesto (nombre + bodega_id).
-- Esto permite que 'POS' exista en Bodega A Y también en Bodega B.
-- Los NULLs en bodega_id no colisionan entre sí (comportamiento
-- estándar de PostgreSQL con NULLs en unique constraints).
-- ============================================================

-- 4. familias_hardware: reemplazar UNIQUE(nombre) → UNIQUE(nombre, bodega_id)
ALTER TABLE familias_hardware
    DROP CONSTRAINT IF EXISTS familias_hardware_nombre_key;

ALTER TABLE familias_hardware
    ADD CONSTRAINT familias_hardware_nombre_bodega_key
    UNIQUE (nombre, bodega_id);

-- ============================================================
-- NOTA sobre datos anteriores:
-- Los registros existentes tendrán bodega_id = NULL.
-- Quedarán "huérfanos" (no aparecerán en ninguna bodega específica).
-- Si quieres reasignarlos a una bodega existente, ejecuta:
--
--   UPDATE familias_hardware SET bodega_id = '<UUID_DE_BODEGA>' WHERE bodega_id IS NULL;
--   UPDATE catalogo_equipos  SET bodega_id = '<UUID_DE_BODEGA>' WHERE bodega_id IS NULL;
--
-- ============================================================
