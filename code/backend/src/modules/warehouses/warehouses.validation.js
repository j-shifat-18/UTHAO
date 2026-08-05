const validateCreateWarehouse = (body) => {
  const errors = [];
  if (!body.name) errors.push({ field: 'name', message: 'Warehouse name is required' });
  if (!body.code) errors.push({ field: 'code', message: 'Warehouse code is required' });
  if (!body.city) errors.push({ field: 'city', message: 'City is required' });
  if (!body.address) errors.push({ field: 'address', message: 'Address is required' });
  if (!body.total_capacity) errors.push({ field: 'total_capacity', message: 'Total capacity is required' });
  if (body.total_capacity && body.total_capacity <= 0) {
    errors.push({ field: 'total_capacity', message: 'Capacity must be greater than 0' });
  }
  return errors;
};

const validateTransfer = (body) => {
  const errors = [];
  if (!body.parcel_id) errors.push({ field: 'parcel_id', message: 'Parcel ID is required' });
  if (!body.from_warehouse_id) errors.push({ field: 'from_warehouse_id', message: 'Source warehouse is required' });
  if (!body.to_warehouse_id) errors.push({ field: 'to_warehouse_id', message: 'Destination warehouse is required' });
  return errors;
};

module.exports = { validateCreateWarehouse, validateTransfer };
