const express = require('express');
const accessController = require('../controllers/access.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

const router = express.Router();

router.post('/', authenticate, (req, res, next) => accessController.create(req, res, next));
router.get('/my', authenticate, (req, res, next) => accessController.getMyRequests(req, res, next));
router.get('/', authenticate, requireAdmin, (req, res, next) => accessController.getAllRequests(req, res, next));
router.patch('/:id/review', authenticate, requireAdmin, (req, res, next) => accessController.review(req, res, next));

module.exports = router;
