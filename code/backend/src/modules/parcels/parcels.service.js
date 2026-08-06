const ApiError = require('../../utils/ApiError');
const parcelsRepo = require('./parcels.repository');
const customersRepo = require('../customers/customers.repository');
const { generateTrackingNumber, calculateDeliveryCost } = require('./parcels.helper');
const { query } = require('../../database/query');

const CANCELLABLE_STATUSES = ['booked', 'picked_up'];
const CUSTOMER_UPDATABLE_STATUSES = ['booked'];

const getAllParcels = async (filters) => {
  return parcelsRepo.findAllParcels(filters);
};

const getParcelById = async (id, requestingUser) => {
  const parcel = await parcelsRepo.findParcelById(id);
  if (!parcel) throw ApiError.notFound('Parcel not found');

  // Customers can only view their own parcels
  if (requestingUser.role === 'customer') {
    const customer = await customersRepo.findCustomerByUserId(requestingUser.id);
    if (!customer || parcel.sender_customer_id !== customer.id) {
      throw ApiError.forbidden('You can only view your own parcels');
    }
  }
  return parcel;
};

// Public tracking by tracking number (no auth needed)
const trackParcel = async (trackingNumber) => {
  const parcel = await parcelsRepo.findParcelByTrackingNumber(trackingNumber);
  if (!parcel) throw ApiError.notFound('Parcel not found');
  const history = await parcelsRepo.getParcelTrackingHistory(parcel.id);
  return { parcel, history };
};

const createParcel = async (body, requestingUser) => {
  // Get the customer record for the requesting user
  const customer = await customersRepo.findCustomerByUserId(requestingUser.id);
  if (!customer) throw ApiError.notFound('Customer profile not found');

  // Calculate delivery cost
  const deliveryCost = await calculateDeliveryCost(body.category_id, body.weight_kg, body.priority);

  // Get origin branch code for tracking number
  let branchCode = 'UTHAO';
  if (body.origin_branch_id) {
    const branchResult = await query('SELECT code FROM branches WHERE id = $1', [body.origin_branch_id]);
    if (branchResult.rows[0]) branchCode = branchResult.rows[0].code;
  }

  const trackingNumber = await generateTrackingNumber(branchCode);

  // Get origin branch name for initial status
  let originBranchName = null;
  if (body.origin_branch_id) {
    const branchResult = await query('SELECT name FROM branches WHERE id = $1', [body.origin_branch_id]);
    if (branchResult.rows[0]) originBranchName = branchResult.rows[0].name;
  }

  return parcelsRepo.createParcel({
    ...body,
    sender_customer_id: customer.id,
    delivery_cost: deliveryCost,
    tracking_number: trackingNumber,
    origin_branch_name: originBranchName,
    created_by: requestingUser.id,
  });
};

const updateParcel = async (id, body, requestingUser) => {
  const parcel = await parcelsRepo.findParcelById(id);
  if (!parcel) throw ApiError.notFound('Parcel not found');

  if (requestingUser.role === 'customer') {
    const customer = await customersRepo.findCustomerByUserId(requestingUser.id);
    if (!customer || parcel.sender_customer_id !== customer.id) {
      throw ApiError.forbidden('You can only update your own parcels');
    }
    if (!CUSTOMER_UPDATABLE_STATUSES.includes(parcel.status)) {
      throw ApiError.badRequest(`Parcel cannot be updated in status: ${parcel.status}`);
    }
  }

  return parcelsRepo.updateParcel(id, body);
};

const updateParcelStatus = async (id, body, requestingUser) => {
  const parcel = await parcelsRepo.findParcelById(id);
  if (!parcel) throw ApiError.notFound('Parcel not found');

  const validTransitions = {
    booked: ['picked_up', 'cancelled'],
    picked_up: ['in_transit', 'cancelled', 'failed'],
    in_transit: ['at_warehouse', 'out_for_delivery', 'failed'],
    at_warehouse: ['in_transit', 'out_for_delivery'],
    out_for_delivery: ['delivered', 'failed', 'returned'],
    failed: ['out_for_delivery', 'returned'],
  };

  const allowed = validTransitions[parcel.status];
  if (!allowed || !allowed.includes(body.status)) {
    throw ApiError.badRequest(`Cannot transition from '${parcel.status}' to '${body.status}'`);
  }

  const result = await parcelsRepo.updateParcelStatus({
    parcel_id: id,
    status: body.status,
    location: body.location,
    notes: body.notes,
    changed_by: requestingUser.id,
  });

  if (!result) throw ApiError.badRequest('Status update failed');
  return result;
};

const cancelParcel = async (id, body, requestingUser) => {
  const parcel = await parcelsRepo.findParcelById(id);
  if (!parcel) throw ApiError.notFound('Parcel not found');

  if (requestingUser.role === 'customer') {
    const customer = await customersRepo.findCustomerByUserId(requestingUser.id);
    if (!customer || parcel.sender_customer_id !== customer.id) {
      throw ApiError.forbidden('You can only cancel your own parcels');
    }
  }

  if (!CANCELLABLE_STATUSES.includes(parcel.status)) {
    throw ApiError.badRequest(`Cannot cancel parcel in status: ${parcel.status}`);
  }

  const result = await parcelsRepo.cancelParcel({
    parcel_id: id,
    reason: body.reason,
    cancelled_by: requestingUser.id,
  });

  if (!result) throw ApiError.badRequest('Parcel could not be cancelled');
  return result;
};

const getTrackingHistory = async (id) => {
  const parcel = await parcelsRepo.findParcelById(id);
  if (!parcel) throw ApiError.notFound('Parcel not found');
  const history = await parcelsRepo.getParcelTrackingHistory(id);
  return { parcel: { id: parcel.id, tracking_number: parcel.tracking_number, status: parcel.status }, history };
};

const getMyParcels = async ({ user_id, limit, offset, status }) => {
  const customer = await customersRepo.findCustomerByUserId(user_id);
  if (!customer) throw ApiError.notFound('Customer profile not found');
  return parcelsRepo.getMyParcels({ customer_id: customer.id, limit, offset, status });
};

const getCategories = async () => {
  const result = await query('SELECT * FROM parcel_categories ORDER BY name', []);
  return result.rows;
};

module.exports = {
  getAllParcels, getParcelById, trackParcel, createParcel, updateParcel,
  updateParcelStatus, cancelParcel, getTrackingHistory, getMyParcels, getCategories,
};
