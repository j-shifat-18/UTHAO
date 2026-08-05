const ApiError = require('../../utils/ApiError');
const branchesRepo = require('./branches.repository');

const getAllBranches = async ({ limit, offset, search, city, is_active }) => {
  return branchesRepo.findAllBranches({ limit, offset, search, city, is_active });
};

const getBranchById = async (id) => {
  const branch = await branchesRepo.findBranchById(id);
  if (!branch) throw ApiError.notFound('Branch not found');
  return branch;
};

const createBranch = async (data) => {
  return branchesRepo.createBranch(data);
};

const updateBranch = async (id, data) => {
  const branch = await branchesRepo.findBranchById(id);
  if (!branch) throw ApiError.notFound('Branch not found');
  return branchesRepo.updateBranch(id, data);
};

const deleteBranch = async (id) => {
  const branch = await branchesRepo.findBranchById(id);
  if (!branch) throw ApiError.notFound('Branch not found');
  if (!branch.is_active) throw ApiError.badRequest('Branch is already deactivated');
  return branchesRepo.deleteBranch(id);
};

const getBranchStats = async (id) => {
  const branch = await branchesRepo.findBranchById(id);
  if (!branch) throw ApiError.notFound('Branch not found');
  const stats = await branchesRepo.getBranchStats(id);
  return { branch: { id: branch.id, name: branch.name, code: branch.code }, stats };
};

module.exports = { getAllBranches, getBranchById, createBranch, updateBranch, deleteBranch, getBranchStats };
