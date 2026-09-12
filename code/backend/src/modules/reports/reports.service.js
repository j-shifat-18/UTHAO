const repo = require('./reports.repository');
const { parsePagination } = require('../../utils/pagination');

// All report endpoints are read-only. The service layer is intentionally thin —
// it validates/coerces input then delegates entirely to the repository.

const getDailyDeliveries = async ({ date_from, date_to }) => {
  return repo.getDailyDeliveries(date_from, date_to);
};

const getMonthlyRevenue = async ({ date_from, date_to }) => {
  return repo.getMonthlyRevenue(date_from, date_to);
};

const getTopDeliveryAgents = async ({ date_from, date_to, limit }) => {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  return repo.getTopDeliveryAgents(date_from, date_to, safeLimit);
};

const getMostActiveBranches = async ({ date_from, date_to, limit }) => {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  return repo.getMostActiveBranches(date_from, date_to, safeLimit);
};

const getDelayedParcels = async (queryParams) => {
  const { page, limit, offset } = parsePagination(queryParams);
  const { priority, branch_id } = queryParams;
  return repo.getDelayedParcels({ limit, offset, priority, branch_id });
};

const getWarehouseOccupancy = async ({ branch_id, city, is_active }) => {
  // Coerce string 'false'/'true' from query params to boolean
  const activeFilter = is_active !== undefined
    ? is_active === 'true' || is_active === true
    : undefined;
  return repo.getWarehouseOccupancy({ branch_id, city, is_active: activeFilter });
};

const getRevenueByBranch = async ({ date_from, date_to }) => {
  return repo.getRevenueByBranch(date_from, date_to);
};

const getDeliverySuccessRate = async ({ date_from, date_to }) => {
  return repo.getDeliverySuccessRate(date_from, date_to);
};

const getAvgDeliveryTime = async ({ date_from, date_to }) => {
  return repo.getAvgDeliveryTime(date_from, date_to);
};

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
