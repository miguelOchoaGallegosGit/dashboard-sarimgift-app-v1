-- ============================================
-- SCRIPT DE ACTUALIZACIÓN DE TABLA INVENTORY_ITEMS
-- Ajuste de campos según estructura del Excel
-- ============================================

-- PASO 1: Eliminar columnas que no se necesitan
ALTER TABLE inventory_items DROP COLUMN IF EXISTS unit_price;
ALTER TABLE inventory_items DROP COLUMN IF EXISTS supplier;
ALTER TABLE inventory_items DROP COLUMN IF EXISTS size;
ALTER TABLE inventory_items DROP COLUMN IF EXISTS color;

-- PASO 2: Agregar nuevas columnas según el Excel
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS tipo VARCHAR(100);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS material VARCHAR(100);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS modelo VARCHAR(100);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS diseno VARCHAR(255);

-- PASO 3: Actualizar índices (eliminar los que ya no existen)
DROP INDEX IF EXISTS idx_inventory_name;

-- PASO 4: Crear nuevos índices para los campos agregados
CREATE INDEX IF NOT EXISTS idx_inventory_tipo ON inventory_items(tipo);
CREATE INDEX IF NOT EXISTS idx_inventory_material ON inventory_items(material);

-- ============================================
-- VERIFICACIÓN: Consulta para ver la estructura actualizada
-- ============================================
-- Ejecuta esto después de aplicar los cambios para verificar:
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'inventory_items' 
-- ORDER BY ordinal_position;

-- ============================================
-- ESTRUCTURA FINAL DE LA TABLA
-- ============================================
-- id (bigint) - PK autogenerado
-- item_number (varchar 20) - Código único ITEM-XXXX
-- name (varchar 255) - Nombre del producto
-- description (text) - Descripción
-- category (varchar 50) - Categoría (Unisex, Niño, Niña, Dama, Caballero, Accesorios)
-- quantity (integer) - Cantidad en stock
-- tipo (varchar 100) - Tipo de producto (TOMATODO, CUADRO, BOTELLA, etc.)
-- material (varchar 100) - Material (METAL PINTADO, MADERA, PLÁSTICO, etc.)
-- modelo (varchar 100) - Modelo (TAPA ROSCA, A4, etc.)
-- diseno (varchar 255) - Diseño/Color (NEGRO 650ML, AZUL 650ML, etc.)
-- notes (text) - Notas adicionales
-- created_at (timestamptz) - Fecha de creación
-- updated_at (timestamptz) - Fecha de actualización
