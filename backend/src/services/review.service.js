const { pool } = require('../config/db');

class ReviewService {
  async rateDataset({ datasetId, userId, rating }) {
    // Verify dataset exists and is approved
    const [datasets] = await pool.execute(
      'SELECT dataset_id FROM Datasets WHERE dataset_id = ? AND approval_status = ? LIMIT 1',
      [datasetId, 'APPROVED']
    );

    if (datasets.length === 0) {
      const err = new Error('Dataset not found or not yet approved for public review.');
      err.statusCode = 404;
      throw err;
    }

    // Atomic Upsert: Inserts new rating or updates existing rating from this user
    await pool.execute(
      `INSERT INTO Ratings (dataset_id, user_id, rating) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [datasetId, userId, rating]
    );

    // Compute updated average rating
    const [avgRows] = await pool.execute(
      `SELECT 
        COALESCE(ROUND(AVG(rating), 2), 0.00) AS avg_rating,
        COUNT(rating_id) AS total_ratings
       FROM Ratings WHERE dataset_id = ?`,
      [datasetId]
    );

    return {
      dataset_id: Number(datasetId),
      user_id: userId,
      rating: Number(rating),
      avg_rating: avgRows[0].avg_rating,
      total_ratings: avgRows[0].total_ratings
    };
  }

  async getUserRating(datasetId, userId) {
    const [rows] = await pool.execute(
      'SELECT rating_id, rating, created_at, updated_at FROM Ratings WHERE dataset_id = ? AND user_id = ? LIMIT 1',
      [datasetId, userId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async createReview({ datasetId, userId, reviewText }) {
    const [datasets] = await pool.execute(
      'SELECT dataset_id FROM Datasets WHERE dataset_id = ? AND approval_status = ? LIMIT 1',
      [datasetId, 'APPROVED']
    );

    if (datasets.length === 0) {
      const err = new Error('Dataset not found or not yet approved.');
      err.statusCode = 404;
      throw err;
    }

    const cleanText = reviewText.trim();
    const [result] = await pool.execute(
      'INSERT INTO Reviews (dataset_id, user_id, review_text) VALUES (?, ?, ?)',
      [datasetId, userId, cleanText]
    );

    const [userRows] = await pool.execute('SELECT name FROM Users WHERE user_id = ?', [userId]);

    return {
      review_id: result.insertId,
      dataset_id: Number(datasetId),
      user_id: userId,
      user_name: userRows[0].name,
      review_text: cleanText,
      created_at: new Date()
    };
  }

  async getDatasetReviews(datasetId, { page = 1, limit = 20 }) {
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * safeLimit;

    const countSql = 'SELECT COUNT(*) AS total FROM Reviews WHERE dataset_id = ?';
    const [countRows] = await pool.execute(countSql, [datasetId]);
    const total = countRows[0].total;

    const querySql = `
      SELECT 
        rev.review_id,
        rev.dataset_id,
        rev.user_id,
        u.name AS user_name,
        r.rating AS user_rating,
        rev.review_text,
        rev.created_at,
        rev.updated_at
      FROM Reviews rev
      JOIN Users u ON rev.user_id = u.user_id
      LEFT JOIN Ratings r ON rev.dataset_id = r.dataset_id AND rev.user_id = r.user_id
      WHERE rev.dataset_id = ?
      ORDER BY rev.created_at DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `;

    const [rows] = await pool.execute(querySql, [datasetId]);

    return {
      reviews: rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }

  async deleteReview(reviewId, currentUser) {
    const [rows] = await pool.execute(
      'SELECT review_id, user_id FROM Reviews WHERE review_id = ? LIMIT 1',
      [reviewId]
    );

    if (rows.length === 0) {
      const err = new Error('Review not found.');
      err.statusCode = 404;
      throw err;
    }

    if (currentUser.role !== 'ADMIN' && currentUser.userId !== rows[0].user_id) {
      const err = new Error('Access denied. You can only delete your own reviews.');
      err.statusCode = 403;
      throw err;
    }

    await pool.execute('DELETE FROM Reviews WHERE review_id = ?', [reviewId]);

    return { review_id: Number(reviewId), deleted: true };
  }
}

module.exports = new ReviewService();
