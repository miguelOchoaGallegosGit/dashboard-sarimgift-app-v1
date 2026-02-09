-- ============================================
-- SCRIPT DE CREACIÓN DE TABLA INVENTORY_ITEMS
-- Dashboard SarimGift - Módulo de Inventario
-- ============================================

-- Tabla principal de inventario
CREATE TABLE IF NOT EXISTS inventory_items (
  id BIGSERIAL PRIMARY KEY,
  item_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Unisex', 'Niño', 'Niña', 'Dama', 'Caballero', 'Accesorios')),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_price DECIMAL(10, 2) DEFAULT 0.00,
  size VARCHAR(20),
  color VARCHAR(50),
  supplier VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory_items(quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_item_number ON inventory_items(item_number);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory_items(name);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Permitir todas las operaciones (ajustar según tus necesidades de autenticación)
-- NOTA: Esta política permite acceso total. Si tienes autenticación, ajusta según tus necesidades.
CREATE POLICY "Enable all operations for all users" ON inventory_items
  FOR ALL USING (true);

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- Descomenta las siguientes líneas si deseas insertar datos de prueba
-- ============================================

/*
INSERT INTO inventory_items (item_number, name, description, category, quantity, unit_price, size, color, supplier, notes) VALUES
('ITEM-0001', 'Polo Básico', 'Polo de algodón 100%', 'Unisex', 25, 25.50, 'M', 'Azul', 'Textiles SAC', 'Stock inicial'),
('ITEM-0002', 'Polera Niño', 'Polera con estampado', 'Niño', 15, 30.00, 'S', 'Rojo', 'Textiles SAC', NULL),
('ITEM-0003', 'Vestido Niña', 'Vestido casual', 'Niña', 8, 45.00, '8', 'Rosa', 'Confecciones Lima', NULL),
('ITEM-0004', 'Blusa Dama', 'Blusa elegante', 'Dama', 12, 55.00, 'M', 'Blanco', 'Textiles SAC', NULL),
('ITEM-0005', 'Camisa Caballero', 'Camisa formal', 'Caballero', 20, 65.00, 'L', 'Negro', 'Confecciones Lima', NULL),
('ITEM-0006', 'Llavero Personalizado', 'Llavero con logo', 'Accesorios', 3, 5.00, NULL, 'Plateado', 'Accesorios Plus', 'Stock bajo - reabastecer'),
('ITEM-0007', 'Regla 30cm', 'Regla de plástico', 'Accesorios', 50, 2.50, NULL, 'Transparente', 'Librería Central', NULL),
('ITEM-0008', 'Polo Deportivo', 'Polo dry-fit', 'Unisex', 4, 35.00, 'L', 'Verde', 'Deportes Total', 'Stock bajo'),
('ITEM-0009', 'Short Niño', 'Short deportivo', 'Niño', 18, 28.00, 'M', 'Azul', 'Deportes Total', NULL),
('ITEM-0010', 'Falda Niña', 'Falda escolar', 'Niña', 10, 32.00, '10', 'Azul Marino', 'Uniformes Escolares', NULL);
*/
