const ApiError = require('../utils/ApiError');

// Accepts one or more role names
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(ApiError.unauthorized());
    }

    const userRole = String(req.user.role).toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase());

    if (!normalizedAllowed.includes(userRole)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }

    next();
  };
};

module.exports = authorize;
