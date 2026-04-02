const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// Validate express-validator results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// 404 handler
const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  logger.error(err);

  // PostgreSQL unique violation
  if (err.code === '23505') {
    const field = err.detail?.match(/\(([^)]+)\)/)?.[1] || 'field';
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Referenced resource not found' });
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(statusCode).json({ success: false, message });
};

module.exports = { validate, notFound, errorHandler };
