const Business = require('../models/businessSchema');

// -------------------------
// Check Subscription Plan Middleware
// Verifies if the business has the required plan level (or higher)
// -------------------------
exports.checkPlan = (requiredPlan) => {
  return async (req, res, next) => {
    try {
      // req.user is set by protect middleware
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized'
        });
      }

      // Fetch fresh business data to ensure subscription is up to date
      const business = await Business.findById(req.user.id);
      
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      const plan = business.subscription?.plan || 'basic';
      const status = business.subscription?.status || 'inactive';

      // Define plan hierarchy
      const levels = {
        'basic': 1,
        'pro': 2,
        'enterprise': 3
      };

      const userLevel = levels[plan] || 0;
      const requiredLevel = levels[requiredPlan] || 0;

      // Allow if user level is greater than or equal to required
      if (userLevel >= requiredLevel) {
        // Also check if subscription is active (unless it's a trial)
        if (status === 'active' || status === 'trial') {
          return next();
        } else {
          return res.status(403).json({
            success: false,
            message: 'Subscription is inactive. Please make a payment.'
          });
        }
      }

      return res.status(403).json({
        success: false,
        message: `This feature requires the ${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} plan. You are currently on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.`
      });

    } catch (error) {
      console.error('Plan check middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying subscription plan'
      });
    }
  };
};

// -------------------------
// Check Subscription Status Middleware
// Ensures the subscription is active regardless of plan
// -------------------------
exports.checkSubscriptionStatus = async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.id);
    const status = business?.subscription?.status;

    if (status === 'active' || status === 'trial') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Active subscription required'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking subscription status'
    });
  }
};
