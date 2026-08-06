const { query } = require('../../database/query');

// Generate tracking number: format UTXXX-YYYYMMDD-NNNN
// XXX = branch code suffix, NNNN = daily sequence
const generateTrackingNumber = async (branchCode) => {
  const prefix = branchCode ? branchCode.substring(0, 6).toUpperCase() : 'UTHAO';
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');

  // Count parcels created today to get sequence number
  const result = await query(
    `SELECT COUNT(*) as count FROM parcels
     WHERE created_at::date = CURRENT_DATE`,
    []
  );
  const sequence = String(parseInt(result.rows[0].count, 10) + 1).padStart(4, '0');
  return `${prefix}-${dateStr}-${sequence}`;
};

// Calculate delivery cost: base_price + (weight_kg * price_per_kg) * priority multiplier
const calculateDeliveryCost = async (categoryId, weightKg, priority) => {
  const result = await query(
    'SELECT base_price, price_per_kg FROM parcel_categories WHERE id = $1',
    [categoryId]
  );
  if (!result.rows[0]) throw new Error('Category not found');

  const { base_price, price_per_kg } = result.rows[0];
  const baseCost = parseFloat(base_price) + parseFloat(price_per_kg) * parseFloat(weightKg);

  const multiplier = priority === 'overnight' ? 2.0 : priority === 'express' ? 1.5 : 1.0;
  return Math.round(baseCost * multiplier * 100) / 100;
};

module.exports = { generateTrackingNumber, calculateDeliveryCost };
