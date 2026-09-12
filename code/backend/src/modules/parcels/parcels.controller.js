const catchAsync = require('../../utils/catchAsync');
const { success, created } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const parcelsService = require('./parcels.service');

const getAllParcels = catchAsync(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status, priority, city, customer_id, search, date_from, date_to } = req.query;

  const { rows, totalCount } = await parcelsService.getAllParcels({
    limit, offset, status, priority, city, customer_id, search, date_from, date_to,
  });

  return success(res, {
    message: 'Parcels fetched',
    data: rows,
    meta: buildMeta(page, limit, totalCount),
  });
});

const getMyParcels = catchAsync(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status } = req.query;

  const { rows, totalCount } = await parcelsService.getMyParcels({
    user_id: req.user.id,
    limit,
    offset,
    status,
  });

  return success(res, {
    message: 'Your parcels fetched',
    data: rows,
    meta: buildMeta(page, limit, totalCount),
  });
});

const getParcelById = catchAsync(async (req, res) => {
  const parcel = await parcelsService.getParcelById(req.params.id, req.user);
  return success(res, { message: 'Parcel fetched', data: parcel });
});

// Public endpoint — no auth required
const trackByTrackingNumber = catchAsync(async (req, res) => {
  const result = await parcelsService.trackParcel(req.params.trackingNumber);
  return success(res, { message: 'Parcel tracking info', data: result });
});

const createParcel = catchAsync(async (req, res) => {
  const parcel = await parcelsService.createParcel(req.body, req.user);
  return created(res, { message: 'Parcel created', data: parcel });
});

const updateParcel = catchAsync(async (req, res) => {
  const parcel = await parcelsService.updateParcel(req.params.id, req.body, req.user);
  return success(res, { message: 'Parcel updated', data: parcel });
});

const updateStatus = catchAsync(async (req, res) => {
  const result = await parcelsService.updateParcelStatus(req.params.id, req.body, req.user);
  return success(res, { message: 'Status updated', data: result });
});

const cancelParcel = catchAsync(async (req, res) => {
  const result = await parcelsService.cancelParcel(req.params.id, req.body, req.user);
  return success(res, { message: 'Parcel cancelled', data: result });
});

const getTrackingHistory = catchAsync(async (req, res) => {
  const result = await parcelsService.getTrackingHistory(req.params.id);
  return success(res, { message: 'Tracking history fetched', data: result });
});

const getCategories = catchAsync(async (req, res) => {
  const categories = await parcelsService.getCategories();
  return success(res, { message: 'Categories fetched', data: categories });
});

module.exports = {
  getAllParcels, getMyParcels, getParcelById, trackByTrackingNumber,
  createParcel, updateParcel, updateStatus, cancelParcel, getTrackingHistory, getCategories,
};
