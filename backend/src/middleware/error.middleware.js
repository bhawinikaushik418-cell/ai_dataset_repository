const { errorResponse } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = process.env.MAX_FILE_SIZE_MB || 50;
      return errorResponse(res, 400, `Uploaded file exceeds size limit of ${maxMb}MB`);
    }
    return errorResponse(res, 400, `File upload error: ${err.message}`);
  }

  // Custom filter error from Multer
  if (err.message && err.message.includes('Only .csv and .zip files')) {
    return errorResponse(res, 400, err.message);
  }

  // MySQL unique constraint violation (ER_DUP_ENTRY)
  if (err.code === 'ER_DUP_ENTRY') {
    if (err.message.includes('uk_users_email')) {
      return errorResponse(res, 409, 'An account with this email address already exists.');
    }
    if (err.message.includes('uk_categories_name')) {
      return errorResponse(res, 409, 'A category with this name already exists.');
    }
    if (err.message.includes('uk_pending_access_request')) {
      return errorResponse(res, 409, 'You already have an active pending access request for this dataset.');
    }
    if (err.message.includes('uk_user_dataset_rating')) {
      return errorResponse(res, 409, 'You have already rated this dataset.');
    }
    return errorResponse(res, 409, 'Duplicate record conflict detected.');
  }

  // MySQL foreign key constraint failure
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return errorResponse(res, 400, 'Referenced record (such as category or dataset) does not exist.');
  }

  // MySQL row lock timeout
  if (err.code === 'ER_LOCK_WAIT_TIMEOUT') {
    return errorResponse(res, 503, 'Database operation timed out due to high concurrency. Please retry.');
  }

  // Default fallback
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message || 'Internal Server Error';

  return errorResponse(res, err.statusCode || 500, message, err.stack);
}

module.exports = errorHandler;
