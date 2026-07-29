const catchAsync = require('../../utils/catchAsync');
const { success } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const usersService = require('./users.service');

const getAllUsers = catchAsync(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { search, role, is_active } = req.query;

  const parsedActive = is_active === 'true' ? true : is_active === 'false' ? false : undefined;

  const { rows, totalCount } = await usersService.getAllUsers({
    limit,
    offset,
    search,
    role,
    is_active: parsedActive,
  });

  return success(res, {
    message: 'Users fetched',
    data: rows,
    meta: buildMeta(page, limit, totalCount),
  });
});

const getUserById = catchAsync(async (req, res) => {
  const user = await usersService.getUserById(req.params.id);
  return success(res, { message: 'User fetched', data: user });
});

const updateUser = catchAsync(async (req, res) => {
  const updated = await usersService.updateUser(req.params.id, req.body);
  return success(res, { message: 'User updated', data: updated });
});

const deactivateUser = catchAsync(async (req, res) => {
  const result = await usersService.deactivateUser(req.params.id);
  return success(res, { message: 'User deactivated', data: result });
});

const activateUser = catchAsync(async (req, res) => {
  const result = await usersService.activateUser(req.params.id);
  return success(res, { message: 'User activated', data: result });
});

module.exports = { getAllUsers, getUserById, updateUser, deactivateUser, activateUser };
