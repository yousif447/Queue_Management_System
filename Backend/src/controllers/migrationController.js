const Business = require('../models/businessSchema');

/**
 * Migration script to update old subscription plan names to new ones
 * Old: starter, professional, trial
 * New: basic, pro, enterprise
 */
exports.migrateSubscriptionPlans = async (req, res) => {
  try {
    console.log('Starting subscription plan migration...');
    
    // Map old plan names to new ones
    const planMapping = {
      'trial': 'basic',
      'starter': 'pro',
      'professional': 'enterprise'
    };

    let updatedCount = 0;
    let errorCount = 0;

    // Find all businesses
    const businesses = await Business.find({});
    
    for (const business of businesses) {
      try {
        let needsUpdate = false;
        
        // Initialize subscription if it doesn't exist
        if (!business.subscription) {
          business.subscription = {
            plan: 'basic',
            status: 'active',
            monthlyBookingCount: 0,
            lastBookingReset: new Date()
          };
          needsUpdate = true;
        } else {
          // Update plan name if it's an old one
          const currentPlan = business.subscription.plan;
          if (planMapping[currentPlan]) {
            business.subscription.plan = planMapping[currentPlan];
            needsUpdate = true;
          }
          
          // Ensure new fields exist
          if (business.subscription.monthlyBookingCount === undefined) {
            business.subscription.monthlyBookingCount = 0;
            needsUpdate = true;
          }
          
          if (!business.subscription.lastBookingReset) {
            business.subscription.lastBookingReset = new Date();
            needsUpdate = true;
          }

          // Update status if it's "trialing"
          if (business.subscription.status === 'trialing') {
            business.subscription.status = 'active';
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          await business.save();
          updatedCount++;
          console.log(`Updated business: ${business.name} (${business.email})`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error updating business ${business._id}:`, error.message);
      }
    }

    console.log('Migration completed!');
    console.log(`Total businesses: ${businesses.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);

    res.status(200).json({
      success: true,
      message: 'Subscription plan migration completed',
      stats: {
        total: businesses.length,
        updated: updatedCount,
        errors: errorCount
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
};

module.exports = exports;
