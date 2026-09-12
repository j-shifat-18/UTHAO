const validateCreateParcel = (body) => {
  const errors = [];
  if (!body.receiver_name) errors.push({ field: 'receiver_name', message: 'Receiver name is required' });
  if (!body.receiver_phone) errors.push({ field: 'receiver_phone', message: 'Receiver phone is required' });
  if (!body.delivery_address_line1) errors.push({ field: 'delivery_address_line1', message: 'Delivery address is required' });
  if (!body.delivery_city) errors.push({ field: 'delivery_city', message: 'Delivery city is required' });
  if (!body.delivery_state) errors.push({ field: 'delivery_state', message: 'Delivery state is required' });
  if (!body.delivery_postal_code) errors.push({ field: 'delivery_postal_code', message: 'Delivery postal code is required' });
  if (!body.category_id) errors.push({ field: 'category_id', message: 'Category is required' });
  if (!body.weight_kg) errors.push({ field: 'weight_kg', message: 'Weight is required' });
  if (body.weight_kg && body.weight_kg <= 0) errors.push({ field: 'weight_kg', message: 'Weight must be greater than 0' });
  if (body.priority && !['standard', 'express', 'overnight'].includes(body.priority)) {
    errors.push({ field: 'priority', message: 'Priority must be standard, express, or overnight' });
  }
  if (body.payment_method && !['prepaid', 'cod'].includes(body.payment_method)) {
    errors.push({ field: 'payment_method', message: 'Payment method must be prepaid or cod' });
  }
  return errors;
};

const validateUpdateStatus = (body) => {
  const errors = [];
  const validStatuses = ['picked_up', 'in_transit', 'at_warehouse', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'failed'];
  if (!body.status) errors.push({ field: 'status', message: 'Status is required' });
  if (body.status && !validStatuses.includes(body.status)) {
    errors.push({ field: 'status', message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }
  return errors;
};

module.exports = { validateCreateParcel, validateUpdateStatus };
