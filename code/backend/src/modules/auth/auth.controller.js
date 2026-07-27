const catchAsync = require('../../utils/catchAsync');
const { success, created } = require('../../utils/response');
const authService = require('./auth.service');

const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  return created(res, { message: 'Registration successful', data: result });
});

const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  return success(res, { message: 'Login successful', data: result });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refresh_token } = req.body;
  const result = await authService.refreshTokens(refresh_token);
  return success(res, { message: 'Tokens refreshed', data: result });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.user.id);
  return success(res, { message: 'Logged out successfully' });
});

const getProfile = catchAsync(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  return success(res, { message: 'Profile fetched', data: user });
});

module.exports = { register, login, refreshToken, logout, getProfile };
