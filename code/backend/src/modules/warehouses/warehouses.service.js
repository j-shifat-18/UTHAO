const ApiError = require('../../utils/ApiError');
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

module.exports = {
  getAllWarehouses, getWarehouseById, createWarehouse, updateWarehouse,
  deactivateWarehouse, getWarehouseOccupancy, initiateTransfer, completeTransfer,
};
