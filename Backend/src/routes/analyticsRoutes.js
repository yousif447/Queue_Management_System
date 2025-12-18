const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { checkPlan } = require('../middlewares/subscriptionMiddleware');

// All routes require authentication and business role
router.use(protect);
router.use(restrictTo('business'));

// Enterprise-only analytics endpoints
router.get('/revenue', checkPlan('enterprise'), analyticsController.getRevenueAnalytics);
router.get('/bookings', checkPlan('enterprise'), analyticsController.getBookingAnalytics);
router.get('/customers', checkPlan('enterprise'), analyticsController.getCustomerAnalytics);

module.exports = router;
