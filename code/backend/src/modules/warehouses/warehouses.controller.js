const catchAsync = require('../../utils/catchAsync');
const { success, created } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const warehousesService = require('./warehouses.service');

const getAllWarehouses = catchAsync(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { search, city, branch_id, is_active } = req.query;
  const parsedActive = is_active === 'true' ? true : is_active === 'false' ? false : undefined;
  const parsedBranch = branch_id ? parseInt(branch_id) : undefined;

  const { rows, totalCount } = await warehousesService.getAllWarehouses({
    limit, offset, search, city, branch_id: parsedBranch, is_active: parsedActive,
  });
  return success(res, { message: 'Warehouses fetched', data: rows, meta: buildMeta(page, limit, totalCount) });
});

const getWarehouseById = catchAsync(async (req, res) => {
  const warehouse = await warehousesService.getWarehouseById(parseInt(req.params.id));
  return success(res, { message: 'Warehouse fetched', data: warehouse });
});

const createWarehouse = catchAsync(async (req, res) => {
  const warehouse = await warehousesService.createWarehouse(req.body);
  return created(res, { message: 'Warehouse created', data: warehouse });
});

const updateWarehouse = catchAsync(async (req, res) => {
  const warehouse = await warehousesService.updateWarehouse(parseInt(req.params.id), req.body);
  return success(res, { message: 'Warehouse updated', data: warehouse });
});

const deactivateWarehouse = catchAsync(async (req, res) => {
  const result = await warehousesService.deactivateWarehouse(parseInt(req.params.id));
  return success(res, { message: 'Warehouse deactivated', data: result });
});

const getOccupancy = catchAsync(async (req, res) => {
  const occupancy = await warehousesService.getWarehouseOccupancy(parseInt(req.params.id));
  return success(res, { message: 'Occupancy fetched', data: occupancy });
});

const initiateTransfer = catchAsync(async (req, res) => {
  const transfer = await warehousesService.initiateTransfer({
    ...req.body,
    initiated_by: req.user.id,
  });
  return created(res, { message: 'Transfer initiated', data: transfer });
});

const completeTransfer = catchAsync(async (req, res) => {
  const result = await warehousesService.completeTransfer(parseInt(req.params.transferId));
  return success(res, { message: 'Transfer completed', data: result });
});

module.exports = {
  getAllWarehouses, getWarehouseById, createWarehouse, updateWarehouse,
  deactivateWarehouse, getOccupancy, initiateTransfer, completeTransfer,
};
