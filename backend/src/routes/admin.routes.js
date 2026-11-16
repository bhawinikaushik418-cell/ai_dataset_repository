const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

const router = express.Router();

router.get('/analytics', authenticate, requireAdmin, (req, res, next) => adminController.getAnalytics(req, res, next));

module.exports = router;
