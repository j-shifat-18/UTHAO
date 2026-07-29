const ApiError = require('../../utils/ApiError');
const usersRepo = require('./users.repository');

const getAllUsers = async ({ limit, offset, search, role, is_active }) => {
  return usersRepo.findAllUsers({ limit, offset, search, role, is_active });
};

const getUserById = async (id) => {
  const user = await usersRepo.findUserById(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const updateUser = async (id, data) => {
  const user = await usersRepo.findUserById(id);
  if (!user) throw ApiError.notFound('User not found');

  const updated = await usersRepo.updateUser(id, data);
  return updated;
};

const deactivateUser = async (id) => {
  const user = await usersRepo.findUserById(id);
  if (!user) throw ApiError.notFound('User not found');
  if (!user.is_active) throw ApiError.badRequest('User is already deactivated');

  return usersRepo.deactivateUser(id);
};

const activateUser = async (id) => {
  const user = await usersRepo.findUserById(id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.is_active) throw ApiError.badRequest('User is already active');

  return usersRepo.activateUser(id);
};

module.exports = { getAllUsers, getUserById, updateUser, deactivateUser, activateUser };
