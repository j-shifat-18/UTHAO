const catchAsync = require('../../utils/catchAsync');
const { success, created } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const branchesService = require('./branches.service');

const getAllBranches = catchAsync(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { search, city, is_active } = req.query;
  const parsedActive = is_active === 'true' ? true : is_active === 'false' ? false : undefined;

  const { rows, totalCount } = await branchesService.getAllBranches({ limit, offset, search, city, is_active: parsedActive });
  return success(res, { message: 'Branches fetched', data: rows, meta: buildMeta(page, limit, totalCount) });
});

const getBranchById = catchAsync(async (req, res) => {
  const branch = await branchesService.getBranchById(parseInt(req.params.id));
  return success(res, { message: 'Branch fetched', data: branch });
});

const createBranch = catchAsync(async (req, res) => {
  const branch = await branchesService.createBranch(req.body);
  return created(res, { message: 'Branch created', data: branch });
});

const updateBranch = catchAsync(async (req, res) => {
  const branch = await branchesService.updateBranch(parseInt(req.params.id), req.body);
  return success(res, { message: 'Branch updated', data: branch });
});

const deleteBranch = catchAsync(async (req, res) => {
  const result = await branchesService.deleteBranch(parseInt(req.params.id));
  return success(res, { message: 'Branch deactivated', data: result });
});

const getBranchStats = catchAsync(async (req, res) => {
  const stats = await branchesService.getBranchStats(parseInt(req.params.id));
  return success(res, { message: 'Branch stats fetched', data: stats });
});

module.exports = { getAllBranches, getBranchById, createBranch, updateBranch, deleteBranch, getBranchStats };
