-- ============================================
-- SCRIPT PARA AGREGAR CAMPO DE COSTO (COST)
-- Dashboard SarimGift - Módulo de Inventario
-- ============================================

-- Agregar columna de costo
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2) DEFAULT 0.00;

-- Agregar comentario a la columna
COMMENT ON COLUMN inventory_items.cost IS 'Costo unitario del item';

-- Crear índice para optimizar consultas por costo (opcional)
CREATE INDEX IF NOT EXISTS idx_inventory_cost ON inventory_items(cost);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta esto después de aplicar los cambios para verificar:
-- SELECT column_name, data_type, numeric_precision, numeric_scale 
-- FROM information_schema.columns 
-- WHERE table_name = 'inventory_items' AND column_name = 'cost';

-- ============================================
-- ESTRUCTURA ACTUALIZADA DE LA TABLA
-- ============================================
-- La tabla ahora incluye:
-- - cost (DECIMAL 10,2) - Costo unitario del item
-- 
-- Ejemplo de uso:
-- UPDATE inventory_items SET cost = 15.50 WHERE id = 1;
