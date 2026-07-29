const catchAsync = require('../../utils/catchAsync');
const { success, created } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const customersService = require('./customers.service');

const getAllCustomers = catchAsync(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { search } = req.query;

  const { rows, totalCount } = await customersService.getAllCustomers({ limit, offset, search });

  return success(res, {
    message: 'Customers fetched',
    data: rows,
    meta: buildMeta(page, limit, totalCount),
  });
});

const getCustomerById = catchAsync(async (req, res) => {
  const customer = await customersService.getCustomerById(req.params.id);
  return success(res, { message: 'Customer fetched', data: customer });
});

const getMyProfile = catchAsync(async (req, res) => {
  const customer = await customersService.getMyProfile(req.user.id);
  return success(res, { message: 'Profile fetched', data: customer });
});

const updateCustomer = catchAsync(async (req, res) => {
  const updated = await customersService.updateCustomer(req.params.id, req.body, req.user);
  return success(res, { message: 'Customer updated', data: updated });
});

const getCustomerAddresses = catchAsync(async (req, res) => {
  const addresses = await customersService.getCustomerAddresses(req.params.id);
  return success(res, { message: 'Addresses fetched', data: addresses });
});

const addCustomerAddress = catchAsync(async (req, res) => {
  const address = await customersService.addCustomerAddress(req.params.id, req.body, req.user);
  return created(res, { message: 'Address added', data: address });
});

module.exports = { getAllCustomers, getCustomerById, getMyProfile, updateCustomer, getCustomerAddresses, addCustomerAddress };
