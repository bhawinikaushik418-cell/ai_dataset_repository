const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

class AuthService {
  async register({ name, email, password }) {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Database-level check for duplicate email address
    const [existing] = await pool.execute(
      'SELECT user_id FROM Users WHERE email = ? LIMIT 1',
      [cleanEmail]
    );

    if (existing.length > 0) {
      const err = new Error('An account with this email address already exists.');
      err.statusCode = 409;
      throw err;
    }

    // 2. Cryptographic password hashing (10 salt rounds with bcrypt)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. SECURITY RULE: Strictly assign role 'USER'. Self-assigned ADMIN privileges are rejected.
    const assignedRole = 'USER';
    const assignedStatus = 'ACTIVE';

    const [result] = await pool.execute(
      'INSERT INTO Users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      [cleanName, cleanEmail, passwordHash, assignedRole, assignedStatus]
    );

    const userId = result.insertId;
    const token = this.generateToken({ userId, email: cleanEmail, role: assignedRole });

    return {
      token,
      user: {
        userId,
        name: cleanName,
        email: cleanEmail,
        role: assignedRole,
        status: assignedStatus
      }
    };
  }

  async login({ email, password }) {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch user by email
    const [rows] = await pool.execute(
      'SELECT user_id, name, email, password_hash, role, status FROM Users WHERE email = ? LIMIT 1',
      [cleanEmail]
    );

    if (rows.length === 0) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const user = rows[0];

    // 2. Verify account is not suspended
    if (user.status !== 'ACTIVE') {
      const err = new Error('Your account has been suspended. Please contact the administrator.');
      err.statusCode = 403;
      throw err;
    }

    // 3. Constant-time secure password comparison
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    // 4. Generate signed JWT token
    const token = this.generateToken({
      userId: user.user_id,
      email: user.email,
      role: user.role
    });

    return {
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    };
  }

  async logout(tokenSignature, userId, tokenExp) {
    // Determine expiration timestamp from token or default to 7 days
    const expiresAt = tokenExp
      ? new Date(tokenExp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Record token signature in RevokedTokens table
    await pool.execute(
      'INSERT INTO RevokedTokens (token_signature, user_id, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE revoked_at = CURRENT_TIMESTAMP',
      [tokenSignature, userId, expiresAt]
    );

    return { message: 'Logged out successfully. Token invalidated.' };
  }

  async getCurrentUser(userId) {
    const [rows] = await pool.execute(
      'SELECT user_id, name, email, role, status, created_at FROM Users WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (rows.length === 0) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    return rows[0];
  }

  async getAllUsers() {
    const [rows] = await pool.execute(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.created_at,
        COUNT(DISTINCT d.dataset_id) AS uploaded_datasets_count,
        COUNT(DISTINCT dl.download_id) AS total_downloads_count
      FROM Users u
      LEFT JOIN Datasets d ON u.user_id = d.uploader_id
      LEFT JOIN Downloads dl ON u.user_id = dl.user_id
      GROUP BY u.user_id
      ORDER BY u.created_at DESC
    `);
    return rows;
  }

  async updateUserStatus(userId, status) {
    const [result] = await pool.execute(
      'UPDATE Users SET status = ? WHERE user_id = ?',
      [status, userId]
    );

    if (result.affectedRows === 0) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    return { userId: Number(userId), status };
  }

  generateToken(payload) {
    const uniquePayload = {
      ...payload,
      jti: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    return jwt.sign(uniquePayload, process.env.JWT_SECRET || 'dev-secret-key', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }
}

module.exports = new AuthService();
