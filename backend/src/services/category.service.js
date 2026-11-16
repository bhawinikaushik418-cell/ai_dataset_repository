const { pool } = require('../config/db');

class CategoryService {
  async getAllCategories() {
    const [rows] = await pool.execute(`
      SELECT 
        c.category_id,
        c.name,
        c.description,
        c.created_at,
        COUNT(d.dataset_id) AS dataset_count
      FROM Categories c
      LEFT JOIN Datasets d ON c.category_id = d.category_id AND d.approval_status = 'APPROVED'
      GROUP BY c.category_id, c.name, c.description, c.created_at
      ORDER BY c.name ASC
    `);
    return rows;
  }

  async getCategoryById(categoryId) {
    const [rows] = await pool.execute(
      'SELECT category_id, name, description, created_at FROM Categories WHERE category_id = ? LIMIT 1',
      [categoryId]
    );
    if (rows.length === 0) {
      const err = new Error('Category not found.');
      err.statusCode = 404;
      throw err;
    }
    return rows[0];
  }

  async createCategory({ name, description }) {
    const cleanName = name.trim();
    const [result] = await pool.execute(
      'INSERT INTO Categories (name, description) VALUES (?, ?)',
      [cleanName, description ? description.trim() : null]
    );
    return {
      category_id: result.insertId,
      name: cleanName,
      description: description || null
    };
  }

  async updateCategory(categoryId, { name, description }) {
    const cleanName = name.trim();
    const [result] = await pool.execute(
      'UPDATE Categories SET name = ?, description = ? WHERE category_id = ?',
      [cleanName, description ? description.trim() : null, categoryId]
    );
    if (result.affectedRows === 0) {
      const err = new Error('Category not found.');
      err.statusCode = 404;
      throw err;
    }
    return { category_id: Number(categoryId), name: cleanName, description };
  }

  async deleteCategory(categoryId) {
    // Check if category is associated with datasets
    const [datasets] = await pool.execute(
      'SELECT dataset_id FROM Datasets WHERE category_id = ? LIMIT 1',
      [categoryId]
    );

    if (datasets.length > 0) {
      const err = new Error('Cannot delete category: existing datasets are currently assigned to it.');
      err.statusCode = 400;
      throw err;
    }

    const [result] = await pool.execute(
      'DELETE FROM Categories WHERE category_id = ?',
      [categoryId]
    );

    if (result.affectedRows === 0) {
      const err = new Error('Category not found.');
      err.statusCode = 404;
      throw err;
    }

    return { category_id: Number(categoryId), deleted: true };
  }

  async getAllTags() {
    const [rows] = await pool.execute(`
      SELECT 
        t.tag_id,
        t.name,
        COUNT(dt.dataset_id) AS dataset_count
      FROM Tags t
      LEFT JOIN Dataset_Tags dt ON t.tag_id = dt.tag_id
      GROUP BY t.tag_id, t.name
      ORDER BY dataset_count DESC, t.name ASC
    `);
    return rows;
  }
}

module.exports = new CategoryService();
