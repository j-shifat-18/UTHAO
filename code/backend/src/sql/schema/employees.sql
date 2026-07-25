

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

    -- Constraints
    CONSTRAINT fk_employees_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_employees_branch FOREIGN KEY (branch_id)
        REFERENCES branches(id) ON DELETE SET NULL,
    CONSTRAINT uq_employees_user_id UNIQUE (user_id),
    CONSTRAINT chk_employees_salary CHECK (salary IS NULL OR salary >= 0)
);

-- Indexes
CREATE INDEX idx_employees_branch_id ON employees(branch_id);
CREATE INDEX idx_employees_is_active ON employees(is_active);
