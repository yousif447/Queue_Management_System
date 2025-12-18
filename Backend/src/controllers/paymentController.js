const Payment = require("../models/paymentSchema");
const Ticket = require("../models/ticketSchema");
const Stripe = require("stripe");
const User = require("../models/userSchema");
const Notification = require("../models/notificationSchema");
const { sendNotificationEmail } = require("../utils/emailService");

// Helper function to get Stripe instance with proper error handling
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY environment variable. Set it in .env."
    );
  }
  return Stripe(key);
}

// -------------------------
// POST /api/v1/payments/create-checkout-session
// Create Stripe Checkout Session
// -------------------------
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { ticketId, paymentMethod } = req.body;

    if (!ticketId) {
      return res.status(400).json({
        status: "fail",
        message: "ticketId is required",
      });
    }

    // Verify ticket exists
    const ticket = await Ticket.findById(ticketId)
      .populate('businessId', 'name')
      .populate('queueId', 'name');
    
    if (!ticket) {
      return res.status(404).json({
        status: "fail",
        message: "Ticket not found",
      });
    }

    // Verify user owns the ticket
    if (ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: "fail",
        message: "Not authorized",
      });
    }

    const stripe = getStripe();

    // Create Stripe Checkout Session
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${frontendURL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendURL}/payment/cancel`,
      customer_email: req.user.email,
      client_reference_id: ticketId,
      line_items: [
        {
          price_data: {
            currency: process.env.PAYMENT_CURRENCY || "usd",
            product_data: {
              name: `Queue Ticket - ${ticket.businessId?.name || 'Business'}`,
              description: `Ticket #${ticket.ticketNumber} for ${ticket.queueId?.name || 'Queue'}`,
            },
            unit_amount: Math.round((ticket.estimatedPrice || 10) * 100), // amount in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        ticketId: ticketId.toString(),
        userId: req.user.id.toString(),
        businessId: ticket.businessId?._id.toString() || "",
        queueId: ticket.queueId?._id.toString() || "",
      },
    });

    res.status(200).json({
      status: "success",
      sessionUrl: session.url,
    });
  } catch (err) {
    next(err);
  }
};

// -------------------------
// POST /api/v1/payments
// Create payment
// -------------------------
exports.createPayment = async (req, res) => {
  try {
    const { ticketId, amount, paymentMethod, paymentMethodId } = req.body;

    if (!ticketId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Please provide ticketId, amount, and paymentMethod",
      });
    }

    // Verify ticket exists
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Verify user owns the ticket
    if (ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Verify business supports this payment method
    const business = await require("../models/businessSchema").findById(ticket.businessId);
    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    // Check if payment method is accepted
    // Handle both array and string formats of business.paymentMethod
    const acceptedMethods = Array.isArray(business.paymentMethod) 
        ? business.paymentMethod 
        : [business.paymentMethod];
        
    // Allow 'card' if 'credit-card' is in accepted methods, and vice versa
    const normalizedMethod = paymentMethod === 'credit-card' ? 'card' : paymentMethod;
    const isAccepted = acceptedMethods.some(m => {
        const normalizedAccepted = m === 'credit-card' ? 'card' : m;
        return normalizedAccepted === normalizedMethod || normalizedAccepted === 'both';
    });

    if (!isAccepted) {
        return res.status(400).json({
            success: false,
            message: `Payment method '${paymentMethod}' is not accepted by this business`
        });
    }

    let stripePaymentIntent = null;
    let transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let status = 'pending';

    // If using Stripe (card payment)
    if (paymentMethod === "card" && paymentMethodId) {
      try {
        // Create Stripe Payment Intent
        stripePaymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Stripe uses cents
          currency: process.env.PAYMENT_CURRENCY || "usd",
          payment_method: paymentMethodId,
          confirm: true,
          metadata: {
            ticketId: ticketId,
            userId: req.user.id,
            businessId: ticket.businessId.toString(),
          },
        });

        transactionId = stripePaymentIntent.id;
        status = 'completed';
      } catch (stripeError) {
        return res.status(400).json({
          success: false,
          message: "Payment failed: " + stripeError.message,
        });
      }
    } else if (paymentMethod === 'cash') {
        status = 'pending';
    }

    // Create payment record
    const payment = await Payment.create({
      userId: req.user.id,
      ticketId,
      businessId: ticket.businessId,
      amount,
      paymentMethod,
      status: status,
      transactionId,
      stripePaymentIntentId: stripePaymentIntent?.id,
    });

    // Update ticket payment status if completed (or pending/cash payment logic)
    // For pending payments, we might keep ticket as 'unpaid' until confirmed, 
    // BUT usually 'cash' means ticket is booked and pay later.
    // If status is completed, mark ticket paid.
    if (status === 'completed') {
        ticket.paymentStatus = "paid";
    }
    // For now, let's allow ticket saving. 
    // If ticket schema requires 'paid' for something, this might be relevant.
    // Assuming ticket is created 'active' or 'booked'.
    
    await ticket.save();

    // ------------------------------------------
    // NOTIFICATION (Direct Payment)
    // ------------------------------------------
    try {
      if (req.user) {
         await Notification.create({
             userId: req.user.id,
             businessId: ticket.businessId,
             ticketId: ticketId,
             paymentId: payment._id,
             type: 'payment',
             message: `Payment of $${amount} successful for Ticket #${ticket.ticketNumber}`,
         });
         
         if (req.user.email) {
           await sendNotificationEmail({
              email: req.user.email,
              name: req.user.name,
              subject: "Payment Receipt 💳",
              message: `Your payment of $${amount} for Ticket #${ticket.ticketNumber} was successful.`,
              type: 'payment'
           });
         }
      }
      
      const socketIO = req.app.get("socketIO");
      if (socketIO && !req.body.suppressUserSocket) {
         socketIO.emitToUser(req.user.id, 'paymentUpdate', {
             status: 'success',
             message: `Payment of $${amount} successful`,
             ticketId: ticketId
         });
      }
    } catch (e) { console.log('Notification error:', e); }

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: {
        payment,
        clientSecret: stripePaymentIntent?.client_secret,
      },
    });
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment",
    });
  }
};

