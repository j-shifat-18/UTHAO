const ApiError = require('../../utils/ApiError');
const usersRepo = require('./users.repository');
const { query } = require('../../database/query');

const getAllUsers = async ({ limit, offset, search, role, is_active }) => {
  return usersRepo.findAllUsers({ limit, offset, search, role, is_active });
};

const getUserById = async (id) => {
  const user = await usersRepo.findUserById(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const updateUser = async (id, data) => {
  const user = await usersRepo.findUserById(id);
  if (!user) throw ApiError.notFound('User not found');

  const updatePayload = { ...data };

  // Handle role conversion by role name (e.g. 'delivery_agent', 'customer', 'manager', 'admin')
  if (data.role) {
    const roleRes = await query('SELECT id, name FROM roles WHERE name = $1', [data.role.toLowerCase().trim()]);
    if (!roleRes.rows[0]) throw ApiError.badRequest(`Invalid role '${data.role}'.`);
    updatePayload.role_id = roleRes.rows[0].id;
    const targetRoleName = roleRes.rows[0].name.toLowerCase();

    // Fetch existing customer record if any
    const custRes = await query('SELECT id, first_name, last_name FROM customers WHERE user_id = $1', [id]);
    const cust = custRes.rows[0];
    const firstName = cust?.first_name || user.email.split('@')[0];
    const lastName = cust?.last_name || 'User';

    if (targetRoleName === 'delivery_agent') {
      // Auto-provision or activate delivery_agents record
      await query(
        `INSERT INTO delivery_agents (user_id, first_name, last_name, vehicle_type, is_available, is_active)
         VALUES ($1, $2, $3, 'motorcycle', true, true)
         ON CONFLICT (user_id) DO UPDATE SET is_active = true, is_available = true`,
        [id, firstName, lastName]
      );

      // Ensure customer record also exists so they can use customer features
      if (!cust) {
        await query(
          `INSERT INTO customers (user_id, first_name, last_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id) DO NOTHING`,
          [id, firstName, lastName]
        );
      }
    } else if (targetRoleName === 'customer') {
      // Ensure customer record exists
      if (!cust) {
        await query(
          `INSERT INTO customers (user_id, first_name, last_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id) DO NOTHING`,
          [id, firstName, lastName]
        );
      }
      // Deactivate agent record if present
      await query(`UPDATE delivery_agents SET is_active = false, is_available = false WHERE user_id = $1`, [id]);
    }
  }

  await usersRepo.updateUser(id, updatePayload);
  return usersRepo.findUserById(id);
};

const deactivateUser = async (id) => {
  const user = await usersRepo.findUserById(id);
  if (!user) throw ApiError.notFound('User not found');
  if (!user.is_active) throw ApiError.badRequest('User is already deactivated');

  return usersRepo.deactivateUser(id);
};

const activateUser = async (id) => {
  const user = await usersRepo.findUserById(id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.is_active) throw ApiError.badRequest('User is already active');

  return usersRepo.activateUser(id);
};

module.exports = { getAllUsers, getUserById, updateUser, deactivateUser, activateUser };
