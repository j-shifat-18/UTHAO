
CREATE TABLE IF NOT EXISTS parcel_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_per_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT uq_parcel_categories_name UNIQUE (name),
    CONSTRAINT chk_parcel_categories_base_price CHECK (base_price >= 0),
    CONSTRAINT chk_parcel_categories_price_per_kg CHECK (price_per_kg >= 0)
);

-- Seed default categories
INSERT INTO parcel_categories (name, description, base_price, price_per_kg) VALUES
    ('document', 'Documents and papers', 50.00, 10.00),
    ('small_package', 'Small packages up to 2kg', 80.00, 25.00),
    ('medium_package', 'Medium packages 2-10kg', 120.00, 20.00),
    ('large_package', 'Large packages 10-30kg', 200.00, 15.00),
    ('fragile', 'Fragile items requiring special handling', 150.00, 35.00),
    ('perishable', 'Perishable goods with time constraints', 180.00, 30.00),
    ('electronics', 'Electronic devices', 160.00, 30.00)
ON CONFLICT (name) DO NOTHING;