// -------------------------
// GET /api/v1/payments/:id
// Get payment by ID
// -------------------------
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("userId", "name email")
      .populate("businessId", "name")
      .populate("ticketId");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Check authorization
    if (
      payment.userId._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving payment",
    });
  }
};

// -------------------------
// GET /api/v1/payments
// Get all payments (admin only)
// -------------------------
exports.getAllPayments = async (req, res) => {
  try {
    const {
      userId,
      businessId,
      status,
      from,
      to,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (businessId) query.businessId = businessId;
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("userId", "name email")
        .populate("businessId", "name")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Payment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all payments error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving payments",
    });
  }
};

// -------------------------
// GET /api/v1/users/me/payments
// Get user's payment history
// -------------------------
exports.getUserPayments = async (req, res) => {
  try {
    const { status, from, to, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user.id };
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("businessId", "name profileImage")
        .populate("ticketId")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Payment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get user payments error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving payments",
    });
  }
};

// -------------------------
// GET /api/v1/businesses/:businessId/payments
// Get business payments (owner only)
// -------------------------
exports.getBusinessPayments = async (req, res) => {
  try {
    const { status, from, to, page = 1, limit = 10 } = req.query;
    const { businessId } = req.params;

    const query = { businessId };
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("userId", "name email")
        .populate("ticketId")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Payment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get business payments error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving business payments",
    });
  }
};

// -------------------------
// POST /api/v1/payments/:id/refund
// Refund payment
// -------------------------
exports.refundPayment = async (req, res) => {
  try {
    const { reason, amount } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status === "refunded") {
      return res.status(400).json({
        success: false,
        message: "Payment already refunded",
      });
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: "Refund amount cannot exceed payment amount",
      });
    }

    // Process Stripe refund if payment was made via Stripe
    if (payment.stripePaymentIntentId) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId,
          amount: Math.round(refundAmount * 100), // Stripe uses cents
          reason: reason || "requested_by_customer",
        });

        payment.stripeRefundId = refund.id;
      } catch (stripeError) {
        return res.status(400).json({
          success: false,
          message: "Stripe refund failed: " + stripeError.message,
        });
      }
    }

    payment.status = "refunded";
    payment.refundAmount = refundAmount;
    payment.refundReason = reason;
    payment.refundDate = new Date();
    await payment.save();

    // Update ticket payment status
    if (payment.ticketId) {
      await Ticket.findByIdAndUpdate(payment.ticketId, {
        paymentStatus: "refunded",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment refunded successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Refund payment error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing refund",
    });
  }
};

