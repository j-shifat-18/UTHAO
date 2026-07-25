

CREATE TABLE IF NOT EXISTS parcel_status_history (
    id SERIAL PRIMARY KEY,
    parcel_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    changed_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_status_history_parcel FOREIGN KEY (parcel_id)
        REFERENCES parcels(id) ON DELETE CASCADE,
    CONSTRAINT fk_status_history_user FOREIGN KEY (changed_by)
        REFERENCES users(id) ON DELETE SET NULL,

    -- Check
    CONSTRAINT chk_status_history_status CHECK (
        status IN ('booked', 'picked_up', 'in_transit', 'at_warehouse', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'failed')
    )
);

-- Indexes
CREATE INDEX idx_status_history_parcel ON parcel_status_history(parcel_id);
CREATE INDEX idx_status_history_parcel_time ON parcel_status_history(parcel_id, created_at);
CREATE INDEX idx_status_history_status ON parcel_status_history(status);
