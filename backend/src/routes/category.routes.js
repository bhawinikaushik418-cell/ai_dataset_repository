const express = require('express');
const categoryController = require('../controllers/category.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

const router = express.Router();

router.get('/', (req, res, next) => categoryController.getAll(req, res, next));
router.get('/tags', (req, res, next) => categoryController.getTags(req, res, next));
router.get('/:id', (req, res, next) => categoryController.getById(req, res, next));
router.post('/', authenticate, requireAdmin, (req, res, next) => categoryController.create(req, res, next));
router.put('/:id', authenticate, requireAdmin, (req, res, next) => categoryController.update(req, res, next));
router.delete('/:id', authenticate, requireAdmin, (req, res, next) => categoryController.delete(req, res, next));

module.exports = router;
