

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method_id INT NOT NULL,
    transaction_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_payments_parcel FOREIGN KEY (parcel_id)
        REFERENCES parcels(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id)
        REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_method FOREIGN KEY (payment_method_id)
        REFERENCES payment_methods(id) ON DELETE RESTRICT,

    -- Unique
    CONSTRAINT uq_payments_transaction_id UNIQUE (transaction_id),

    -- Check Constraints
    CONSTRAINT chk_payments_amount CHECK (amount > 0),
    CONSTRAINT chk_payments_status CHECK (
        status IN ('pending', 'completed', 'failed', 'refunded')
    )
);

-- Indexes
CREATE INDEX idx_payments_parcel ON payments(parcel_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);
CREATE INDEX idx_payments_customer_status ON payments(customer_id, status);
