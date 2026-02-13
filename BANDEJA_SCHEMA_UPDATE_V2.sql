-- Add new columns for the updated Bandeja requirements

-- Update external_orders table
ALTER TABLE external_orders 
ADD COLUMN IF NOT EXISTS scheduled_delivery_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS order_date TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update external_order_items table
ALTER TABLE external_order_items 
ADD COLUMN IF NOT EXISTS advance_payment DECIMAL(10, 2) DEFAULT 0;

-- Optional: You might want to remove the old columns if they are no longer used, 
-- but it is safer to keep them for now or drop them later.
-- ALLOWED TO BE NULL: delivery_address, district, additional_details 
-- (You may need to alter them to drop NOT NULL constraints if they had them, 
-- but based on previous schema they were nullable or text).

-- Ensure constraints allow nulls for fields we are removing from the UI but keeping in DB
ALTER TABLE external_orders ALTER COLUMN delivery_address DROP NOT NULL;
ALTER TABLE external_orders ALTER COLUMN district DROP NOT NULL;
ALTER TABLE external_orders ALTER COLUMN additional_details DROP NOT NULL;

-- Ensure created_at is default now() if not already (it should be)
