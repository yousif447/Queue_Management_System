const { getMonthlyLimit, checkBookingLimit, PLAN_LIMITS } = require('../utils/subscriptionLimits');
const Business = require('../models/businessSchema');

/**
 * GET /api/v1/subscription/limits
 * Get subscription limits and current usage for the authenticated business
 */
exports.getSubscriptionLimits = async (req, res) => {
  try {
    const businessId = req.user.id;
    
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    const limitCheck = await checkBookingLimit(business);
    const monthlyLimit = getMonthlyLimit(business);
    const currentPlan = business?.subscription?.plan || 'basic';

    res.status(200).json({
      success: true,
      data: {
        plan: currentPlan,
        monthlyLimit,
        monthlyUsed: business?.subscription?.monthlyBookingCount || 0,
        remaining: limitCheck.remaining,
        allowed: limitCheck.allowed,
        lastReset: business?.subscription?.lastBookingReset,
        allPlans: PLAN_LIMITS
      }
    });
  } catch (error) {
    console.error('Get subscription limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving subscription limits'
    });
  }
};

/**
 * GET /api/v1/subscription-limits/business/:businessId/check
 * Public endpoint to check if a business can accept more bookings
 */
exports.checkBusinessBookingLimit = async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    const limitCheck = await checkBookingLimit(business);
    const monthlyLimit = getMonthlyLimit(business);
    const currentPlan = business?.subscription?.plan || 'basic';

    res.status(200).json({
      success: true,
      data: {
        businessId,
        plan: currentPlan,
        limit: monthlyLimit,
        current: business?.subscription?.monthlyBookingCount || 0,
        remaining: limitCheck.remaining,
        allowed: limitCheck.allowed
      }
    });
  } catch (error) {
    console.error('Check business booking limit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking booking limit'
    });
  }
};

module.exports = exports;

