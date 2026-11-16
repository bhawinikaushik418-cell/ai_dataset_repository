const express = require('express');
const reviewController = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Ratings
router.post('/ratings', authenticate, (req, res, next) => reviewController.rate(req, res, next));
router.get('/ratings/:datasetId/my', authenticate, (req, res, next) => reviewController.getMyRating(req, res, next));

// Reviews
router.post('/reviews', authenticate, (req, res, next) => reviewController.createReview(req, res, next));
router.get('/reviews/:datasetId', (req, res, next) => reviewController.getReviews(req, res, next));
router.delete('/reviews/:id', authenticate, (req, res, next) => reviewController.deleteReview(req, res, next));

module.exports = router;
