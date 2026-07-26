BEGIN;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- 1. ROLES

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
    ('admin', 'System administrator with full access'),
    ('manager', 'Branch/warehouse manager'),
    ('branch_employee', 'Employee working at a branch'),
    ('delivery_agent', 'Delivery personnel'),
    ('customer', 'Registered customer')
ON CONFLICT (name) DO NOTHING;


-- 2. USERS

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role_id INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMPTZ,
    refresh_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_users_role FOREIGN KEY (role_id)
        REFERENCES roles(id) ON DELETE RESTRICT,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_phone UNIQUE (phone),
    CONSTRAINT chk_users_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);


-- 3. CUSTOMERS

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    profile_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_customers_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_customers_user_id UNIQUE (user_id),
    CONSTRAINT chk_customers_gender CHECK (gender IN ('male', 'female', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(first_name, last_name);


-- 4. ADDRESSES

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

    CONSTRAINT chk_addresses_entity_type CHECK (entity_type IN ('customer', 'branch', 'warehouse')),
    CONSTRAINT chk_addresses_label CHECK (label IN ('home', 'office', 'warehouse', 'branch', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_addresses_entity ON addresses(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_addresses_city ON addresses(city);
CREATE INDEX IF NOT EXISTS idx_addresses_postal_code ON addresses(postal_code);


-- 5. BRANCHES

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

    CONSTRAINT fk_branches_manager FOREIGN KEY (manager_id)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_branches_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_branches_city ON branches(city);
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON branches(is_active);
CREATE INDEX IF NOT EXISTS idx_branches_manager_id ON branches(manager_id);


-- 6. WAREHOUSES

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

    CONSTRAINT fk_warehouses_branch FOREIGN KEY (branch_id)
        REFERENCES branches(id) ON DELETE SET NULL,
    CONSTRAINT uq_warehouses_code UNIQUE (code),
    CONSTRAINT chk_warehouses_capacity CHECK (total_capacity > 0),
    CONSTRAINT chk_warehouses_occupancy CHECK (current_occupancy >= 0),
    CONSTRAINT chk_warehouses_occupancy_limit CHECK (current_occupancy <= total_capacity)
);

CREATE INDEX IF NOT EXISTS idx_warehouses_branch_id ON warehouses(branch_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_city ON warehouses(city);
CREATE INDEX IF NOT EXISTS idx_warehouses_is_active ON warehouses(is_active);


-- 7. EMPLOYEES

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    branch_id INT,
    position VARCHAR(100),
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    salary DECIMAL(12, 2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_employees_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_employees_branch FOREIGN KEY (branch_id)
        REFERENCES branches(id) ON DELETE SET NULL,
    CONSTRAINT uq_employees_user_id UNIQUE (user_id),
    CONSTRAINT chk_employees_salary CHECK (salary IS NULL OR salary >= 0)
);

CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);


-- 8. DELIVERY AGENTS

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

CREATE INDEX IF NOT EXISTS idx_delivery_agents_branch_id ON delivery_agents(branch_id);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_is_available ON delivery_agents(is_available);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_current_zone ON delivery_agents(current_zone);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_available_branch ON delivery_agents(is_available, branch_id);
CREATE INDEX IF NOT EXISTS idx_delivery_agents_is_active ON delivery_agents(is_active);


-- 9. PARCEL CATEGORIES

CREATE TABLE IF NOT EXISTS parcel_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_per_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_parcel_categories_name UNIQUE (name),
    CONSTRAINT chk_parcel_categories_base_price CHECK (base_price >= 0),
    CONSTRAINT chk_parcel_categories_price_per_kg CHECK (price_per_kg >= 0)
);

INSERT INTO parcel_categories (name, description, base_price, price_per_kg) VALUES
    ('document', 'Documents and papers', 50.00, 10.00),
    ('small_package', 'Small packages up to 2kg', 80.00, 25.00),
    ('medium_package', 'Medium packages 2-10kg', 120.00, 20.00),
    ('large_package', 'Large packages 10-30kg', 200.00, 15.00),
    ('fragile', 'Fragile items requiring special handling', 150.00, 35.00),
    ('perishable', 'Perishable goods with time constraints', 180.00, 30.00),
    ('electronics', 'Electronic devices', 160.00, 30.00)
ON CONFLICT (name) DO NOTHING;


-- 10. PARCELS

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
    CONSTRAINT uq_parcels_tracking_number UNIQUE (tracking_number),
    CONSTRAINT chk_parcels_weight CHECK (weight_kg > 0),
    CONSTRAINT chk_parcels_delivery_cost CHECK (delivery_cost >= 0),
    CONSTRAINT chk_parcels_status CHECK (
        status IN ('booked', 'picked_up', 'in_transit', 'at_warehouse', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'failed')
    ),
    CONSTRAINT chk_parcels_priority CHECK (priority IN ('standard', 'express', 'overnight')),
    CONSTRAINT chk_parcels_payment_method CHECK (payment_method IN ('prepaid', 'cod'))
);

CREATE INDEX IF NOT EXISTS idx_parcels_sender ON parcels(sender_customer_id);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
CREATE INDEX IF NOT EXISTS idx_parcels_origin_branch ON parcels(origin_branch_id);
CREATE INDEX IF NOT EXISTS idx_parcels_destination_branch ON parcels(destination_branch_id);
CREATE INDEX IF NOT EXISTS idx_parcels_warehouse ON parcels(current_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_parcels_delivery_city ON parcels(delivery_city);
CREATE INDEX IF NOT EXISTS idx_parcels_created_at ON parcels(created_at);
CREATE INDEX IF NOT EXISTS idx_parcels_status_created ON parcels(status, created_at);
CREATE INDEX IF NOT EXISTS idx_parcels_sender_status ON parcels(sender_customer_id, status);
CREATE INDEX IF NOT EXISTS idx_parcels_tracking ON parcels(tracking_number);


-- 11. PARCEL STATUS HISTORY

CREATE TABLE IF NOT EXISTS parcel_status_history (
    id SERIAL PRIMARY KEY,
    parcel_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    changed_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_status_history_parcel FOREIGN KEY (parcel_id)
        REFERENCES parcels(id) ON DELETE CASCADE,
    CONSTRAINT fk_status_history_user FOREIGN KEY (changed_by)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_status_history_status CHECK (
        status IN ('booked', 'picked_up', 'in_transit', 'at_warehouse', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'failed')
    )
);

CREATE INDEX IF NOT EXISTS idx_status_history_parcel ON parcel_status_history(parcel_id);
CREATE INDEX IF NOT EXISTS idx_status_history_parcel_time ON parcel_status_history(parcel_id, created_at);
CREATE INDEX IF NOT EXISTS idx_status_history_status ON parcel_status_history(status);


-- 12. PARCEL ASSIGNMENTS

CREATE TABLE IF NOT EXISTS parcel_assignments (
    id SERIAL PRIMARY KEY,
    parcel_id UUID NOT NULL,
    agent_id UUID NOT NULL,
    assignment_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    assigned_by UUID,

    CONSTRAINT fk_assignments_parcel FOREIGN KEY (parcel_id)
        REFERENCES parcels(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_agent FOREIGN KEY (agent_id)
        REFERENCES delivery_agents(id) ON DELETE RESTRICT,
    CONSTRAINT fk_assignments_assigned_by FOREIGN KEY (assigned_by)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_assignments_type CHECK (assignment_type IN ('pickup', 'delivery')),
    CONSTRAINT chk_assignments_status CHECK (
        status IN ('assigned', 'in_progress', 'completed', 'failed', 'reassigned')
    )
);

CREATE INDEX IF NOT EXISTS idx_assignments_parcel ON parcel_assignments(parcel_id);
CREATE INDEX IF NOT EXISTS idx_assignments_agent ON parcel_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON parcel_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_agent_status ON parcel_assignments(agent_id, status);

-- Partial unique: prevent duplicate active assignments for same parcel+type
CREATE UNIQUE INDEX IF NOT EXISTS uq_assignments_active
    ON parcel_assignments(parcel_id, assignment_type)
    WHERE status = 'assigned';


-- 13. WAREHOUSE TRANSFERS

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

    CONSTRAINT fk_transfers_parcel FOREIGN KEY (parcel_id)
        REFERENCES parcels(id) ON DELETE CASCADE,
    CONSTRAINT fk_transfers_from_warehouse FOREIGN KEY (from_warehouse_id)
        REFERENCES warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfers_to_warehouse FOREIGN KEY (to_warehouse_id)
        REFERENCES warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transfers_initiated_by FOREIGN KEY (initiated_by)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_transfers_different_warehouses CHECK (from_warehouse_id != to_warehouse_id),
    CONSTRAINT chk_transfers_status CHECK (
        status IN ('pending', 'in_transit', 'completed', 'cancelled')
    )
);

CREATE INDEX IF NOT EXISTS idx_transfers_parcel ON warehouse_transfers(parcel_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_warehouse ON warehouse_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_warehouse ON warehouse_transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON warehouse_transfers(status);


-- 14. PAYMENT METHODS

CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_payment_methods_name UNIQUE (name)
);

INSERT INTO payment_methods (name) VALUES
    ('cash'), ('bkash'), ('nagad'), ('card'), ('bank_transfer')
ON CONFLICT (name) DO NOTHING;


-- 15. PAYMENTS

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

    CONSTRAINT fk_payments_parcel FOREIGN KEY (parcel_id)
        REFERENCES parcels(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id)
        REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payments_method FOREIGN KEY (payment_method_id)
        REFERENCES payment_methods(id) ON DELETE RESTRICT,
    CONSTRAINT uq_payments_transaction_id UNIQUE (transaction_id),
    CONSTRAINT chk_payments_amount CHECK (amount > 0),
    CONSTRAINT chk_payments_status CHECK (
        status IN ('pending', 'completed', 'failed', 'refunded')
    )
);

CREATE INDEX IF NOT EXISTS idx_payments_parcel ON payments(parcel_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_customer_status ON payments(customer_id, status);


-- 16. INVOICES

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

    CONSTRAINT fk_invoices_payment FOREIGN KEY (payment_id)
        REFERENCES payments(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id)
        REFERENCES customers(id) ON DELETE RESTRICT,
    CONSTRAINT uq_invoices_number UNIQUE (invoice_number),
    CONSTRAINT chk_invoices_status CHECK (status IN ('issued', 'paid', 'overdue', 'cancelled')),
    CONSTRAINT chk_invoices_amount CHECK (amount >= 0),
    CONSTRAINT chk_invoices_tax CHECK (tax_amount >= 0),
    CONSTRAINT chk_invoices_total CHECK (total_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_invoices_payment ON invoices(payment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);


-- 17. NOTIFICATIONS

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'info',
    reference_type VARCHAR(30),
    reference_id VARCHAR(100),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_notifications_type CHECK (type IN ('info', 'warning', 'success', 'error'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);


-- 18. AUDIT LOGS

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_old_values ON audit_logs USING GIN (old_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_new_values ON audit_logs USING GIN (new_values);


-- TRIGGER: Auto-update updated_at timestamp

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_branches_updated_at
    BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_warehouses_updated_at
    BEFORE UPDATE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_delivery_agents_updated_at
    BEFORE UPDATE ON delivery_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_parcels_updated_at
    BEFORE UPDATE ON parcels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
