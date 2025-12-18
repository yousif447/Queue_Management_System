const express = require('express');
const router = express.Router();
const migrationController = require('../controllers/migrationController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Protected route - admin only for safety
router.post('/subscription-plans', protect, restrictTo('admin', 'business'), migrationController.migrateSubscriptionPlans);

module.exports = router;
