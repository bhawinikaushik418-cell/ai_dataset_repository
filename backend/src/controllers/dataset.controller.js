const datasetService = require('../services/dataset.service');
const { successResponse, errorResponse } = require('../utils/response');
const { isValidUrl } = require('../utils/validators');

class DatasetController {
  async getAll(req, res, next) {
    try {
      const result = await datasetService.getDatasets(req.query, req.user);
      return successResponse(res, 200, 'Datasets retrieved successfully.', result.datasets, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const dataset = await datasetService.getDatasetById(req.params.id, req.user);
      return successResponse(res, 200, 'Dataset details retrieved.', dataset);
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      if (!req.file) {
        return errorResponse(res, 400, 'Dataset file (.csv or .zip) is required.');
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
      } = req.body;

      if (!dataset_name || dataset_name.trim().length < 2) {
        return errorResponse(res, 400, 'Dataset name must be at least 2 characters.');
      }
      if (!description || description.trim().length < 10) {
        return errorResponse(res, 400, 'Description must be at least 10 characters.');
      }
      if (!isValidUrl(source_url)) {
        return errorResponse(res, 400, 'A valid source URL (e.g. UCI ML Repository) is required.');
      }
      if (!license || !domain || !task_type || !data_type || !category_id) {
        return errorResponse(res, 400, 'Missing required dataset metadata fields.');
      }

      const validDifficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
      if (!validDifficulties.includes((difficulty_level || '').toUpperCase())) {
        return errorResponse(res, 400, 'Difficulty level must be BEGINNER, INTERMEDIATE, or ADVANCED.');
      }

      const validAccess = ['PUBLIC', 'RESTRICTED'];
      if (!validAccess.includes((access_level || '').toUpperCase())) {
        return errorResponse(res, 400, 'Access level must be PUBLIC or RESTRICTED.');
      }

      const result = await datasetService.createDataset(req.body, req.file, req.user);
      return successResponse(res, 201, result.message, result);
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const updated = await datasetService.updateDataset(req.params.id, req.body, req.user);
      return successResponse(res, 200, 'Dataset updated successfully.', updated);
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await datasetService.deleteDataset(req.params.id, req.user);
      return successResponse(res, 200, 'Dataset deleted successfully.', result);
    } catch (error) {
      return next(error);
    }
  }

  async updateApproval(req, res, next) {
    try {
      const { status, rejection_reason } = req.body;
      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return errorResponse(res, 400, 'Status must be APPROVED or REJECTED.');
      }
      if (status === 'REJECTED' && (!rejection_reason || rejection_reason.trim().length < 5)) {
        return errorResponse(res, 400, 'Rejection reason of at least 5 characters is required when rejecting a dataset.');
      }

      const result = await datasetService.updateApprovalStatus(
        req.params.id,
        status,
        rejection_reason,
        req.user.userId
      );
      return successResponse(res, 200, `Dataset status updated to ${status}.`, result);
    } catch (error) {
      return next(error);
    }
  }

  async download(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const fileInfo = await datasetService.getDownloadStream(req.params.id, req.user, ip);
      return res.download(fileInfo.filePath, fileInfo.fileName);
    } catch (error) {
      return next(error);
    }
  }

  async getMyUploads(req, res, next) {
    try {
      const uploads = await datasetService.getMyUploads(req.user.userId);
      return successResponse(res, 200, 'My uploads retrieved.', uploads);
    } catch (error) {
      return next(error);
    }
  }

  async getMyDownloads(req, res, next) {
    try {
      const downloads = await datasetService.getMyDownloads(req.user.userId);
      return successResponse(res, 200, 'My downloads retrieved.', downloads);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new DatasetController();
