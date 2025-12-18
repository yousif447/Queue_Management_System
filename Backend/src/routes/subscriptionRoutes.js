const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const subscriptionLimitsController = require("../controllers/subscriptionLimitsController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

// Public routes
router.get("/plans", subscriptionController.getPlans);

// Public route to check any business's booking limit
router.get("/business/:businessId/check", subscriptionLimitsController.checkBusinessBookingLimit);

// Webhook (must be before other routes, no auth)
router.post("/webhook", subscriptionController.subscriptionWebhook);

// Protected routes (business only)
router.use(protect);
router.use(restrictTo("business"));

router.post("/create-checkout", subscriptionController.createSubscriptionCheckout);
router.post("/confirm-session", (req, res, next) => {
  console.log('🔥 confirm-session route hit!');
  console.log('🔥 req.body:', req.body);
  next();
}, subscriptionController.confirmSession);
router.get("/session/:sessionId", subscriptionController.getSessionDetails);
router.get("/status", subscriptionController.getSubscriptionStatus);
router.get("/limits", subscriptionLimitsController.getSubscriptionLimits);
router.post("/cancel", subscriptionController.cancelSubscription);
router.post("/reactivate", subscriptionController.reactivateSubscription);

module.exports = router;

