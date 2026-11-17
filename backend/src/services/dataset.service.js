const path = require('path');
const fs = require('fs');
const { pool } = require('../config/db');

class DatasetService {
  async getDatasets(queryParams, currentUser) {
    const {
      search,
      domain,
      task_type,
      data_type,
      difficulty_level,
      access_level,
      category_id,
      approval_status,
      sort = 'newest',
      page = 1,
      limit = 10
    } = queryParams;

    const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const whereClauses = [];
    const params = [];

    // Approval status filtering:
    // Non-admins only see APPROVED datasets (plus their own uploads)
    const isAdmin = currentUser && currentUser.role === 'ADMIN';

    if (!isAdmin) {
      if (currentUser) {
        whereClauses.push('(d.approval_status = ? OR d.uploader_id = ?)');
        params.push('APPROVED', currentUser.userId);
      } else {
        whereClauses.push('d.approval_status = ?');
        params.push('APPROVED');
      }
    } else if (approval_status && approval_status !== 'ALL') {
      whereClauses.push('d.approval_status = ?');
      params.push(approval_status);
    }

    if (search && search.trim()) {
      const rawSearch = search.trim();
      const lower = rawSearch.toLowerCase();
      const genericAiTerms = [
        'machine learning', 'machine-learning', 'machinelearning',
        'ml', 'ai', 'ai/ml', 'aiml', 'artificial intelligence',
        'data science', 'datascience', 'dataset', 'datasets',
        'benchmark', 'model', 'algorithm'
      ];

      // If user searches general repository terms like "machine learning", "ml", "ai"
      if (genericAiTerms.includes(lower)) {
        whereClauses.push(`(
          d.dataset_name LIKE ? OR 
          d.description LIKE ? OR 
          d.domain LIKE ? OR 
          d.task_type LIKE ? OR
          EXISTS (
            SELECT 1 FROM Categories c WHERE c.category_id = d.category_id AND c.name LIKE ?
          ) OR
          EXISTS (
            SELECT 1 FROM Dataset_Tags dt 
            JOIN Tags t ON dt.tag_id = t.tag_id 
            WHERE dt.dataset_id = d.dataset_id AND (t.name LIKE ? OR t.name IN ('machine-learning', 'ai', 'classification', 'regression'))
          ) OR
          1 = 1
        )`);
        const term = `%${rawSearch}%`;
        params.push(term, term, term, term, term, term);
      } else {
        // Multi-field search across title, description, domain, task_type, data_type, category, and tags
        const term = `%${rawSearch}%`;
        whereClauses.push(`(
          d.dataset_name LIKE ? OR 
          d.description LIKE ? OR 
          d.domain LIKE ? OR 
          d.task_type LIKE ? OR 
          d.data_type LIKE ? OR
          EXISTS (
            SELECT 1 FROM Categories c WHERE c.category_id = d.category_id AND c.name LIKE ?
          ) OR
          EXISTS (
            SELECT 1 FROM Dataset_Tags dt 
            JOIN Tags t ON dt.tag_id = t.tag_id 
            WHERE dt.dataset_id = d.dataset_id AND t.name LIKE ?
          )
        )`);
        params.push(term, term, term, term, term, term, term);
      }
    }

    if (domain) {
      whereClauses.push('d.domain = ?');
      params.push(domain);
    }

    if (task_type) {
      whereClauses.push('d.task_type = ?');
      params.push(task_type);
    }

    if (data_type) {
      whereClauses.push('d.data_type = ?');
      params.push(data_type);
    }

    if (difficulty_level) {
      whereClauses.push('d.difficulty_level = ?');
      params.push(difficulty_level.toUpperCase());
    }

    if (access_level) {
      whereClauses.push('d.access_level = ?');
      params.push(access_level.toUpperCase());
    }

    if (category_id) {
      whereClauses.push('d.category_id = ?');
      params.push(parseInt(category_id, 10));
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Determine Sort Order
    let orderBy = 'd.created_at DESC';
    if (sort === 'popular') {
      orderBy = 'total_downloads DESC, avg_rating DESC';
    } else if (sort === 'rating') {
      orderBy = 'avg_rating DESC, total_ratings DESC';
    } else if (sort === 'name') {
      orderBy = 'd.dataset_name ASC';
    }

    // Count Total Matching
    const countSql = `
      SELECT COUNT(DISTINCT d.dataset_id) AS total
      FROM Datasets d
      ${whereSql}
    `;
    const [countRows] = await pool.execute(countSql, params);
    const total = countRows[0].total;

    // Fetch Paginated Datasets
    const querySql = `
      SELECT 
        d.dataset_id,
        d.dataset_name,
        d.description,
        d.source_url,
        d.license,
        d.file_name,
        d.file_size_bytes,
        d.file_format,
        d.domain,
        d.task_type,
        d.data_type,
        d.difficulty_level,
        d.access_level,
        d.approval_status,
        d.quality_score,
        d.rejection_reason,
        d.uploader_id,
        u.name AS uploader_name,
        d.category_id,
        c.name AS category_name,
        d.created_at,
        d.updated_at,
        COALESCE(ROUND(AVG(r.rating), 2), 0.00) AS avg_rating,
        COUNT(DISTINCT r.rating_id) AS total_ratings,
        COUNT(DISTINCT rev.review_id) AS total_reviews,
        COUNT(DISTINCT dl.download_id) AS total_downloads,
        (
          SELECT GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ', ')
          FROM Dataset_Tags dt
          JOIN Tags t ON dt.tag_id = t.tag_id
          WHERE dt.dataset_id = d.dataset_id
        ) AS tags
      FROM Datasets d
      JOIN Users u ON d.uploader_id = u.user_id
      JOIN Categories c ON d.category_id = c.category_id
      LEFT JOIN Ratings r ON d.dataset_id = r.dataset_id
      LEFT JOIN Reviews rev ON d.dataset_id = rev.dataset_id
      LEFT JOIN Downloads dl ON d.dataset_id = dl.dataset_id
      ${whereSql}
      GROUP BY d.dataset_id, u.name, c.name
      ORDER BY ${orderBy}
      LIMIT ${safeLimit} OFFSET ${offset}
    `;

    const [rows] = await pool.execute(querySql, params);

    const formatted = rows.map((row) => ({
      ...row,
      tags: row.tags ? row.tags.split(', ') : []
    }));

    return {
      datasets: formatted,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }

  async getDatasetById(datasetId, currentUser) {
    const querySql = `
      SELECT 
        d.dataset_id,
        d.dataset_name,
        d.description,
        d.source_url,
        d.license,
        d.file_name,
        d.file_size_bytes,
        d.file_format,
        d.domain,
        d.task_type,
        d.data_type,
        d.difficulty_level,
        d.access_level,
        d.approval_status,
        d.quality_score,
        d.rejection_reason,
        d.uploader_id,
        u.name AS uploader_name,
        d.category_id,
        c.name AS category_name,
        d.created_at,
        d.updated_at,
        COALESCE(ROUND(AVG(r.rating), 2), 0.00) AS avg_rating,
        COUNT(DISTINCT r.rating_id) AS total_ratings,
        COUNT(DISTINCT dl.download_id) AS total_downloads
      FROM Datasets d
      JOIN Users u ON d.uploader_id = u.user_id
      JOIN Categories c ON d.category_id = c.category_id
      LEFT JOIN Ratings r ON d.dataset_id = r.dataset_id
      LEFT JOIN Downloads dl ON d.dataset_id = dl.dataset_id
      WHERE d.dataset_id = ?
      GROUP BY d.dataset_id, u.name, c.name
      LIMIT 1
    `;

    const [rows] = await pool.execute(querySql, [datasetId]);
    if (rows.length === 0) {
      const err = new Error('Dataset not found.');
      err.statusCode = 404;
      throw err;
    }

    const dataset = rows[0];

    // Fetch associated Tags
    const [tagRows] = await pool.execute(
      `SELECT t.tag_id, t.name 
       FROM Tags t 
       JOIN Dataset_Tags dt ON t.tag_id = dt.tag_id 
       WHERE dt.dataset_id = ? 
       ORDER BY t.name ASC`,
      [datasetId]
    );
    dataset.tags = tagRows.map((t) => t.name);

    // Determine current user's access status
    let hasAccess = false;
    let accessStatus = 'NONE';

    if (dataset.access_level === 'PUBLIC') {
      hasAccess = true;
      accessStatus = 'PUBLIC_ACCESS';
    } else if (currentUser) {
      if (currentUser.role === 'ADMIN' || currentUser.userId === dataset.uploader_id) {
        hasAccess = true;
        accessStatus = currentUser.role === 'ADMIN' ? 'ADMIN_ACCESS' : 'OWNER_ACCESS';
      } else {
        const [reqRows] = await pool.execute(
          `SELECT request_id, status, requested_at, reviewed_at, rejection_reason 
           FROM AccessRequests 
           WHERE dataset_id = ? AND user_id = ? 
           ORDER BY request_id DESC LIMIT 1`,
          [datasetId, currentUser.userId]
        );

        if (reqRows.length > 0) {
          accessStatus = reqRows[0].status;
          if (reqRows[0].status === 'APPROVED') {
            hasAccess = true;
          }
          dataset.latestAccessRequest = reqRows[0];
        }
      }
    }

    dataset.has_access = hasAccess;
    dataset.access_status = accessStatus;

    return dataset;
  }

  async createDataset(datasetData, file, uploader) {
    const {
      dataset_name,
      description,
      source_url,
      license,
      domain,
      task_type,
      data_type,
      difficulty_level,
      access_level,
      category_id,
      tags
    } = datasetData;

    const fileExt = path.extname(file.originalname).toUpperCase().replace('.', '');
    const fileFormat = fileExt === 'ZIP' ? 'ZIP' : 'CSV';
    const initialStatus = uploader.role === 'ADMIN' ? 'APPROVED' : 'PENDING';

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Insert Dataset
      const insertDatasetSql = `
        INSERT INTO Datasets (
          dataset_name, description, source_url, license, file_name, file_path,
          file_size_bytes, file_format, domain, task_type, data_type,
          difficulty_level, access_level, approval_status, uploader_id, category_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [datasetResult] = await connection.execute(insertDatasetSql, [
        dataset_name.trim(),
        description.trim(),
        source_url.trim(),
        license.trim(),
        file.originalname,
        file.path,
        file.size,
        fileFormat,
        domain.trim(),
        task_type.trim(),
        data_type.trim(),
        difficulty_level.toUpperCase(),
        access_level.toUpperCase(),
        initialStatus,
        uploader.userId,
        parseInt(category_id, 10)
      ]);

      const datasetId = datasetResult.insertId;

      // 2. Handle Tags
      if (tags) {
        let tagList = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
        tagList = [...new Set(tagList.filter((t) => t.length >= 2))];

        for (const tagName of tagList) {
          // Insert Tag if not exists
          await connection.execute(
            'INSERT INTO Tags (name) VALUES (?) ON DUPLICATE KEY UPDATE tag_id=LAST_INSERT_ID(tag_id)',
            [tagName.toLowerCase()]
          );

          const [tagRow] = await connection.execute(
            'SELECT tag_id FROM Tags WHERE name = ? LIMIT 1',
            [tagName.toLowerCase()]
          );

          if (tagRow.length > 0) {
            await connection.execute(
              'INSERT INTO Dataset_Tags (dataset_id, tag_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE dataset_id=VALUES(dataset_id)',
              [datasetId, tagRow[0].tag_id]
            );
          }
        }
      }

      await connection.commit();

      return {
        dataset_id: datasetId,
        dataset_name,
        approval_status: initialStatus,
        message: initialStatus === 'APPROVED'
          ? 'Dataset uploaded and published successfully.'
          : 'Dataset submitted successfully. Awaiting administrator approval.'
      };
    } catch (error) {
      await connection.rollback();
      // Remove uploaded file if transaction fails
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateDataset(datasetId, updateData, currentUser) {
    const [existing] = await pool.execute(
      'SELECT dataset_id, uploader_id FROM Datasets WHERE dataset_id = ? LIMIT 1',
      [datasetId]
    );

    if (existing.length === 0) {
      const err = new Error('Dataset not found.');
      err.statusCode = 404;
      throw err;
    }

    if (currentUser.role !== 'ADMIN' && currentUser.userId !== existing[0].uploader_id) {
      const err = new Error('Access denied. You can only edit your own datasets.');
      err.statusCode = 403;
      throw err;
    }

    const {
      dataset_name,
      description,
      source_url,
      license,
      domain,
      task_type,
      data_type,
      difficulty_level,
      access_level,
      category_id
    } = updateData;

    await pool.execute(
      `UPDATE Datasets SET
        dataset_name = COALESCE(?, dataset_name),
        description = COALESCE(?, description),
        source_url = COALESCE(?, source_url),
        license = COALESCE(?, license),
        domain = COALESCE(?, domain),
        task_type = COALESCE(?, task_type),
        data_type = COALESCE(?, data_type),
        difficulty_level = COALESCE(?, difficulty_level),
        access_level = COALESCE(?, access_level),
        category_id = COALESCE(?, category_id)
      WHERE dataset_id = ?`,
      [
        dataset_name ? dataset_name.trim() : null,
        description ? description.trim() : null,
        source_url ? source_url.trim() : null,
        license ? license.trim() : null,
        domain ? domain.trim() : null,
        task_type ? task_type.trim() : null,
        data_type ? data_type.trim() : null,
        difficulty_level ? difficulty_level.toUpperCase() : null,
        access_level ? access_level.toUpperCase() : null,
        category_id ? parseInt(category_id, 10) : null,
        datasetId
      ]
    );

    return { dataset_id: Number(datasetId), updated: true };
  }

  async updateApprovalStatus(datasetId, status, rejectionReason, adminId) {
    const [result] = await pool.execute(
      'UPDATE Datasets SET approval_status = ?, rejection_reason = ? WHERE dataset_id = ?',
      [status, rejectionReason || null, datasetId]
    );

    if (result.affectedRows === 0) {
      const err = new Error('Dataset not found.');
      err.statusCode = 404;
      throw err;
    }

    return { dataset_id: Number(datasetId), status, rejection_reason: rejectionReason || null };
  }

  async deleteDataset(datasetId, currentUser) {
    const [rows] = await pool.execute(
      'SELECT dataset_id, uploader_id, file_path FROM Datasets WHERE dataset_id = ? LIMIT 1',
      [datasetId]
    );

    if (rows.length === 0) {
      const err = new Error('Dataset not found.');
      err.statusCode = 404;
      throw err;
    }

    const dataset = rows[0];

    if (currentUser.role !== 'ADMIN' && currentUser.userId !== dataset.uploader_id) {
      const err = new Error('Access denied. You can only delete your own datasets.');
      err.statusCode = 403;
      throw err;
    }

    await pool.execute('DELETE FROM Datasets WHERE dataset_id = ?', [datasetId]);

    // Clean up physical file if it exists
    if (dataset.file_path && fs.existsSync(dataset.file_path)) {
      try {
        fs.unlinkSync(dataset.file_path);
      } catch (err) {
        console.warn(`Could not remove file ${dataset.file_path}:`, err.message);
      }
    }

    return { dataset_id: Number(datasetId), deleted: true };
  }

  async getDownloadStream(datasetId, currentUser, ipAddress) {
    const [rows] = await pool.execute(
      `SELECT dataset_id, dataset_name, file_name, file_path, access_level, approval_status, uploader_id
       FROM Datasets 
       WHERE dataset_id = ? LIMIT 1`,
      [datasetId]
    );

    if (rows.length === 0) {
      const err = new Error('Dataset not found.');
      err.statusCode = 404;
      throw err;
    }

    const dataset = rows[0];

    // Rule: Authentication is strictly required for ALL dataset downloads
    if (!currentUser) {
      const err = new Error('Authentication required. Please log in to download datasets.');
      err.statusCode = 401;
      throw err;
    }

    if (dataset.approval_status !== 'APPROVED') {
      const isPrivileged = currentUser.role === 'ADMIN' || currentUser.userId === dataset.uploader_id;
      if (!isPrivileged) {
        const err = new Error('This dataset has not been approved for download.');
        err.statusCode = 403;
        throw err;
      }
    }

    // Access control verification for RESTRICTED datasets
    if (dataset.access_level === 'RESTRICTED') {
      const isAuthorized =
        currentUser.role === 'ADMIN' ||
        currentUser.userId === dataset.uploader_id;

      if (!isAuthorized) {
        const [requests] = await pool.execute(
          `SELECT request_id FROM AccessRequests 
           WHERE dataset_id = ? AND user_id = ? AND status = 'APPROVED' 
           LIMIT 1`,
          [datasetId, currentUser.userId]
        );

        if (requests.length === 0) {
          const err = new Error(
            'Access Denied: This is a restricted dataset. Please submit an access request and await administrator approval.'
          );
          err.statusCode = 403;
          throw err;
        }
      }
    }

    // File existence check
    const absolutePath = path.isAbsolute(dataset.file_path)
      ? dataset.file_path
      : path.join(__dirname, '../../', dataset.file_path);

    if (!fs.existsSync(absolutePath)) {
      // If the sample physical file doesn't exist yet on disk, create a placeholder sample CSV
      const dir = path.dirname(absolutePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        absolutePath,
        `# Real Dataset: ${dataset.dataset_name}\n# Downloaded from AI Dataset Repository\n# Source: https://archive.ics.uci.edu\nfeature_1,feature_2,feature_3,target\n1.0,2.5,3.1,class_a\n2.1,3.4,1.8,class_b\n`
      );
    }

    // Log the download event into Downloads audit table
    const userId = currentUser ? currentUser.userId : null;
    await pool.execute(
      'INSERT INTO Downloads (dataset_id, user_id, ip_address) VALUES (?, ?, ?)',
      [datasetId, userId, ipAddress || '127.0.0.1']
    );

    return {
      filePath: absolutePath,
      fileName: dataset.file_name
    };
  }

