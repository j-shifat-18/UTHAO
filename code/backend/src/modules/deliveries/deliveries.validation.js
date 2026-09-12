const VALID_TYPES   = ['pickup', 'delivery'];
const VALID_STATUSES = ['assigned', 'in_progress', 'completed', 'failed', 'reassigned'];

const validateAssignAgent = (body) => {
  const errors = [];

  if (!body.parcel_id) {
    errors.push({ field: 'parcel_id', message: 'Parcel ID is required' });
  }
  if (!body.agent_id) {
    errors.push({ field: 'agent_id', message: 'Agent ID is required' });
  }
  if (!body.assignment_type) {
    errors.push({ field: 'assignment_type', message: 'Assignment type is required' });
  } else if (!VALID_TYPES.includes(body.assignment_type)) {
    errors.push({
      field: 'assignment_type',
      message: `Assignment type must be one of: ${VALID_TYPES.join(', ')}`,
    });
  }

  return errors;
};

const validateReassignAgent = (body) => {
  const errors = [];

  if (!body.agent_id) {
    errors.push({ field: 'agent_id', message: 'New agent ID is required' });
  }

  return errors;
};

const validateCompleteOrFail = (body) => {
  // notes is optional, nothing strictly required
  return [];
};

const validateUpdateNotes = (body) => {
  const errors = [];

  if (body.notes === undefined || body.notes === null || body.notes.trim() === '') {
    errors.push({ field: 'notes', message: 'Notes text is required' });
  }

  return errors;
};

module.exports = {
  validateAssignAgent,
  validateReassignAgent,
  validateCompleteOrFail,
  validateUpdateNotes,
};
