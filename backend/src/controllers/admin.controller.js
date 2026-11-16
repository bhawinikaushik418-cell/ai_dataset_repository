const adminService = require('../services/admin.service');
const { successResponse } = require('../utils/response');

class AdminController {
  async getAnalytics(req, res, next) {
    try {
      const analytics = await adminService.getAnalytics();
      return successResponse(res, 200, 'Repository analytics retrieved.', analytics);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AdminController();
