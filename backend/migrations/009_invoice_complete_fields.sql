-- Invoice complete fields
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='payment_terms') THEN
        ALTER TABLE invoices ADD COLUMN payment_terms TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='po_number') THEN
        ALTER TABLE invoices ADD COLUMN po_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='project_id') THEN
        ALTER TABLE invoices ADD COLUMN project_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='tags') THEN
        ALTER TABLE invoices ADD COLUMN tags TEXT;
    END IF;
END $$;
