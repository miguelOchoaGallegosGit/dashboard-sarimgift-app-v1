-- Create table for Quotations
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    scheduled_delivery_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'REGISTRADO' CHECK (status IN ('REGISTRADO', 'TERMINADO', 'CANCELADO')),
    related_order_id UUID, -- Optional foreign key to orders table if it exists later
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for Quotation Items
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    product VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    advance_payment DECIMAL(10, 2) DEFAULT 0,
    shipping_cost DECIMAL(10, 2) DEFAULT 0, -- Extra cost added during edit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_quotations_customer_name ON quotations(customer_name);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quotations_updated_at
    BEFORE UPDATE ON quotations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotation_items_updated_at
    BEFORE UPDATE ON quotation_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (Open for now as requested generally, but good practice to have)
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON quotations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users items" ON quotation_items FOR ALL USING (true) WITH CHECK (true);
