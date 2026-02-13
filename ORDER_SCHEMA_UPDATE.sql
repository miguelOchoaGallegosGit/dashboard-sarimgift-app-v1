-- Add phone column to orders table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'phone') THEN
        ALTER TABLE orders ADD COLUMN phone VARCHAR(255);
    END IF;
END $$;
