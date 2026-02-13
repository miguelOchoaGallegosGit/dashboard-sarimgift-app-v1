-- Migration: Update quotation status names and add rejection_reason field
-- Run this in Supabase SQL Editor

-- Step 1: Add rejection_reason column
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Step 2: Update existing status values
UPDATE quotations SET status = 'ACEPTADO' WHERE status = 'TERMINADO';
UPDATE quotations SET status = 'RECHAZADO' WHERE status = 'CANCELADO';

-- Step 3: Drop old CHECK constraint
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_status_check;

-- Step 4: Add new CHECK constraint with updated status values
ALTER TABLE quotations ADD CONSTRAINT quotations_status_check 
    CHECK (status IN ('REGISTRADO', 'ACEPTADO', 'RECHAZADO'));

-- Step 5: Add index for rejection reason searches (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_quotations_rejection_reason ON quotations(rejection_reason) 
    WHERE rejection_reason IS NOT NULL;

-- Verification: Check updated schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quotations' 
ORDER BY ordinal_position;

-- Verification: Check status distribution
SELECT status, COUNT(*) as count 
FROM quotations 
GROUP BY status;
