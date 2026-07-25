

CREATE TABLE IF NOT EXISTS parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number VARCHAR(30) NOT NULL,
    sender_customer_id UUID NOT NULL,
    receiver_name VARCHAR(200) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    receiver_email VARCHAR(255),
    pickup_address_id INT,
    delivery_address_line1 VARCHAR(255) NOT NULL,
    delivery_address_line2 VARCHAR(255),
    delivery_city VARCHAR(100) NOT NULL,
    delivery_state VARCHAR(100) NOT NULL,
    delivery_postal_code VARCHAR(20) NOT NULL,
    origin_branch_id INT,
    destination_branch_id INT,
    current_warehouse_id INT,
    category_id INT NOT NULL,
    weight_kg DECIMAL(8, 2) NOT NULL,
    dimensions_cm VARCHAR(50),
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'booked',
    priority VARCHAR(20) NOT NULL DEFAULT 'standard',
    is_fragile BOOLEAN NOT NULL DEFAULT false,
    delivery_instructions TEXT,
    estimated_delivery_date DATE,
    actual_delivery_date TIMESTAMPTZ,
    delivery_cost DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'prepaid',
    is_paid BOOLEAN NOT NULL DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_parcels_sender FOREIGN KEY (sender_customer_id)
        REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_parcels_pickup_address FOREIGN KEY (pickup_address_id)
        REFERENCES addresses(id) ON DELETE SET NULL,
    CONSTRAINT fk_parcels_origin_branch FOREIGN KEY (origin_branch_id)
        REFERENCES branches(id) ON DELETE SET NULL,
    CONSTRAINT fk_parcels_destination_branch FOREIGN KEY (destination_branch_id)
        REFERENCES branches(id) ON DELETE SET NULL,
    CONSTRAINT fk_parcels_warehouse FOREIGN KEY (current_warehouse_id)
        REFERENCES warehouses(id) ON DELETE SET NULL,
    CONSTRAINT fk_parcels_category FOREIGN KEY (category_id)
        REFERENCES parcel_categories(id) ON DELETE RESTRICT,

    -- Unique
    CONSTRAINT uq_parcels_tracking_number UNIQUE (tracking_number),

    -- Check Constraints
    CONSTRAINT chk_parcels_weight CHECK (weight_kg > 0),
    CONSTRAINT chk_parcels_delivery_cost CHECK (delivery_cost >= 0),
    CONSTRAINT chk_parcels_status CHECK (
        status IN ('booked', 'picked_up', 'in_transit', 'at_warehouse', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'failed')
    ),
    CONSTRAINT chk_parcels_priority CHECK (
        priority IN ('standard', 'express', 'overnight')
    ),
    CONSTRAINT chk_parcels_payment_method CHECK (
        payment_method IN ('prepaid', 'cod')
    )
);

-- Indexes
CREATE INDEX idx_parcels_sender ON parcels(sender_customer_id);
CREATE INDEX idx_parcels_status ON parcels(status);
CREATE INDEX idx_parcels_origin_branch ON parcels(origin_branch_id);
CREATE INDEX idx_parcels_destination_branch ON parcels(destination_branch_id);
CREATE INDEX idx_parcels_warehouse ON parcels(current_warehouse_id);
CREATE INDEX idx_parcels_delivery_city ON parcels(delivery_city);
CREATE INDEX idx_parcels_created_at ON parcels(created_at);
CREATE INDEX idx_parcels_status_created ON parcels(status, created_at);
CREATE INDEX idx_parcels_sender_status ON parcels(sender_customer_id, status);
CREATE INDEX idx_parcels_tracking ON parcels(tracking_number);
