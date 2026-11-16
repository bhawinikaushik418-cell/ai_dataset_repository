const { errorResponse } = require('../utils/response');

function requireAdmin(req, res, next) {
  if (!req.user) {
    return errorResponse(res, 401, 'Authentication required');
  }
  if (req.user.role !== 'ADMIN') {
    return errorResponse(res, 403, 'Access denied. Administrator privileges required.');
  }
  return next();
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Authentication required');
    }
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, `Access denied. Requires one of: ${allowedRoles.join(', ')}`);
    }
    return next();
  };
}

module.exports = {
  requireAdmin,
  requireRoles
};