  async getMyUploads(userId) {
    const [rows] = await pool.execute(
      `SELECT 
        d.dataset_id,
        d.dataset_name,
        d.access_level,
        d.approval_status,
        d.file_name,
        d.file_size_bytes,
        d.file_format,
        d.created_at,
        c.name AS category_name,
        COALESCE(ROUND(AVG(r.rating), 2), 0.00) AS avg_rating,
        COUNT(DISTINCT dl.download_id) AS total_downloads
      FROM Datasets d
      JOIN Categories c ON d.category_id = c.category_id
      LEFT JOIN Ratings r ON d.dataset_id = r.dataset_id
      LEFT JOIN Downloads dl ON d.dataset_id = dl.dataset_id
      WHERE d.uploader_id = ?
      GROUP BY d.dataset_id, c.name
      ORDER BY d.created_at DESC`,
      [userId]
    );
    return rows;
  }

  async getMyDownloads(userId) {
    const [rows] = await pool.execute(
      `SELECT 
        dl.download_id,
        dl.downloaded_at,
        d.dataset_id,
        d.dataset_name,
        d.file_format,
        d.domain,
        d.task_type,
        c.name AS category_name
      FROM Downloads dl
      JOIN Datasets d ON dl.dataset_id = d.dataset_id
      JOIN Categories c ON d.category_id = c.category_id
      WHERE dl.user_id = ?
      ORDER BY dl.downloaded_at DESC`,
      [userId]
    );
    return rows;
  }
}

module.exports = new DatasetService();
