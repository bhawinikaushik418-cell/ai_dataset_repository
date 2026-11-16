const { pool } = require('../config/db');

class AdminService {
  async getAnalytics() {
    // 1. High-level KPIs from database view vw_admin_repository_analytics
    const [kpiRows] = await pool.execute('SELECT * FROM vw_admin_repository_analytics LIMIT 1');
    const kpis = kpiRows[0] || {};

    // 2. Average rating across entire repository (Aggregate SQL AVG)
    const [ratingSummary] = await pool.execute(`
      SELECT COALESCE(ROUND(AVG(rating), 2), 0.00) AS overall_avg_rating
      FROM Ratings
    `);
    kpis.overall_avg_rating = ratingSummary[0].overall_avg_rating;

    // 3. Most downloaded datasets (SQL JOIN + GROUP BY + Aggregate COUNT)
    const [topDownloaded] = await pool.execute(`
      SELECT 
        d.dataset_id,
        d.dataset_name,
        d.domain,
        d.access_level,
        COUNT(dl.download_id) AS total_downloads,
        COALESCE(ROUND(AVG(r.rating), 2), 0.00) AS avg_rating
      FROM Datasets d
      LEFT JOIN Downloads dl ON d.dataset_id = dl.dataset_id
      LEFT JOIN Ratings r ON d.dataset_id = r.dataset_id
      WHERE d.approval_status = 'APPROVED'
      GROUP BY d.dataset_id, d.dataset_name, d.domain, d.access_level
      ORDER BY total_downloads DESC, avg_rating DESC
      LIMIT 6
    `);

    // 4. Most popular categories (SQL JOIN + GROUP BY + Aggregate COUNT)
    const [categoryStats] = await pool.execute(`
      SELECT 
        c.category_id,
        c.name AS category_name,
        COUNT(DISTINCT d.dataset_id) AS dataset_count,
        COUNT(dl.download_id) AS total_downloads
      FROM Categories c
      LEFT JOIN Datasets d ON c.category_id = d.category_id AND d.approval_status = 'APPROVED'
      LEFT JOIN Downloads dl ON d.dataset_id = dl.dataset_id
      GROUP BY c.category_id, c.name
      ORDER BY total_downloads DESC, dataset_count DESC
    `);

    // 5. Domain distribution breakdown
    const [domainStats] = await pool.execute(`
      SELECT 
        d.domain,
        COUNT(DISTINCT d.dataset_id) AS dataset_count,
        COUNT(dl.download_id) AS total_downloads
      FROM Datasets d
      LEFT JOIN Downloads dl ON d.dataset_id = dl.dataset_id
      WHERE d.approval_status = 'APPROVED'
      GROUP BY d.domain
      ORDER BY total_downloads DESC, dataset_count DESC
    `);

    // 6. Access Level distribution (PUBLIC vs RESTRICTED)
    const [accessStats] = await pool.execute(`
      SELECT 
        access_level,
        COUNT(*) AS count
      FROM Datasets
      WHERE approval_status = 'APPROVED'
      GROUP BY access_level
    `);

    // 7. Recent Uploads (JOIN Users + Categories + Datasets)
    const [recentUploads] = await pool.execute(`
      SELECT 
        d.dataset_id,
        d.dataset_name,
        d.domain,
        d.task_type,
        d.file_format,
        d.file_size_bytes,
        d.access_level,
        d.approval_status,
        d.created_at,
        u.user_id AS uploader_id,
        u.name AS uploader_name,
        u.email AS uploader_email,
        c.category_id,
        c.name AS category_name
      FROM Datasets d
      JOIN Users u ON d.uploader_id = u.user_id
      JOIN Categories c ON d.category_id = c.category_id
      ORDER BY d.created_at DESC
      LIMIT 8
    `);

    // 8. Recent platform downloads log (Audit trail)
    const [recentDownloads] = await pool.execute(`
      SELECT 
        dl.download_id,
        dl.downloaded_at,
        dl.ip_address,
        d.dataset_id,
        d.dataset_name,
        d.access_level,
        u.user_id,
        COALESCE(u.name, 'Public / Deleted User') AS user_name,
        u.email AS user_email
      FROM Downloads dl
      JOIN Datasets d ON dl.dataset_id = d.dataset_id
      LEFT JOIN Users u ON dl.user_id = u.user_id
      ORDER BY dl.downloaded_at DESC
      LIMIT 10
    `);

    return {
      kpis,
      top_downloaded: topDownloaded,
      category_distribution: categoryStats,
      domain_distribution: domainStats,
      access_distribution: accessStats,
      recent_uploads: recentUploads,
      recent_downloads: recentDownloads
    };
  }
}

module.exports = new AdminService();
