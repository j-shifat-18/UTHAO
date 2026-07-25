

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    opening_time TIME,
    closing_time TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT fk_branches_manager FOREIGN KEY (manager_id)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_branches_code UNIQUE (code)
);

-- Indexes
CREATE INDEX idx_branches_city ON branches(city);
CREATE INDEX idx_branches_is_active ON branches(is_active);
CREATE INDEX idx_branches_manager_id ON branches(manager_id);
