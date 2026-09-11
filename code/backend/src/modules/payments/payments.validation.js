const VALID_STATUSES = ['pending', 'completed', 'failed', 'refunded'];

const validateCreatePayment = (body) => {
  const errors = [];

  if (!body.parcel_id) {
    errors.push({ field: 'parcel_id', message: 'Parcel ID is required' });
  }
  if (!body.payment_method_id) {
    errors.push({ field: 'payment_method_id', message: 'Payment method is required' });
  }
  if (body.payment_method_id && isNaN(parseInt(body.payment_method_id, 10))) {
    errors.push({ field: 'payment_method_id', message: 'Payment method ID must be a number' });
  }
  if (body.transaction_id && typeof body.transaction_id !== 'string') {
    errors.push({ field: 'transaction_id', message: 'Transaction ID must be a string' });
  }

  return errors;
};

const validateVerifyPayment = (body) => {
  // transaction_id is optional (some methods don't produce one)
  return [];
};

const validateRefundPayment = (body) => {
  const errors = [];
  if (!body.notes) {
    errors.push({ field: 'notes', message: 'Refund reason/notes are required' });
  }
  return errors;
};

module.exports = {
  validateCreatePayment,
  validateVerifyPayment,
  validateRefundPayment,
};
