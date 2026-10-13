import ApiError from '../utils/ApiError.js';
import env from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || [];

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.errors ? err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    })) : [];
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Database validation failed';
    details = Object.values(err.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
  }

  // Handle Mongoose bad ObjectId / CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = `Invalid ID format for parameter: ${err.path}`;
    details = [{ path: err.path, message: 'Invalid identifier' }];
  }

  // Handle Mongo duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    code = 'CONFLICT';
    const field = Object.keys(err.keyValue || {})[0] || 'resource';
    message = `Duplicate value entered for '${field}'. Must be unique.`;
    details = [{ field, value: err.keyValue ? err.keyValue[field] : undefined }];
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'UNAUTHENTICATED';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHENTICATED';
    message = 'Authentication token has expired';
  }

  if (env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('Unhandled Server Error:', err);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
};

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Endpoint not found: ${req.method} ${req.originalUrl}`));
};

export default {
  errorHandler,
  notFoundHandler,
};
