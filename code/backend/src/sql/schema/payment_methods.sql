

CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uq_payment_methods_name UNIQUE (name)
);

-- Seed default payment methods
INSERT INTO payment_methods (name) VALUES
    ('cash'),
    ('bkash'),
    ('nagad'),
    ('card'),
    ('bank_transfer')
ON CONFLICT (name) DO NOTHING;
