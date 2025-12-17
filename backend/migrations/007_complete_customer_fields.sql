-- Complete customer fields
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='pan_number') THEN
        ALTER TABLE customers ADD COLUMN pan_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='gst_number') THEN
        ALTER TABLE customers ADD COLUMN gst_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='credit_limit') THEN
        ALTER TABLE customers ADD COLUMN credit_limit REAL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='payment_terms') THEN
        ALTER TABLE customers ADD COLUMN payment_terms INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='notes') THEN
        ALTER TABLE customers ADD COLUMN notes TEXT;
    END IF;
END $$;
