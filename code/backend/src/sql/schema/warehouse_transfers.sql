

CREATE TABLE IF NOT EXISTS warehouse_transfers (
    id SERIAL PRIMARY KEY,
    parcel_id UUID NOT NULL,
    from_warehouse_id INT NOT NULL,
    to_warehouse_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    initiated_by UUID,
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notes TEXT,

    -- Foreign Keys
    CONSTRAINT fk_transfers_parcel FOREIGN KEY (parcel_id)
        REFERENCES parcels(id) ON DELETE CASCADE,
    CONSTRAINT fk_transfers_from_warehouse FOREIGN KEY (from_warehouse_id)
        REFERENCES warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfers_to_warehouse FOREIGN KEY (to_warehouse_id)
        REFERENCES warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfers_initiated_by FOREIGN KEY (initiated_by)
        REFERENCES users(id) ON DELETE SET NULL,

    -- Check Constraints
    CONSTRAINT chk_transfers_different_warehouses CHECK (from_warehouse_id != to_warehouse_id),
    CONSTRAINT chk_transfers_status CHECK (
        status IN ('pending', 'in_transit', 'completed', 'cancelled')
    )
);

-- Indexes
CREATE INDEX idx_transfers_parcel ON warehouse_transfers(parcel_id);
CREATE INDEX idx_transfers_from_warehouse ON warehouse_transfers(from_warehouse_id);
CREATE INDEX idx_transfers_to_warehouse ON warehouse_transfers(to_warehouse_id);
CREATE INDEX idx_transfers_status ON warehouse_transfers(status);
