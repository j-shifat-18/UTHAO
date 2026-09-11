const catchAsync = require('../../utils/catchAsync');
const { success } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const reportsService = require('./reports.service');

const getDailyDeliveries = catchAsync(async (req, res) => {
  const result = await reportsService.getDailyDeliveries(req.query);
  return success(res, { message: 'Daily delivery report fetched', data: result });
});

const getMonthlyRevenue = catchAsync(async (req, res) => {
  const result = await reportsService.getMonthlyRevenue(req.query);
  return success(res, { message: 'Monthly revenue report fetched', data: result });
});

const getTopDeliveryAgents = catchAsync(async (req, res) => {
  const result = await reportsService.getTopDeliveryAgents(req.query);
  return success(res, { message: 'Top delivery agents report fetched', data: result });
});

const getMostActiveBranches = catchAsync(async (req, res) => {
  const result = await reportsService.getMostActiveBranches(req.query);
  return success(res, { message: 'Most active branches report fetched', data: result });
});

const getDelayedParcels = catchAsync(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { rows, totalCount } = await reportsService.getDelayedParcels(req.query);
  return success(res, {
    message: 'Delayed parcels report fetched',
    data: rows,
    meta: buildMeta(page, limit, totalCount),
  });
});

const getWarehouseOccupancy = catchAsync(async (req, res) => {
  const rows = await reportsService.getWarehouseOccupancy(req.query);
  return success(res, { message: 'Warehouse occupancy report fetched', data: rows });
});

const getRevenueByBranch = catchAsync(async (req, res) => {
  const result = await reportsService.getRevenueByBranch(req.query);
  return success(res, { message: 'Revenue by branch report fetched', data: result });
});

const getDeliverySuccessRate = catchAsync(async (req, res) => {
  const result = await reportsService.getDeliverySuccessRate(req.query);
  return success(res, { message: 'Delivery success rate report fetched', data: result });
});

const getAvgDeliveryTime = catchAsync(async (req, res) => {
  const result = await reportsService.getAvgDeliveryTime(req.query);
  return success(res, { message: 'Average delivery time report fetched', data: result });
});

module.exports = {
  getDailyDeliveries,
  getMonthlyRevenue,
  getTopDeliveryAgents,
  getMostActiveBranches,
  getDelayedParcels,
  getWarehouseOccupancy,
  getRevenueByBranch,
  getDeliverySuccessRate,
  getAvgDeliveryTime,
};
