

CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL,
    entity_id UUID NOT NULL,
    label VARCHAR(50) NOT NULL DEFAULT 'home',
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Bangladesh',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_addresses_entity_type CHECK (entity_type IN ('customer', 'branch', 'warehouse')),
    CONSTRAINT chk_addresses_label CHECK (label IN ('home', 'office', 'warehouse', 'branch', 'other'))
);

-- Indexes
CREATE INDEX idx_addresses_entity ON addresses(entity_type, entity_id);
CREATE INDEX idx_addresses_city ON addresses(city);
CREATE INDEX idx_addresses_postal_code ON addresses(postal_code);
