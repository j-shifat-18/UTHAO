

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(30) NOT NULL,
    payment_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'issued',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_invoices_payment FOREIGN KEY (payment_id)
        REFERENCES payments(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id)
        REFERENCES customers(id) ON DELETE RESTRICT,

    -- Unique
    CONSTRAINT uq_invoices_number UNIQUE (invoice_number),

    -- Check Constraints
    CONSTRAINT chk_invoices_status CHECK (
        status IN ('issued', 'paid', 'overdue', 'cancelled')
    ),
    CONSTRAINT chk_invoices_amount CHECK (amount >= 0),
    CONSTRAINT chk_invoices_tax CHECK (tax_amount >= 0),
    CONSTRAINT chk_invoices_total CHECK (total_amount >= 0)
);

-- Indexes
CREATE INDEX idx_invoices_payment ON invoices(payment_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
