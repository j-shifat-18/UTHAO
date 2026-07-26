const ApiError = require('../utils/ApiError');

// Generic validation middleware
// Takes a schema object with optional body, params, query validators
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    if (schema.body) {
      const bodyErrors = schema.body(req.body);
      if (bodyErrors.length) errors.push(...bodyErrors);
    }

    if (schema.params) {
      const paramErrors = schema.params(req.params);
      if (paramErrors.length) errors.push(...paramErrors);
    }

    if (schema.query) {
      const queryErrors = schema.query(req.query);
      if (queryErrors.length) errors.push(...queryErrors);
    }

    if (errors.length > 0) {
      return next(ApiError.badRequest('Validation failed', errors));
    }

    next();
  };
};

module.exports = validate;
