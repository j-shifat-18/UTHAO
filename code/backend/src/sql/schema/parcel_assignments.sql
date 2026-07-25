

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

    -- Foreign Keys
    CONSTRAINT fk_assignments_parcel FOREIGN KEY (parcel_id)
        REFERENCES parcels(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_agent FOREIGN KEY (agent_id)
        REFERENCES delivery_agents(id) ON DELETE RESTRICT,
    CONSTRAINT fk_assignments_assigned_by FOREIGN KEY (assigned_by)
        REFERENCES users(id) ON DELETE SET NULL,

    -- Check Constraints
    CONSTRAINT chk_assignments_type CHECK (
        assignment_type IN ('pickup', 'delivery')
    ),
    CONSTRAINT chk_assignments_status CHECK (
        status IN ('assigned', 'in_progress', 'completed', 'failed', 'reassigned')
    )
);

-- Indexes
CREATE INDEX idx_assignments_parcel ON parcel_assignments(parcel_id);
CREATE INDEX idx_assignments_agent ON parcel_assignments(agent_id);
CREATE INDEX idx_assignments_status ON parcel_assignments(status);
CREATE INDEX idx_assignments_agent_status ON parcel_assignments(agent_id, status);

-- Partial unique index: prevent duplicate active assignments
CREATE UNIQUE INDEX uq_assignments_active
    ON parcel_assignments(parcel_id, assignment_type)
    WHERE status = 'assigned';
