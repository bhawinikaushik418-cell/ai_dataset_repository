const { pool } = require('../config/db');

class AccessService {
  async createRequest({ datasetId, userId, justification }) {
    // 1. Verify dataset
    const [datasets] = await pool.execute(
      'SELECT dataset_id, dataset_name, access_level, approval_status, uploader_id FROM Datasets WHERE dataset_id = ? LIMIT 1',
      [datasetId]
    );

    if (datasets.length === 0) {
      const err = new Error('Dataset not found.');
      err.statusCode = 404;
      throw err;
    }

    const dataset = datasets[0];

    if (dataset.access_level !== 'RESTRICTED') {
      const err = new Error('This dataset is public. Access requests are only required for restricted datasets.');
      err.statusCode = 400;
      throw err;
    }

    if (dataset.uploader_id === userId) {
      const err = new Error('You are the owner of this dataset and already have full access.');
      err.statusCode = 400;
      throw err;
    }

    // 2. Check for existing PENDING request
    const [pending] = await pool.execute(
      "SELECT request_id FROM AccessRequests WHERE dataset_id = ? AND user_id = ? AND status = 'PENDING' LIMIT 1",
      [datasetId, userId]
    );

    if (pending.length > 0) {
      const err = new Error('You already have an active pending access request for this dataset. Please wait for administrator review.');
      err.statusCode = 409;
      throw err;
    }

    // 3. Insert new access request
    const cleanJustification = justification.trim();
    const [result] = await pool.execute(
      'INSERT INTO AccessRequests (dataset_id, user_id, justification, status) VALUES (?, ?, ?, ?)',
      [datasetId, userId, cleanJustification, 'PENDING']
    );

    return {
      request_id: result.insertId,
      dataset_id: Number(datasetId),
      dataset_name: dataset.dataset_name,
      status: 'PENDING',
      justification: cleanJustification
    };
  }

  async getMyRequests(userId) {
    const [rows] = await pool.execute(
      `SELECT 
        ar.request_id,
        ar.dataset_id,
        d.dataset_name,
        d.domain,
        d.task_type,
        ar.justification,
        ar.status,
        ar.rejection_reason,
        ar.requested_at,
        ar.reviewed_at,
        u_rev.name AS reviewer_name
      FROM AccessRequests ar
      JOIN Datasets d ON ar.dataset_id = d.dataset_id
      LEFT JOIN Users u_rev ON ar.reviewed_by = u_rev.user_id
      WHERE ar.user_id = ?
      ORDER BY ar.requested_at DESC`,
      [userId]
    );
    return rows;
  }

  async getAllRequests({ status, page = 1, limit = 20 }) {
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * safeLimit;

    const whereClauses = [];
    const params = [];

    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status.toUpperCase())) {
      whereClauses.push('ar.status = ?');
      params.push(status.toUpperCase());
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) AS total FROM AccessRequests ar ${whereSql}`;
    const [countRows] = await pool.execute(countSql, params);
    const total = countRows[0].total;

    const querySql = `
      SELECT 
        ar.request_id,
        ar.dataset_id,
        d.dataset_name,
        d.domain,
        ar.user_id,
        u.name AS applicant_name,
        u.email AS applicant_email,
        ar.justification,
        ar.status,
        ar.rejection_reason,
        ar.requested_at,
        ar.reviewed_at,
        u_rev.name AS reviewer_name
      FROM AccessRequests ar
      JOIN Datasets d ON ar.dataset_id = d.dataset_id
      JOIN Users u ON ar.user_id = u.user_id
      LEFT JOIN Users u_rev ON ar.reviewed_by = u_rev.user_id
      ${whereSql}
      ORDER BY 
        CASE WHEN ar.status = 'PENDING' THEN 1 ELSE 2 END,
        ar.requested_at DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `;

    const [rows] = await pool.execute(querySql, params);

    return {
      requests: rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }

  async reviewRequest(requestId, { status, rejectionReason }, adminId) {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      const err = new Error('Status must be APPROVED or REJECTED.');
      err.statusCode = 400;
      throw err;
    }

    if (status === 'REJECTED' && (!rejectionReason || rejectionReason.trim().length < 5)) {
      const err = new Error('A rejection reason of at least 5 characters is required.');
      err.statusCode = 400;
      throw err;
    }

    const [result] = await pool.execute(
      `UPDATE AccessRequests 
       SET status = ?, 
           rejection_reason = ?, 
           reviewed_by = ?, 
           reviewed_at = NOW() 
       WHERE request_id = ?`,
      [status, rejectionReason ? rejectionReason.trim() : null, adminId, requestId]
    );

    if (result.affectedRows === 0) {
      const err = new Error('Access request not found.');
      err.statusCode = 404;
      throw err;
    }

    return {
      request_id: Number(requestId),
      status,
      rejection_reason: rejectionReason || null
    };
  }
}

module.exports = new AccessService();
