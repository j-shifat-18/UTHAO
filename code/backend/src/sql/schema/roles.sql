
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default roles
INSERT INTO roles (name, description) VALUES
    ('admin', 'System administrator with full access'),
    ('manager', 'Branch/warehouse manager'),
    ('branch_employee', 'Employee working at a branch'),
    ('delivery_agent', 'Delivery personnel'),
    ('customer', 'Registered customer')
ON CONFLICT (name) DO NOTHING;
