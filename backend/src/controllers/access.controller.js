const accessService = require('../services/access.service');
const { successResponse, errorResponse } = require('../utils/response');

class AccessController {
  async create(req, res, next) {
    try {
      const { dataset_id, justification } = req.body;

      if (!dataset_id) {
        return errorResponse(res, 400, 'Dataset ID is required.');
      }
      if (!justification || justification.trim().length < 10) {
        return errorResponse(res, 400, 'Justification must be at least 10 characters explaining your research intent.');
      }

      const request = await accessService.createRequest({
        datasetId: dataset_id,
        userId: req.user.userId,
        justification
      });

      return successResponse(res, 201, 'Access request submitted successfully.', request);
    } catch (error) {
      return next(error);
    }
  }

  async getMyRequests(req, res, next) {
    try {
      const requests = await accessService.getMyRequests(req.user.userId);
      return successResponse(res, 200, 'My access requests retrieved.', requests);
    } catch (error) {
      return next(error);
    }
  }

  async getAllRequests(req, res, next) {
    try {
      const result = await accessService.getAllRequests(req.query);
      return successResponse(res, 200, 'Access requests retrieved.', result.requests, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async review(req, res, next) {
    try {
      const { status, rejection_reason } = req.body;
      const result = await accessService.reviewRequest(
        req.params.id,
        { status, rejectionReason: rejection_reason },
        req.user.userId
      );
      return successResponse(res, 200, `Access request has been ${status.toLowerCase()}.`, result);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AccessController();
