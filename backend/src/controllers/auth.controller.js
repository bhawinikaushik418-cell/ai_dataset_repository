const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');
const { isValidEmail, isValidPassword } = require('../utils/validators');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      if (!name || name.trim().length < 2) {
        return errorResponse(res, 400, 'Name must be at least 2 characters long.');
      }
      if (!isValidEmail(email)) {
        return errorResponse(res, 400, 'Please provide a valid email address.');
      }
      if (!isValidPassword(password)) {
        return errorResponse(res, 400, 'Password must be at least 6 characters long.');
      }

      // Security check: Notice role is never extracted from req.body; authService assigns 'USER'
      const result = await authService.register({ name, email, password });
      return successResponse(res, 201, 'User registered successfully.', result);
    } catch (error) {
      return next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!isValidEmail(email) || !password) {
        return errorResponse(res, 400, 'Please provide a valid email and password.');
      }

      const result = await authService.login({ email, password });
      return successResponse(res, 200, 'Login successful.', result);
    } catch (error) {
      return next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const result = await authService.logout(req.tokenSignature, req.user.userId, req.tokenExp);
      return successResponse(res, 200, result.message, null);
    } catch (error) {
      return next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.userId);
      return successResponse(res, 200, 'Current user profile retrieved.', user);
    } catch (error) {
      return next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const users = await authService.getAllUsers();
      return successResponse(res, 200, 'Users retrieved successfully.', users);
    } catch (error) {
      return next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
        return errorResponse(res, 400, 'Status must be either ACTIVE or SUSPENDED.');
      }

      const updated = await authService.updateUserStatus(id, status);
      return successResponse(res, 200, `User status updated to ${status}.`, updated);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AuthController();
