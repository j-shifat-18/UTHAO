const ApiError = require('../../utils/ApiError');
const { query } = require('../../database/query');
const warehousesRepo = require('./warehouses.repository');

const getAllWarehouses = async ({ limit, offset, search, city, branch_id, is_active }) => {
  return warehousesRepo.findAllWarehouses({ limit, offset, search, city, branch_id, is_active });
};

const getWarehouseById = async (id) => {
  const warehouse = await warehousesRepo.findWarehouseById(id);
  if (!warehouse) throw ApiError.notFound('Warehouse not found');
  return warehouse;
};

const createWarehouse = async (data) => {
  return warehousesRepo.createWarehouse(data);
};

const updateWarehouse = async (id, data) => {
  const warehouse = await warehousesRepo.findWarehouseById(id);
  if (!warehouse) throw ApiError.notFound('Warehouse not found');
  return warehousesRepo.updateWarehouse(id, data);
};

const deactivateWarehouse = async (id) => {
  const warehouse = await warehousesRepo.findWarehouseById(id);
  if (!warehouse) throw ApiError.notFound('Warehouse not found');
  if (!warehouse.is_active) throw ApiError.badRequest('Warehouse is already deactivated');
  return warehousesRepo.deactivateWarehouse(id);
};

const getWarehouseOccupancy = async (id) => {
  const occupancy = await warehousesRepo.getWarehouseOccupancy(id);
  if (!occupancy) throw ApiError.notFound('Warehouse not found');
  return occupancy;
};

const initiateTransfer = async (data) => {
  if (data.from_warehouse_id === data.to_warehouse_id) {
    throw ApiError.badRequest('Source and destination warehouse cannot be the same');
  }

  const source = await warehousesRepo.findWarehouseById(data.from_warehouse_id);
  if (!source) throw ApiError.notFound('Source warehouse not found');

  const dest = await warehousesRepo.findWarehouseById(data.to_warehouse_id);
  if (!dest) throw ApiError.notFound('Destination warehouse not found');

  try {
    return await warehousesRepo.initiateTransfer(data);
  } catch (err) {
    if (err.message.includes('full capacity')) {
      throw ApiError.badRequest('Destination warehouse is at full capacity');
    }
    throw err;
  }
};

const completeTransfer = async (transferId) => {
  try {
    return await warehousesRepo.completeTransfer(transferId);
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('not in pending')) {
      throw ApiError.notFound('Transfer not found or already completed');
    }
    if (err.message.includes('full')) {
      throw ApiError.badRequest('Destination warehouse is full');
    }
    throw err;
  }
};

/**
 * Update a warehouse's current_occupancy.
 * - Admins may update any warehouse.
 * - A manager may only update warehouses that belong to a branch where
 *   branches.manager_id matches their own user ID.
 */
const updateOccupancy = async (warehouseId, current_occupancy, requestingUser) => {
  const warehouse = await warehousesRepo.findWarehouseById(warehouseId);
  if (!warehouse) throw ApiError.notFound('Warehouse not found');

  // Admins bypass the branch-ownership check
  if (requestingUser.role !== 'admin') {
    if (!warehouse.branch_id) {
      throw ApiError.forbidden('This warehouse is not linked to any branch');
    }
    // Check that the requesting user is the manager of this warehouse's branch
    const branchResult = await query(
      'SELECT manager_id FROM branches WHERE id = $1',
      [warehouse.branch_id]
    );
    const branch = branchResult.rows[0];
    if (!branch || branch.manager_id !== requestingUser.id) {
      throw ApiError.forbidden('You are only allowed to update occupancy for warehouses in your own branch');
    }
  }

  const value = parseInt(current_occupancy, 10);
  if (isNaN(value) || value < 0) {
    throw ApiError.badRequest('current_occupancy must be a non-negative integer');
  }

  const result = await warehousesRepo.updateOccupancy(warehouseId, value);
  if (!result) {
    throw ApiError.badRequest(
      `Occupancy value ${value} exceeds total capacity of ${warehouse.total_capacity}`
    );
  }
  return result;
};

module.exports = {
  getAllWarehouses, getWarehouseById, createWarehouse, updateWarehouse,
  deactivateWarehouse, getWarehouseOccupancy, updateOccupancy, initiateTransfer, completeTransfer,
};
