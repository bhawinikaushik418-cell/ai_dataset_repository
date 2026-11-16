const recommenderService = require('../services/recommender.service');
const { successResponse, errorResponse } = require('../utils/response');

class RecommendationController {
  async recommend(req, res, next) {
    try {
      const { query, task_type, domain, data_type, difficulty_level, limit } = req.body;

      const recommendations = await recommenderService.getRecommendations(
        { query, task_type, domain, data_type, difficulty_level, limit },
        req.user
      );

      return successResponse(res, 200, 'Recommendations generated successfully.', recommendations);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new RecommendationController();
