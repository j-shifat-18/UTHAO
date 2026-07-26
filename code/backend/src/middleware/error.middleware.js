const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const errorMiddleware = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  // Handle pg unique constraint violations
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Resource already exists';
    const detail = err.detail || '';
    errors = [{ field: extractField(detail), message: detail }];
  }

  // Handle pg foreign key violations
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced resource does not exist';
  }

  // Handle pg check constraint violations
  if (err.code === '23514') {
    statusCode = 400;
    message = 'Validation constraint failed';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error({ err, path: req.path, method: req.method }, message);
  } else {
    logger.warn({ statusCode, path: req.path, method: req.method }, message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Extract field name from pg error detail
function extractField(detail) {
  const match = detail.match(/Key \((.+?)\)/);
  return match ? match[1] : 'unknown';
}

module.exports = errorMiddleware;
