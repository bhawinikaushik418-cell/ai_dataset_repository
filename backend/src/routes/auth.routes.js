const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

const router = express.Router();

router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));
router.get('/users', authenticate, requireAdmin, (req, res, next) => authController.getUsers(req, res, next));
router.patch('/users/:id/status', authenticate, requireAdmin, (req, res, next) => authController.updateUserStatus(req, res, next));

module.exports = router;
