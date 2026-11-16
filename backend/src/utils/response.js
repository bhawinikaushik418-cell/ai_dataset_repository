/**
 * Standardized API response helpers ensuring uniform JSON contract across all routes
 */

function successResponse(res, statusCode = 200, message = 'Success', data = null, meta = null) {
  const payload = {
    success: true,
    message,
    data
  };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
}

function errorResponse(res, statusCode = 500, message = 'An unexpected error occurred', details = null) {
  const payload = {
    success: false,
    message
  };
  if (details && process.env.NODE_ENV !== 'production') {
    payload.details = details;
  }
  return res.status(statusCode).json(payload);
}

module.exports = {
  successResponse,
  errorResponse
};
