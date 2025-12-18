const Business = require("../models/businessSchema");
const Stripe = require("stripe");

// Helper function to get Stripe instance
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
  }
  return Stripe(key);
}

// Subscription plans configuration
const PLANS = {
  basic: {
    name: "Basic",
    price: 9,
    monthlyBookingLimit: 50,
    priceId: process.env.STRIPE_BASIC_PRICE_ID,
    features: ["50 bookings/month", "Queue management", "Email notifications"]
  },
  pro: {
    name: "Professional",
    price: 29,
    monthlyBookingLimit: 500,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ["500 bookings/month", "Payment tracking", "Customer reviews", "Customer list"]
  },
  enterprise: {
    name: "Enterprise",
    price: 99,
    monthlyBookingLimit: 2000,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: ["2000 bookings/month", "Advanced analytics", "Priority support", "Data export"]
  }
};

// -------------------------
// POST /api/v1/subscriptions/create-checkout
// Create Stripe Checkout Session for Business Subscription
// -------------------------
exports.createSubscriptionCheckout = async (req, res) => {
  try {
    const { plan } = req.body; // 'starter' or 'professional'
    const businessId = req.user.id;

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected"
      });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    const stripe = getStripe();
    const planConfig = PLANS[plan];

    // Create or retrieve Stripe customer
    let customerId = business.subscription?.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: business.email,
        name: business.name,
        metadata: {
          businessId: businessId.toString()
        }
      });
      customerId = customer.id;
    }

    // Prepare line items
    let lineItems;
    
    if (planConfig.priceId) {
      // Use pre-configured Price ID
      lineItems = [{
        price: planConfig.priceId,
        quantity: 1
      }];
    } else {
      // Create price on the fly (for development/testing)
      lineItems = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${planConfig.name} Plan`,
            description: planConfig.features.join(', ')
          },
          unit_amount: planConfig.price * 100, // Convert to cents
          recurring: {
            interval: 'month'
          }
        },
        quantity: 1
      }];
    }

    // Create checkout session
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: lineItems,
      success_url: `${frontendURL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendURL}/subscription/cancel`,
      metadata: {
        businessId: businessId.toString(),
        plan: plan
      }
    });

    res.status(200).json({
      success: true,
      sessionUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error("Create subscription checkout error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating checkout session"
    });
  }
};

// -------------------------
// POST /api/v1/subscriptions/webhook
// Handle Stripe Subscription Webhooks
// -------------------------
exports.subscriptionWebhook = async (req, res) => {
  let event;
  
  try {
    const stripe = getStripe();
    const signature = req.headers["stripe-signature"];
    
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    console.log("Subscription webhook received:", event.type);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const businessId = session.metadata.businessId;
        const plan = session.metadata.plan;
        
        const business = await Business.findById(businessId);
        if (!business) {
          console.error("Business not found:", businessId);
          return res.status(404).send("Business not found");
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // Update business subscription
        business.subscription = {
          plan: plan,
          status: "active",
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: false
        };
        
        await business.save();
        console.log("Subscription activated for business:", businessId);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const business = await Business.findOne({
          "subscription.stripeSubscriptionId": subscription.id
        });
        
        if (business) {
          business.subscription.status = subscription.status;
          business.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
          business.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          business.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
          await business.save();
          console.log("Subscription updated for business:", business._id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const business = await Business.findOne({
          "subscription.stripeSubscriptionId": subscription.id
        });
        
        if (business) {
          business.subscription.status = "cancelled";
          await business.save();
          console.log("Subscription cancelled for business:", business._id);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const business = await Business.findOne({
          "subscription.stripeCustomerId": invoice.customer
        });
        
        if (business) {
          business.subscription.status = "past_due";
          await business.save();
          console.log("Payment failed for business:", business._id);
        }
        break;
      }

      default:
        console.log(`Unhandled subscription event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error processing subscription webhook:", error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};


// -------------------------
// GET /api/v1/subscriptions/status
// Get current business subscription status
// -------------------------
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const business = await Business.findById(req.user.id).select("subscription");
    
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    res.status(200).json({
      success: true,
      data: business.subscription || {
        plan: "basic",
        status: "active",
        monthlyBookingCount: 0,
        lastBookingReset: new Date()
      }
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving subscription status"
    });
  }
};

