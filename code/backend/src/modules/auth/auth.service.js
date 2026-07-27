const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const authRepo = require('./auth.repository');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
};

const register = async ({ email, password, phone, first_name, last_name }) => {
  // Check if email already exists
  const existing = await authRepo.findUserByEmail(email);
  if (existing) {
    throw ApiError.conflict('Email already registered');
  }

  // Get customer role id
  const roleId = await authRepo.getRoleIdByName('customer');
  if (!roleId) {
    throw ApiError.internal('Customer role not found in database');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, env.bcrypt.saltRounds);

  // Create user + customer in a transaction
  const user = await authRepo.createUserWithCustomer({
    email,
    passwordHash,
    phone: phone || null,
    roleId,
    firstName: first_name,
    lastName: last_name,
  });

  // Generate tokens
  const userWithRole = { id: user.id, email: user.email, role: 'customer' };
  const accessToken = generateAccessToken(userWithRole);
  const refreshToken = generateRefreshToken(userWithRole);

  // Store refresh token
  await authRepo.updateRefreshToken(user.id, refreshToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: 'customer',
      is_active: user.is_active,
      created_at: user.created_at,
    },
    access_token: accessToken,
    refresh_token: refreshToken,
  };
};

const login = async ({ email, password }) => {
  // Find user
  const user = await authRepo.findUserByEmail(email);
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check if active
  if (!user.is_active) {
    throw ApiError.forbidden('Account has been deactivated');
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token and update last login
  await authRepo.updateRefreshToken(user.id, refreshToken);
  await authRepo.updateLastLogin(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      is_active: user.is_active,
    },
    access_token: accessToken,
    refresh_token: refreshToken,
  };
};

const refreshTokens = async (refreshToken) => {
  // Verify the refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  // Find user by stored refresh token
  const user = await authRepo.findUserByRefreshToken(refreshToken);
  if (!user) {
    throw ApiError.unauthorized('Refresh token not recognized');
  }

  if (user.id !== decoded.id) {
    throw ApiError.unauthorized('Token mismatch');
  }

  if (!user.is_active) {
    throw ApiError.forbidden('Account has been deactivated');
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Update stored refresh token
  await authRepo.updateRefreshToken(user.id, newRefreshToken);

  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
  };
};

const logout = async (userId) => {
  await authRepo.clearRefreshToken(userId);
};

const getProfile = async (userId) => {
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
};

module.exports = { register, login, refreshTokens, logout, getProfile };
