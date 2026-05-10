import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

/**
 * Global error handling middleware.
 * Catches all errors and returns structured JSON responses.
 */
export function errorHandler(err, req, res, _next) {
  // Log the error
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`Operational error: ${err.code} — ${err.message}`);
  } else {
    logger.error(`Unexpected error: ${err.message}`, { stack: err.stack });
  }

  // If it's our custom error, use its structure
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Express-validator errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Request body contains invalid JSON',
      },
    });
  }

  // Unknown errors
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
  });
}

/**
 * 404 handler for undefined routes.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

export default { errorHandler, notFoundHandler };
