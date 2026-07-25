

CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) NOT NULL,
    branch_id INT,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    total_capacity INT NOT NULL,
    current_occupancy INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT fk_warehouses_branch FOREIGN KEY (branch_id)
        REFERENCES branches(id) ON DELETE SET NULL,
    CONSTRAINT uq_warehouses_code UNIQUE (code),
    CONSTRAINT chk_warehouses_capacity CHECK (total_capacity > 0),
    CONSTRAINT chk_warehouses_occupancy CHECK (current_occupancy >= 0),
    CONSTRAINT chk_warehouses_occupancy_limit CHECK (current_occupancy <= total_capacity)
);

-- Indexes
CREATE INDEX idx_warehouses_branch_id ON warehouses(branch_id);
CREATE INDEX idx_warehouses_city ON warehouses(city);
CREATE INDEX idx_warehouses_is_active ON warehouses(is_active);
