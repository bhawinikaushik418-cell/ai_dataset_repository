const categoryService = require('../services/category.service');
const { successResponse, errorResponse } = require('../utils/response');

class CategoryController {
  async getAll(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories();
      return successResponse(res, 200, 'Categories retrieved successfully.', categories);
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      return successResponse(res, 200, 'Category retrieved successfully.', category);
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { name, description } = req.body;
      if (!name || name.trim().length < 2) {
        return errorResponse(res, 400, 'Category name must be at least 2 characters long.');
      }
      const category = await categoryService.createCategory({ name, description });
      return successResponse(res, 201, 'Category created successfully.', category);
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { name, description } = req.body;
      if (!name || name.trim().length < 2) {
        return errorResponse(res, 400, 'Category name must be at least 2 characters long.');
      }
      const category = await categoryService.updateCategory(req.params.id, { name, description });
      return successResponse(res, 200, 'Category updated successfully.', category);
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await categoryService.deleteCategory(req.params.id);
      return successResponse(res, 200, 'Category deleted successfully.', result);
    } catch (error) {
      return next(error);
    }
  }

  async getTags(req, res, next) {
    try {
      const tags = await categoryService.getAllTags();
      return successResponse(res, 200, 'Tags retrieved successfully.', tags);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new CategoryController();
