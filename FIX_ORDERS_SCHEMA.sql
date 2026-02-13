-- 1. Agregar la columna 'phone' a la tabla 'orders' que falta en el schema
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Asegurar que los tipos de datos sean compatibles para el enlace
-- Nota: La tabla quotations usa UUID para id, mientras que orders usa BIGINT.
-- Si queremos enlazar related_order_id en quotations, debemos cambiar su tipo a BIGINT.

DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'quotations' AND column_name = 'related_order_id' AND data_type = 'uuid'
    ) THEN
        -- Cambiar el tipo de UUID a BIGINT
        ALTER TABLE quotations ALTER COLUMN related_order_id TYPE BIGINT USING NULL;
    END IF;
END $$;

-- 3. Recargar el cache del schema (Supabase lo hace automáticamente, pero esto ayuda en algunos casos)
NOTIFY pgrst, 'reload schema';
