-- ============================================
-- Actualización de Políticas RLS para soporte de Autenticación
-- ============================================

-- Primero, eliminar las políticas existentes si las hay
DROP POLICY IF EXISTS "Enable all operations for external_orders" ON external_orders;
DROP POLICY IF EXISTS "Enable all operations for external_order_items" ON external_order_items;

-- Crear nuevas políticas RLS basadas en el usuario autenticado
-- Reemplaza 'USER_UID_AQUI' con el UID real del usuario si quieres restringir a un usuario específico
-- También puedes usar auth.uid() para permitir a todos los usuarios autenticados

-- Políticas para external_orders (Bandeja)
CREATE POLICY "Only specific user can access external_orders" 
    ON external_orders FOR ALL 
    USING (auth.uid() = '4e138e65-9a7b-49c8-a4cd-23f6572513a'::uuid) 
    WITH CHECK (auth.uid() = '4e138e65-9a7b-49c8-a4cd-23f6572513a'::uuid);

CREATE POLICY "Only specific user can access external_order_items" 
    ON external_order_items FOR ALL 
    USING (auth.uid() = '4e138e65-9a7b-49c8-a4cd-23f6572513a'::uuid) 
    WITH CHECK (auth.uid() = '4e138e65-9a7b-49c8-a4cd-23f6572513a'::uuid);

-- Si quieres permitir a TODOS los usuarios autenticados (no solo uno específico),
-- comenta las políticas anteriores y descomenta las siguientes:

/*
CREATE POLICY "Authenticated users can access external_orders" 
    ON external_orders FOR ALL 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access external_order_items" 
    ON external_order_items FOR ALL 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');
*/

COMMIT;