// -------------------------
// GET /api/v1/payments/:id/receipt
// Get payment receipt
// -------------------------
exports.getReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("userId", "name email phone")
      .populate("businessId", "name address phone")
      .populate("ticketId");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Check authorization
    if (
      payment.userId._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // TODO: Generate PDF receipt
    // For now, return receipt data
    res.status(200).json({
      success: true,
      data: {
        receiptNumber: payment.transactionId,
        date: payment.createdAt,
        customer: payment.userId,
        business: payment.businessId,
        ticket: payment.ticketId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error("Get receipt error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving receipt",
    });
  }
};

// -------------------------
// POST /api/v1/payments/webhook/stripe
// Get webhook from stripe when payment is successful
// Create payment records in DB
// -------------------------
exports.stripeWebhook = async (req, res) => {
  let event;
  try {
    const stripe = getStripe();
    const signature = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("Webhook verified:", event.type);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata || {};
      const userId = metadata.userId;
      const ticketId = session.client_reference_id || metadata.ticketId;
      const businessId = metadata.businessId;
      const queueId = metadata.queueId;
      const amountPaid = session.amount_total / 100; // Convert from cents

      // Find the ticket
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        console.error("Ticket not found for webhook session:", ticketId);
        return res.status(400).send("Ticket not found");
      }

      // Check for duplicate payment to prevent double-processing
      const existingPayment = await Payment.findOne({
        ticketId: ticket._id,
        status: "completed",
        amount: amountPaid,
      });

      if (existingPayment) {
        console.log("Duplicate payment ignored for ticket:", ticketId);
        return res.status(200).json({ received: true });
      }

      // Create payment record
      await Payment.create({
        userId: userId,
        ticketId: ticketId,
        businessId: businessId,
        amount: amountPaid,
        paymentMethod: "card",
        status: "completed",
        transactionId: session.payment_intent,
        stripePaymentIntentId: session.payment_intent,
        paidAt: new Date(),
      });

      // Update ticket payment status
      ticket.paymentStatus = "paid";
      let newlyConfirmed = false;
      if (ticket.status === 'pending_payment') {
         ticket.status = 'waiting';
         newlyConfirmed = true;
      }
      await ticket.save();

      console.log("Checkout session completed:", session.id);
      
      const socketIO = req.app.get("socketIO");
      if (socketIO) {
          socketIO.emitTicketUpdated(businessId, ticket);
          if (newlyConfirmed) {
              socketIO.emitTicketCreated(businessId, ticket);
          }
      }
      
      // ------------------------------------------
      // NOTIFICATION (Webhook Payment)
      // ------------------------------------------
      try {
        const user = await User.findById(userId);
        if (user) {
             await Notification.create({
                 userId: userId,
                 businessId: businessId,
                 ticketId: ticketId,
                 // paymentId: payment._id, // payment variable not easily accessible here unless captured from create
                 type: 'payment',
                 message: `Payment successful for Ticket #${ticket.ticketNumber}`,
             });

             if (user.email) {
                 await sendNotificationEmail({
                     email: user.email,
                     name: user.name,
                     subject: "Payment Confirmed 💳",
                     message: `Your payment of $${amountPaid} for Ticket #${ticket.ticketNumber} was successful.`,
                     type: 'payment'
                 });
             }
             

             /*
             if (socketIO) {
                socketIO.emitToUser(userId, 'paymentUpdate', {
                    status: 'success',
                    message: `Payment of $${amountPaid} successful`,
                    ticketId: ticketId
                });
             }
             */
         }
      } catch (e) { console.error('Webhook Notification Error:', e); }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Error processing webhook event:", err);
    res.status(400).send(`Webhook Internal Error: ${err.message}`);
  }
};

// -------------------------
// Legacy webhook handlers for other payment methods
// -------------------------
exports.stripeWebhookLegacy = async (req, res) => {
  try {
    const stripe = getStripe();
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle different event types
    switch (event.type) {

      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        
        // Update payment status in database
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          { 
            status: "completed",
            paidAt: new Date(),
          }
        );
        
        console.log("Payment succeeded:", paymentIntent.id);
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        
        // Update payment status to failed
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: failedPayment.id },
          { status: "failed" }
        );
        
        console.log("Payment failed:", failedPayment.id);
        break;

      case "charge.refunded":
        const refund = event.data.object;
        
        // Update payment status to refunded
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: refund.payment_intent },
          { 
            status: "refunded",
            refundDate: new Date(),
          }
        );
        
        console.log("Charge refunded:", refund.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    res.status(400).json({
      success: false,
      message: "Webhook error",
    });
  }
};

