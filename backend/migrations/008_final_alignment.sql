-- Final alignment
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='tax_rate') THEN
        ALTER TABLE invoices ADD COLUMN tax_rate REAL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='tax_amount') THEN
        ALTER TABLE invoices ADD COLUMN tax_amount REAL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='subtotal') THEN
        ALTER TABLE invoices ADD COLUMN subtotal REAL DEFAULT 0;
    END IF;
END $$;
