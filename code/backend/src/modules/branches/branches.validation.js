const validateCreateBranch = (body) => {
  const errors = [];
  if (!body.name) errors.push({ field: 'name', message: 'Branch name is required' });
  if (!body.code) errors.push({ field: 'code', message: 'Branch code is required' });
  if (!body.city) errors.push({ field: 'city', message: 'City is required' });
  if (!body.state) errors.push({ field: 'state', message: 'State is required' });
  if (!body.address) errors.push({ field: 'address', message: 'Address is required' });
  return errors;
};

const validateUpdateBranch = (body) => {
  const errors = [];
  if (body.code && body.code.length > 20) {
    errors.push({ field: 'code', message: 'Code must be 20 characters or less' });
  }
  return errors;
};

module.exports = { validateCreateBranch, validateUpdateBranch };
