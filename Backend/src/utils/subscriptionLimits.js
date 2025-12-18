// Helper function to get plan limits
const PLAN_LIMITS = {
  basic: 50,
  pro: 500,
  enterprise: 2000,
};

/**
 * Get the monthly booking limit for a business based on their subscription plan
 * @param {Object} business - Business document
 * @returns {Number} - Monthly booking limit
 */
function getMonthlyLimit(business) {
  let plan = business?.subscription?.plan || 'basic';
  // Treat trial as basic
  if (plan === 'trial') plan = 'basic';
  return PLAN_LIMITS[plan] || PLAN_LIMITS.basic;
}

/**
 * Check if business needs monthly booking count reset
 * Reset happens at the start of each month
 * @param {Object} business - Business document
 * @returns {Boolean} - True if reset is needed
 */
function needsMonthlyReset(business) {
  if (!business?.subscription?.lastBookingReset) {
    return true;
  }
  
  const lastReset = new Date(business.subscription.lastBookingReset);
  const now = new Date();
  
  // Check if we're in a different month
  return lastReset.getMonth() !== now.getMonth() || 
         lastReset.getFullYear() !== now.getFullYear();
}

/**
 * Reset monthly booking count for a business
 * @param {Object} business - Business document
 */
async function resetMonthlyBookingCount(business) {
  business.subscription = business.subscription || {};
  business.subscription.monthlyBookingCount = 0;
  business.subscription.lastBookingReset = new Date();
  await business.save();
}

/**
 * Check if business has reached their monthly booking limit
 * Automatically resets count if new month
 * @param {Object} business - Business document
 * @returns {Object} - { allowed: Boolean, remaining: Number, limit: Number }
 */
async function checkBookingLimit(business) {
  // Check if reset is needed
  if (needsMonthlyReset(business)) {
    await resetMonthlyBookingCount(business);
  }
  
  const limit = getMonthlyLimit(business);
  const current = business?.subscription?.monthlyBookingCount || 0;
  const remaining = Math.max(0, limit - current);
  
  return {
    allowed: current < limit,
    remaining,
    limit,
    current
  };
}

/**
 * Increment monthly booking count for a business
 * @param {String} businessId - Business ID
 */
async function incrementBookingCount(businessId) {
  const Business = require('../models/businessSchema');
  
  await Business.findByIdAndUpdate(
    businessId,
    { $inc: { 'subscription.monthlyBookingCount': 1 } },
    { new: true }
  );
}

module.exports = {
  getMonthlyLimit,
  needsMonthlyReset,
  resetMonthlyBookingCount,
  checkBookingLimit,
  incrementBookingCount,
  PLAN_LIMITS
};