// -------------------------
// GET /api/v1/subscriptions/session/:sessionId
// Get Stripe session details
// -------------------------
exports.getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required"
      });
    }

    // Get Stripe instance
    const stripe = getStripe();

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    // Extract plan from metadata
    const plan = session.metadata?.plan || 'basic';

    res.status(200).json({
      success: true,
      data: {
        plan: plan,
        status: session.payment_status === 'paid' ? 'active' : 'pending',
        currentPeriodEnd: session.subscription ? null : null // Will be set by webhook
      }
    });
  } catch (error) {
    console.error("Get session details error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving session details",
      error: error.message
    });
  }
};

// -------------------------
// POST /api/v1/subscriptions/cancel
// Cancel business subscription
// -------------------------
exports.cancelSubscription = async (req, res) => {
  try {
    const business = await Business.findById(req.user.id);
    
    if (!business || !business.subscription?.stripeSubscriptionId) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found"
      });
    }

    const stripe = getStripe();
    
    // Cancel at period end (don't cancel immediately)
    await stripe.subscriptions.update(business.subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    business.subscription.cancelAtPeriodEnd = true;
    await business.save();

    res.status(200).json({
      success: true,
      message: "Subscription will be cancelled at the end of the billing period"
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling subscription"
    });
  }
};

// -------------------------
// POST /api/v1/subscriptions/reactivate
// Reactivate cancelled subscription
// -------------------------
exports.reactivateSubscription = async (req, res) => {
  try {
    const business = await Business.findById(req.user.id);
    
    if (!business || !business.subscription?.stripeSubscriptionId) {
      return res.status(404).json({
        success: false,
        message: "No subscription found"
      });
    }

    const stripe = getStripe();
    
    // Remove cancellation
    await stripe.subscriptions.update(business.subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    business.subscription.cancelAtPeriodEnd = false;
    await business.save();

    res.status(200).json({
      success: true,
      message: "Subscription reactivated successfully"
    });
  } catch (error) {
    console.error("Reactivate subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Error reactivating subscription"
    });
  }
};

// -------------------------
// GET /api/v1/subscriptions/plans
// Get available subscription plans
// -------------------------
exports.getPlans = async (req, res) => {
  try {
    const plans = Object.keys(PLANS).map(key => ({
      id: key,
      ...PLANS[key]
    }));

    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving plans"
    });
  }
};

// -------------------------
// POST /api/v1/subscriptions/confirm-session
// Manually confirm session (fallback if webhook fails)
// -------------------------
exports.confirmSession = async (req, res) => {
  try {
    console.log('=== confirmSession called ===');
    console.log('req.body:', req.body);
    
    const { sessionId } = req.body;  // Changed from session_id to sessionId
    const businessId = req.user.id;

    if (!sessionId) {
      console.log('❌ Session ID is missing');
      return res.status(400).json({
        success: false,
        message: "Session ID required"
      });
    }

    console.log('✅ Session ID received:', sessionId);

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    // Verify session belongs to this business
    if (session.metadata.businessId !== businessId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    // If session is complete and subscription exists
    if (session.status === 'complete' && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      
      console.log('Stripe subscription retrieved:', {
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end
      });
      
      // Use fallback dates if Stripe doesn't provide them (test mode)
      const now = new Date();
      const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      // Update business subscription
      business.subscription = {
        plan: session.metadata.plan || 'basic',
        status: "active",
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        currentPeriodStart: subscription.current_period_start 
          ? new Date(subscription.current_period_start * 1000) 
          : now,
        currentPeriodEnd: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000) 
          : oneMonthFromNow,
        cancelAtPeriodEnd: false,
        monthlyBookingCount: business.subscription?.monthlyBookingCount || 0,
        lastBookingReset: business.subscription?.lastBookingReset || now
      };
      
      await business.save();

      console.log(`✅ Subscription confirmed for business ${businessId}: ${session.metadata.plan} plan`);

      return res.status(200).json({
        success: true,
        message: "Subscription confirmed",
        data: business.subscription
      });
    }

    res.status(400).json({
      success: false,
      message: "Session not complete or subscription not found"
    });
  } catch (error) {
    console.error("Confirm session error:", error);
    res.status(500).json({
      success: false,
      message: "Error confirming session"
    });
  }
};

module.exports = exports;
