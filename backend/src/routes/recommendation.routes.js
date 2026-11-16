const express = require('express');
const recommendationController = require('../controllers/recommendation.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', optionalAuth, (req, res, next) => recommendationController.recommend(req, res, next));

module.exports = router;
