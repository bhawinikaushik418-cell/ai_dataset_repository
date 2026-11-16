const express = require('express');
const datasetController = require('../controllers/dataset.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// Public / Semi-public listing & details
router.get('/', optionalAuth, (req, res, next) => datasetController.getAll(req, res, next));
router.get('/my/uploads', authenticate, (req, res, next) => datasetController.getMyUploads(req, res, next));
router.get('/my/downloads', authenticate, (req, res, next) => datasetController.getMyDownloads(req, res, next));
router.get('/:id', optionalAuth, (req, res, next) => datasetController.getById(req, res, next));

// Protected Download (strictly authenticated; enforces public vs restricted access request checks)
router.get('/:id/download', authenticate, (req, res, next) => datasetController.download(req, res, next));

// Protected dataset management
router.post('/', authenticate, upload.single('dataset_file'), (req, res, next) => datasetController.create(req, res, next));
router.put('/:id', authenticate, (req, res, next) => datasetController.update(req, res, next));
router.delete('/:id', authenticate, (req, res, next) => datasetController.delete(req, res, next));

// Admin approval
router.patch('/:id/approval', authenticate, requireAdmin, (req, res, next) => datasetController.updateApproval(req, res, next));

module.exports = router;
