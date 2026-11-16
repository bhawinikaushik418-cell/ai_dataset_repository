const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { errorResponse } = require('../utils/response');

async function isTokenRevoked(signature) {
  try {
    const [rows] = await pool.execute(
      'SELECT token_id FROM RevokedTokens WHERE token_signature = ? AND expires_at > NOW() LIMIT 1',
      [signature]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('[AuthMiddleware] Error checking token revocation:', error.message);
    return false;
  }
}

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 401, 'Authentication token missing or invalid');
  }

  const token = authHeader.split(' ')[1];
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    return errorResponse(res, 401, 'Malformed authentication token');
  }

  const signature = tokenParts[2];

  try {
    // 1. Check if token was explicitly revoked via logout
    const revoked = await isTokenRevoked(signature);
    if (revoked) {
      return errorResponse(res, 401, 'This session has been logged out. Please log in again.');
    }

    // 2. Cryptographic signature and expiration verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');

    // 3. Database verification: check account existence and active standing
    const [userRows] = await pool.execute(
      'SELECT user_id, email, role, status FROM Users WHERE user_id = ? LIMIT 1',
      [decoded.userId]
    );

    if (userRows.length === 0) {
      return errorResponse(res, 401, 'User account no longer exists.');
    }

    const user = userRows[0];
    if (user.status !== 'ACTIVE') {
      return errorResponse(res, 403, 'Account is currently suspended. Please contact administrator.');
    }

    // 4. Attach verified user context and token metadata to request
    req.user = {
      userId: user.user_id,
      email: user.email,
      role: user.role
    };
    req.token = token;
    req.tokenSignature = signature;
    req.tokenExp = decoded.exp;

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Authentication token has expired. Please log in again.');
    }
    return errorResponse(res, 401, 'Invalid authentication token');
  }
}

// Optional auth: Populates req.user if a valid token is provided, continues if not
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    req.user = null;
    return next();
  }

  const signature = tokenParts[2];

  try {
    const revoked = await isTokenRevoked(signature);
    if (revoked) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
    const [userRows] = await pool.execute(
      'SELECT user_id, email, role, status FROM Users WHERE user_id = ? AND status = "ACTIVE" LIMIT 1',
      [decoded.userId]
    );

    if (userRows.length > 0) {
      req.user = {
        userId: userRows[0].user_id,
        email: userRows[0].email,
        role: userRows[0].role
      };
      req.token = token;
      req.tokenSignature = signature;
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }

  return next();
}

module.exports = {
  authenticate,
  optionalAuth
};
