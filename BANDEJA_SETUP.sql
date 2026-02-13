-- ============================================
-- Script para crear las tablas de Bandeja de Pedidos Externos
-- ============================================

-- Tabla principal de pedidos externos
CREATE TABLE IF NOT EXISTS external_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    delivery_address TEXT,
    district VARCHAR(100),
    additional_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de items de pedidos externos
CREATE TABLE IF NOT EXISTS external_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES external_orders(id) ON DELETE CASCADE,
    product VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
    shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_external_orders_customer_name ON external_orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_external_orders_phone ON external_orders(phone);
CREATE INDEX IF NOT EXISTS idx_external_orders_district ON external_orders(district);
CREATE INDEX IF NOT EXISTS idx_external_orders_created_at ON external_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_order_items_order_id ON external_order_items(order_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_external_orders_updated_at
    BEFORE UPDATE ON external_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_order_items_updated_at
    BEFORE UPDATE ON external_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE external_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_order_items ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS (ajustar según tus necesidades de autenticación)
-- Por ahora, permitir todas las operaciones (puedes modificar esto más adelante)
CREATE POLICY "Enable all operations for external_orders" 
    ON external_orders FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all operations for external_order_items" 
    ON external_order_items FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON TABLE external_orders IS 'Tabla de pedidos externos recibidos desde otras webs';
COMMENT ON TABLE external_order_items IS 'Items/productos de cada pedido externo';

-- Datos de ejemplo (opcional, puedes eliminar esta sección si no los necesitas)
INSERT INTO external_orders (order_number, customer_name, phone, delivery_address, district, additional_details)
VALUES 
    ('ORD-EXT-0001', 'Carlos Rodriguez', '987 654 321', 'Av. Los Laureles 123', 'Miraflores', 'Entrega en horario de oficina'),
    ('ORD-EXT-0002', 'María Gonzales', '912 345 678', 'Calle Los Pinos 456', 'San Isidro', NULL),
    ('ORD-EXT-0003', 'Juan Jose Perez', '998 112 234', 'Jr. Las Flores 789', 'Surco', 'Llamar antes de entregar'),
    ('ORD-EXT-0004', 'Elena Vasquez', '954 143 221', 'Av. Principal 321', 'Lima', 'Dejar con portería'),
    ('ORD-EXT-0005', 'Dany Paredes', '933 221 100', 'Calle Central 654', 'Miraflores', NULL);

-- Items para el primer pedido
INSERT INTO external_order_items (order_id, product, quantity, unit_price, shipping_cost)
SELECT id, 'Cámara Mirrorless 4K Pro', 1, 1250.00, 25.00
FROM external_orders WHERE order_number = 'ORD-EXT-0001'
UNION ALL
SELECT id, 'Lente 35mm f/1.4 Art', 2, 899.00, 0.00
FROM external_orders WHERE order_number = 'ORD-EXT-0001';

-- Items para el segundo pedido
INSERT INTO external_order_items (order_id, product, quantity, unit_price, shipping_cost)
SELECT id, 'Taza Personalizada Premium', 5, 25.00, 15.00
FROM external_orders WHERE order_number = 'ORD-EXT-0002';

-- Items para el tercer pedido
INSERT INTO external_order_items (order_id, product, quantity, unit_price, shipping_cost)
SELECT id, 'Kit de Bolígrafos Corporativos', 3, 45.00, 10.00
FROM external_orders WHERE order_number = 'ORD-EXT-0003'
UNION ALL
SELECT id, 'Agenda Ejecutiva 2026', 2, 65.00, 5.00
FROM external_orders WHERE order_number = 'ORD-EXT-0003';

-- Items para el cuarto pedido
INSERT INTO external_order_items (order_id, product, quantity, unit_price, shipping_cost)
SELECT id, 'Mouse Inalámbrico', 1, 80.00, 8.00
FROM external_orders WHERE order_number = 'ORD-EXT-0004'
UNION ALL
SELECT id, 'Teclado Mecánico RGB', 1, 250.00, 12.00
FROM external_orders WHERE order_number = 'ORD-EXT-0004';

-- Items para el quinto pedido
INSERT INTO external_order_items (order_id, product, quantity, unit_price, shipping_cost)
SELECT id, 'Set de Vasos Publicitarios', 10, 18.00, 20.00
FROM external_orders WHERE order_number = 'ORD-EXT-0005';

COMMIT;
