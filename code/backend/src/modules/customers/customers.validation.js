const validateUpdateCustomer = (body) => {
  const errors = [];
  if (body.gender && !['male', 'female', 'other'].includes(body.gender)) {
    errors.push({ field: 'gender', message: 'Gender must be male, female, or other' });
  }
  if (body.date_of_birth && isNaN(Date.parse(body.date_of_birth))) {
    errors.push({ field: 'date_of_birth', message: 'Invalid date format' });
  }
  return errors;
};

const validateAddress = (body) => {
  const errors = [];
  if (!body.address_line1) errors.push({ field: 'address_line1', message: 'Address line 1 is required' });
  if (!body.city) errors.push({ field: 'city', message: 'City is required' });
  if (!body.state) errors.push({ field: 'state', message: 'State is required' });
  if (!body.postal_code) errors.push({ field: 'postal_code', message: 'Postal code is required' });
  if (body.label && !['home', 'office', 'warehouse', 'branch', 'other'].includes(body.label)) {
    errors.push({ field: 'label', message: 'Invalid label' });
  }
  return errors;
};

module.exports = { validateUpdateCustomer, validateAddress };