// -------------------------
// POST /api/v1/payments/verify
// Verify payment status
// -------------------------
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, transactionId } = req.body;

    if (!paymentId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: "Please provide paymentId and transactionId",
      });
    }

    const payment = await Payment.findOne({
      _id: paymentId,
      transactionId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // TODO: Verify with payment gateway
    // For now, just return payment status
    res.status(200).json({
      success: true,
      data: {
        verified: true,
        status: payment.status,
        amount: payment.amount,
        transactionId: payment.transactionId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
    });
  }
};

// -------------------------
// POST /api/v1/payments/confirm-session
// Manually confirm Stripe session (Fallback for webhooks)
// -------------------------
exports.confirmSession = async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ success: false, message: "Session ID required" });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
       const ticketId = session.client_reference_id || session.metadata.ticketId;
       const userId = session.metadata.userId;
       const businessId = session.metadata.businessId;
       const amountPaid = session.amount_total / 100;

       // Verify Ticket
       const ticket = await Ticket.findById(ticketId);
       if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

       // Check if already paid
       if (ticket.paymentStatus === 'paid') {
          return res.status(200).json({ success: true, message: "Already paid" });
       }

       // Create Payment Record (Check duplicate first)
       const existingPayment = await Payment.findOne({ transactionId: session.payment_intent });
       if (!existingPayment) {
           await Payment.create({
             userId,
             ticketId,
             businessId,
             amount: amountPaid,
             paymentMethod: "card",
             status: "completed",
             transactionId: session.payment_intent,
             stripePaymentIntentId: session.payment_intent,
             paidAt: new Date(),
           });
       }

       // Update Ticket
       ticket.paymentStatus = "paid";
       let newlyConfirmed = false;
       // If ticket was pending payment, move to waiting queue
       if (ticket.status === 'pending_payment') {
         ticket.status = 'waiting';
         newlyConfirmed = true;
       }
       await ticket.save();

       // Socket Update
       const socketIO = req.app.get("socketIO");
       if (socketIO) {
          // If this is a newly confirmed payment (from pending), the webhook likely didn't run or we beat it?
          // Actually, if we are here, we handle the response directly.
          // BUT if webhook also ran, it emitted paymentUpdate.
          // Since we are redirecting the user to success page, do we NEED a socket event?
          // The success page SHOWS the success state.
          // So we can probably REMOVE this emission for manual confirmation flow.
          
          /* 
          socketIO.emitToUser(userId, 'paymentUpdate', {
              status: 'success',
              message: `Payment confirmed`,
              ticketId
          });
          */
          socketIO.emitTicketUpdated(businessId, ticket);
          if (newlyConfirmed) {
              socketIO.emitTicketCreated(businessId, ticket);
          }
       }

       return res.status(200).json({ success: true, message: "Payment confirmed successfully" });
    } else {
       return res.status(400).json({ success: false, message: "Payment not completed" });
    }

  } catch (error) {
    console.error("Confirm session error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------
// GET /api/v1/payments/businesses/:businessId/payments
// Get all payments for a business
// -------------------------
exports.getBusinessPayments = async (req, res) => {
  try {
    const { businessId } = req.params;

    // Find all payments for this business
    const payments = await Payment.find({ businessId })
      .populate('userId', 'name email phone')
      .populate('ticketId', 'ticketNumber status guestName guestPhone guestEmail')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: payments.length,
      data: {
        payments
      }
    });
  } catch (error) {
    console.error("Get business payments error:", error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// -------------------------
// GET /api/v1/payments/users/me/payments
// Get user's payment history
// -------------------------
exports.getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id })
      .populate('businessId', 'name')
      .populate('ticketId', 'ticketNumber status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: payments.length,
      data: {
        payments
      }
    });
  } catch (error) {
    console.error("Get user payments error:", error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// -------------------------
// GET /api/v1/payments/all
// Get all payments (admin only)
// -------------------------
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('userId', 'name email')
      .populate('businessId', 'name')
      .populate('ticketId', 'ticketNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: payments.length,
      data: {
        payments
      }
    });
  } catch (error) {
    console.error("Get all payments error:", error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// -------------------------
// GET /api/v1/payments/:id
// Get payment by ID
// -------------------------
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('businessId', 'name')
      .populate('ticketId');

    if (!payment) {
      return res.status(404).json({
        status: 'fail',
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    console.error("Get payment by ID error:", error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// -------------------------
// GET /api/v1/payments/:id/receipt
// Get payment receipt
// -------------------------
exports.getReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('businessId', 'name address')
      .populate('ticketId', 'ticketNumber');

    if (!payment) {
      return res.status(404).json({
        status: 'fail',
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (error) {
    console.error("Get receipt error:", error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// -------------------------
// POST /api/v1/payments/:id/refund
// Refund a payment
// -------------------------
exports.refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        status: 'fail',
        message: 'Payment not found'
      });
    }

    if (payment.status === 'refunded') {
      return res.status(400).json({
        status: 'fail',
        message: 'Payment already refunded'
      });
    }

    // Update payment status
    payment.status = 'refunded';
    payment.refundDate = new Date();
    payment.refundReason = req.body.reason || 'Refund requested';
    await payment.save();

    // Update ticket if exists
    if (payment.ticketId) {
      const ticket = await Ticket.findById(payment.ticketId);
      if (ticket) {
        ticket.paymentStatus = 'refunded';
        await ticket.save();
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Payment refunded successfully',
      data: {
        payment
      }
    });
  } catch (error) {
    console.error("Refund payment error:", error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
