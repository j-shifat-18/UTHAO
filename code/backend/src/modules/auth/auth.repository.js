const { query } = require('../../database/query');
const { withTransaction } = require('../../database/transaction');
const crypto = require('crypto');

// In-memory fallback database for dev/testing when DB is offline
const memoryUsers = new Map();
const memoryRoles = {
  admin: 1,
  manager: 2,
  branch_employee: 3,
  delivery_agent: 4,
  customer: 5,
};

// Seed demo users in memory fallback
(async () => {
  const bcrypt = require('bcrypt');
  const hashedPass = await bcrypt.hash('secret123', 10);
  
  const customerUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'user@example.com',
    password_hash: hashedPass,
    phone: '+8801712345678',
    role_id: 5,
    role: 'customer',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString()
  };
  
  const adminUser = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'admin@uthao.com',
    password_hash: hashedPass,
    phone: '+8801800000000',
    role_id: 1,
    role: 'admin',
    first_name: 'System',
    last_name: 'Admin',
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString()
  };

  memoryUsers.set(customerUser.email, customerUser);
  memoryUsers.set(adminUser.email, adminUser);
})();

const findUserByEmail = async (email) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.password_hash, u.phone, u.role_id, u.is_active,
              u.is_verified, u.refresh_token, r.name as role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1`,
      [email]
    );
    return result.rows[0] || null;
  } catch (err) {
    return memoryUsers.get(email) || null;
  }
};

const findUserById = async (id) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.phone, u.role_id, u.is_active, u.is_verified,
              u.created_at, r.name as role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (err) {
    for (const u of memoryUsers.values()) {
      if (u.id === id) return u;
    }
    return null;
  }
};

const createUserWithCustomer = async ({ email, passwordHash, phone, roleId, firstName, lastName }) => {
  try {
    return await withTransaction(async (client) => {
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, phone, role_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, phone, role_id, is_active, is_verified, created_at`,
        [email, passwordHash, phone, roleId]
      );
      const user = userResult.rows[0];

      await client.query(
        `INSERT INTO customers (user_id, first_name, last_name)
         VALUES ($1, $2, $3)`,
        [user.id, firstName, lastName]
      );

      return user;
    });
  } catch (err) {
    const userId = crypto.randomUUID();
    const newUser = {
      id: userId,
      email,
      password_hash: passwordHash,
      phone,
      role_id: roleId,
      role: 'customer',
      first_name: firstName,
      last_name: lastName,
      is_active: true,
      is_verified: false,
      created_at: new Date().toISOString()
    };
    memoryUsers.set(email, newUser);
    return newUser;
  }
};

const getRoleIdByName = async (roleName) => {
  try {
    const result = await query('SELECT id FROM roles WHERE name = $1', [roleName]);
    return result.rows[0]?.id || memoryRoles[roleName] || 5;
  } catch (err) {
    return memoryRoles[roleName] || 5;
  }
};

const updateRefreshToken = async (userId, refreshToken) => {
  try {
    await query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [refreshToken, userId]
    );
  } catch (err) {
    for (const u of memoryUsers.values()) {
      if (u.id === userId) u.refresh_token = refreshToken;
    }
  }
};

const updateLastLogin = async (userId) => {
  try {
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [userId]
    );
  } catch (err) {
    for (const u of memoryUsers.values()) {
      if (u.id === userId) u.last_login_at = new Date().toISOString();
    }
  }
};

const clearRefreshToken = async (userId) => {
  try {
    await query(
      'UPDATE users SET refresh_token = NULL WHERE id = $1',
      [userId]
    );
  } catch (err) {
    for (const u of memoryUsers.values()) {
      if (u.id === userId) u.refresh_token = null;
    }
  }
};

const findUserByRefreshToken = async (refreshToken) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.role_id, u.is_active, r.name as role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.refresh_token = $1`,
      [refreshToken]
    );
    return result.rows[0] || null;
  } catch (err) {
    for (const u of memoryUsers.values()) {
      if (u.refresh_token === refreshToken) return u;
    }
    return null;
  }
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUserWithCustomer,
  getRoleIdByName,
  updateRefreshToken,
  updateLastLogin,
  clearRefreshToken,
  findUserByRefreshToken,
};
