const ApiError = require('../../utils/ApiError');
const customersRepo = require('./customers.repository');

const getAllCustomers = async ({ limit, offset, search }) => {
  return customersRepo.findAllCustomers({ limit, offset, search });
};

const getCustomerById = async (id) => {
  const customer = await customersRepo.findCustomerById(id);
  if (!customer) throw ApiError.notFound('Customer not found');
  return customer;
};

const getMyProfile = async (userId) => {
  const customer = await customersRepo.findCustomerByUserId(userId);
  if (!customer) throw ApiError.notFound('Customer profile not found');
  return customer;
};

const updateCustomer = async (id, data, requestingUser) => {
  const customer = await customersRepo.findCustomerById(id);
  if (!customer) throw ApiError.notFound('Customer not found');

  // Customers can only update their own profile
  if (requestingUser.role === 'customer' && customer.user_id !== requestingUser.id) {
    throw ApiError.forbidden('You can only update your own profile');
  }

  const updated = await customersRepo.updateCustomer(id, data);
  return updated;
};

const getCustomerAddresses = async (id) => {
  const customer = await customersRepo.findCustomerById(id);
  if (!customer) throw ApiError.notFound('Customer not found');

  return customersRepo.findCustomerAddresses(id);
};

const addCustomerAddress = async (id, data, requestingUser) => {
  const customer = await customersRepo.findCustomerById(id);
  if (!customer) throw ApiError.notFound('Customer not found');

  if (requestingUser.role === 'customer' && customer.user_id !== requestingUser.id) {
    throw ApiError.forbidden('You can only add addresses to your own profile');
  }

  // Use user_id as entity_id for addresses
  return customersRepo.createAddress(customer.user_id, data);
};

module.exports = { getAllCustomers, getCustomerById, getMyProfile, updateCustomer, getCustomerAddresses, addCustomerAddress };
