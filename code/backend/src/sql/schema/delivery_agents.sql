

CREATE TABLE IF NOT EXISTS delivery_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    branch_id INT,
    vehicle_type VARCHAR(30),
    vehicle_plate_number VARCHAR(30),
    license_number VARCHAR(50),
    is_available BOOLEAN NOT NULL DEFAULT true,
    current_zone VARCHAR(100),
    max_parcels_per_day INT NOT NULL DEFAULT 20,
    rating DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    total_deliveries INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT fk_delivery_agents_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_delivery_agents_branch FOREIGN KEY (branch_id)
        REFERENCES branches(id) ON DELETE SET NULL,
    CONSTRAINT uq_delivery_agents_user_id UNIQUE (user_id),
    CONSTRAINT chk_delivery_agents_vehicle CHECK (
        vehicle_type IN ('bike', 'motorcycle', 'van', 'truck')
    ),
    CONSTRAINT chk_delivery_agents_max_parcels CHECK (max_parcels_per_day > 0),
    CONSTRAINT chk_delivery_agents_rating CHECK (rating >= 0 AND rating <= 5)
);

-- Indexes
CREATE INDEX idx_delivery_agents_branch_id ON delivery_agents(branch_id);
CREATE INDEX idx_delivery_agents_is_available ON delivery_agents(is_available);
CREATE INDEX idx_delivery_agents_current_zone ON delivery_agents(current_zone);
CREATE INDEX idx_delivery_agents_available_branch ON delivery_agents(is_available, branch_id);
CREATE INDEX idx_delivery_agents_is_active ON delivery_agents(is_active);
