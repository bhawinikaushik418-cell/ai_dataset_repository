const reviewService = require('../services/review.service');
const { successResponse, errorResponse } = require('../utils/response');
const { isValidRating } = require('../utils/validators');

class ReviewController {
  async rate(req, res, next) {
    try {
      const { dataset_id, rating } = req.body;

      if (!dataset_id) {
        return errorResponse(res, 400, 'Dataset ID is required.');
      }
      if (!isValidRating(rating)) {
        return errorResponse(res, 400, 'Rating must be an integer between 1 and 5 stars.');
      }

      const result = await reviewService.rateDataset({
        datasetId: dataset_id,
        userId: req.user.userId,
        rating
      });

      return successResponse(res, 200, 'Rating submitted successfully.', result);
    } catch (error) {
      return next(error);
    }
  }

  async getMyRating(req, res, next) {
    try {
      const rating = await reviewService.getUserRating(req.params.datasetId, req.user.userId);
      return successResponse(res, 200, 'User rating retrieved.', rating);
    } catch (error) {
      return next(error);
    }
  }

  async createReview(req, res, next) {
    try {
      const { dataset_id, review_text } = req.body;

      if (!dataset_id) {
        return errorResponse(res, 400, 'Dataset ID is required.');
      }
      if (!review_text || review_text.trim().length < 5) {
        return errorResponse(res, 400, 'Review text must be at least 5 characters long.');
      }

      const result = await reviewService.createReview({
        datasetId: dataset_id,
        userId: req.user.userId,
        reviewText: review_text
      });

      return successResponse(res, 201, 'Review posted successfully.', result);
    } catch (error) {
      return next(error);
    }
  }

  async getReviews(req, res, next) {
    try {
      const result = await reviewService.getDatasetReviews(req.params.datasetId, req.query);
      return successResponse(res, 200, 'Reviews retrieved.', result.reviews, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async deleteReview(req, res, next) {
    try {
      const result = await reviewService.deleteReview(req.params.id, req.user);
      return successResponse(res, 200, 'Review deleted successfully.', result);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ReviewController();
