const validateRegister = (body) => {
  const errors = [];
  if (!body.email) errors.push({ field: 'email', message: 'Email is required' });
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }
  if (!body.password) errors.push({ field: 'password', message: 'Password is required' });
  if (body.password && body.password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
  }
  if (!body.first_name) errors.push({ field: 'first_name', message: 'First name is required' });
  if (!body.last_name) errors.push({ field: 'last_name', message: 'Last name is required' });

  const phone = body.phone.replace(/[\s-]/g, '');
  if (body.phone && !/^\+?[1-9]\d{9,14}$/.test(phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone format' });
  }
  // if (body.phone && !/^\+?[\d\s-]{10,20}$/.test(body.phone)) {
  //   errors.push({ field: 'phone', message: 'Invalid phone format' });
  // }
  return errors;
};

const validateLogin = (body) => {
  const errors = [];
  if (!body.email) errors.push({ field: 'email', message: 'Email is required' });
  if (!body.password) errors.push({ field: 'password', message: 'Password is required' });
  return errors;
};

const validateRefreshToken = (body) => {
  const errors = [];
  if (!body.refresh_token) errors.push({ field: 'refresh_token', message: 'Refresh token is required' });
  return errors;
};

module.exports = { validateRegister, validateLogin, validateRefreshToken };
