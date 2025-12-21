const mongoose = require("mongoose");
const Ticket = require("../models/ticketSchema");
const Queue = require("../models/queueSchema");
const Business = require("../models/businessSchema");
const etaCalculator = require("../utils/etaCalculator");
const NotificationService = require("../utils/notificationService");
const { checkBookingLimit, incrementBookingCount } = require("../utils/subscriptionLimits");
const crypto = require("crypto");

// small helper for pagination
const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page || 1, 10), 1);
  const limit = Math.max(parseInt(query.limit || 20, 10), 1);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// ===============================
// CREATE TICKET
// ===============================
exports.createTicket = async (req, res) => {
  try {
    let { businessId, queueId, type, priority, paymentMethod, paymentIntentId, guestName, guestPhone, guestEmail, price } = req.body;
    const userId = req.user ? (req.user._id || req.user.id) : null;

    if (!businessId)
      return res.status(400).json({ message: "businessId is required" });

    // Auto-find active queue if not provided
    if (!queueId) {
       // Find active queue for today
       const todayStart = new Date();
       todayStart.setHours(0,0,0,0);
       
       const activeQueue = await Queue.findOne({ 
           businessId, 
           status: 'active',
           createdAt: { $gte: todayStart }
       }).sort({ createdAt: -1 });

       if (activeQueue) {
          queueId = activeQueue._id;
       } else {
          return res.status(400).json({ message: "No active queue found. Please specified queueId." });
       }
    }

    // If high priority, require payment method
    if (priority === 'high' && !paymentMethod) {
      return res.status(400).json({ message: "Payment method is required for high priority tickets" });
    }

    // 1. Check business exists
    const business = await Business.findById(businessId);
    if (!business)
      return res.status(404).json({ message: "Business not found" });

    // 2. Check subscription limits
    const limitCheck = await checkBookingLimit(business);
    if (!limitCheck.allowed) {
      return res.status(403).json({ 
        message: `Monthly booking limit reached. Your ${business.subscription?.plan || 'basic'} plan allows ${limitCheck.limit} bookings per month.`,
        limit: limitCheck.limit,
        current: limitCheck.current,
        planName: business.subscription?.plan || 'basic'
      });
    }

    // 3. Check queue exists
    const queue = await Queue.findById(queueId);
    if (!queue) return res.status(404).json({ message: "Queue not found" });

    // Check queue belongs to business
    if (queue.businessId.toString() !== businessId)
      return res
        .status(400)
        .json({ message: "Queue does not belong to this business" });

    // Check queue state
    if (queue.status !== "active")
      return res.status(400).json({ message: "Queue not accepting tickets" });

    if (queue.currentCount >= queue.maxCapacity)
      return res.status(400).json({ message: "Queue is full" });

    // 3. Atomically increment queue counters
    const updatedQueue = await Queue.findOneAndUpdate(
      {
        _id: queueId,
        currentCount: { $lt: queue.maxCapacity },
        status: "active",
      },
      {
        $inc: { currentCount: 1, currentTicketNumber: 1 },
      },
      { new: true },
    );

    if (!updatedQueue)
      return res.status(400).json({
        message: "Queue is no longer available for new tickets",
      });

    // Calculate ETA
    const etaPrediction = await etaCalculator.calculateETA(
      businessId,
      queueId,
      type,
    );

    // Determine payment status
    let paymentStatus = 'unpaid';
    if (paymentIntentId) {
       paymentStatus = 'paid';
    } else if (priority === 'normal') {
       paymentStatus = 'unpaid';
    }

    // Create ticket with guest data and price
    const ticketData = {
      businessId,
      userId,
      queueId,
      ticketNumber: updatedQueue.currentTicketNumber,
      type: type || "examination",
      status: req.body.status || "waiting", // Allow status override (e.g., pending_payment)
      priority: priority || "normal",
      estimatedTime: etaPrediction.estimatedMinutes,
      expectedServiceTime: etaPrediction.expectedTime,
      paymentStatus,
      paymentMethod: priority === 'high' ? paymentMethod : null,
      paymentIntentId: paymentIntentId || null,
      price: price || 0,
    };

    // Add guest data if provided (for walk-in customers)
    if (guestName) ticketData.guestName = guestName;
    if (guestPhone) ticketData.guestPhone = guestPhone;
    if (guestEmail) ticketData.guestEmail = guestEmail;

    const ticket = await Ticket.create(ticketData);

    // Increment monthly booking count for the business
    await incrementBookingCount(businessId);

    // Emit socket events
    const socketIO = req.app.get("socketIO");

    
    // Only emit events if not pending payment
    if (socketIO && ticket.status !== 'pending_payment') {
      socketIO.emitTicketCreated(businessId, ticket);
      socketIO.emitQueueUpdate(businessId, {
        queueId,
        currentCount: updatedQueue.currentCount,
        currentTicketNumber: updatedQueue.currentTicketNumber,
      });
      
      if (userId && !req.body.suppressUserSocket) {
        socketIO.emitToUser(userId, 'ticketBooked', {
           ticket,
           message: `Ticket #${ticket.ticketNumber} booked successfully`,
           timestamp: new Date()
        });
      }
    }

    // Create Notification & Send Email via NotificationService
    if (userId) {
       await NotificationService.createNotification({
          userId,
          businessId,
          ticketId: ticket._id,
          queueId,
          type: 'ticket',
          message: `Ticket #${ticket.ticketNumber} booked successfully`,
          userEmail: req.user?.email,
          userName: req.user?.name,
       }).catch(err => console.error("Notification trigger failed:", err));
    }

    return res.status(201).json({
      status: "success",
      data: ticket,
      eta: etaPrediction,
    });
  } catch (err) {
    console.error("createTicket error:", err);
    return res.status(500).json({
      message: "Server error creating ticket",
      error: err.message,
    });
  }
};

// ===============================
// GET TICKET BY ID
// ===============================
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("businessId")
      .populate("userId")
      .populate("queueId");

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // User cannot access others' tickets
    if (req.user.role === "user" && ticket.userId.toString() !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    return res.json({ status: "success", data: ticket });
  } catch (err) {
    console.error("getTicketById error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ===============================
// GET ALL TICKETS
// ===============================
exports.getAllTickets = async (req, res) => {
  try {
    const filter = {};
    const { businessId, userId, status, date } = req.query;

    if (businessId) filter.businessId = businessId;
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    const { limit, skip, page } = parsePagination(req.query);

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("businessId")
        .populate("userId")
        .skip(skip)
        .limit(limit)
        .sort("-createdAt"),
      Ticket.countDocuments(filter),
    ]);

    return res.json({
      status: "success",
      page,
      limit,
      total,
      results: tickets.length,
      data: tickets,
    });
  } catch (err) {
    console.error("getAllTickets error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ===============================
// GET MY TICKETS
// ===============================
exports.getMyTickets = async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    const { status, businessId, from, to } = req.query;

    if (status) filter.status = status;
    if (businessId) filter.businessId = businessId;

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const { page, limit, skip } = parsePagination(req.query);

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("businessId")
        .populate("queueId")
        .skip(skip)
        .limit(limit)
        .sort("-createdAt"),
      Ticket.countDocuments(filter),
    ]);

    // Calculate accurate position for waiting tickets
    const ticketsWithPosition = await Promise.all(tickets.map(async (t) => {
      const ticketObj = t.toObject();
      if (ticketObj.status === 'waiting' && ticketObj.queueId) {
          // Count how many waiting tickets are ahead of this one (include ALL waiting tickets)
          const aheadCount = await Ticket.countDocuments({
            queueId: ticketObj.queueId._id,
            status: 'waiting',
            createdAt: { $lt: ticketObj.createdAt }
          });
        ticketObj.position = aheadCount + 1;
      }
      return ticketObj;
    }));

    return res.json({
      status: "success",
      page,
      limit,
      total,
      results: tickets.length,
      data: ticketsWithPosition,
    });
  } catch (err) {
    console.error("getMyTickets error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ===============================
// GET BUSINESS TICKETS
// ===============================
exports.getBusinessTickets = async (req, res) => {
  try {
    const { businessId } = req.params;
    const filter = { businessId };
    const { date, status, userId } = req.query;

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    // owner check
    if (req.user.role === "owner") {
      const business = await Business.findById(businessId);
      if (!business || business.owner.toString() !== req.user.id)
        return res.status(403).json({
          message: "You do not own this business",
        });
    }

    const { page, limit, skip } = parsePagination(req.query);

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("userId")
        .populate("queueId")
        .skip(skip)
        .limit(limit)
        .sort("-createdAt"),
      Ticket.countDocuments(filter),
    ]);

    return res.json({
      status: "success",
      page,
      limit,
      total,
      results: tickets.length,
      data: tickets,
    });
  } catch (err) {
    console.error("getBusinessTickets error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// Compatibility alias
exports.getClinicTickets = async (req, res) => {
  req.params.businessId = req.params.clinicId || req.params.businessId;
  return exports.getBusinessTickets(req, res);
};

// ===============================
// DELETE TICKET
// ===============================
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Only owner/business can delete tickets
    if (!["owner", "business", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Insufficient permissions to delete tickets",
      });
    }

    // If ticket was in active queue, decrement count
    if (["waiting", "called"].includes(ticket.status) && ticket.queueId) {
      await Queue.findByIdAndUpdate(ticket.queueId, {
        $inc: { currentCount: -1 },
      });
    }

    await Ticket.findByIdAndDelete(req.params.id);

    return res.json({
      status: "success",
      message: "Ticket deleted successfully",
    });
  } catch (err) {
    console.error("deleteTicket error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ===============================
// CANCEL TICKET
// ===============================
exports.cancelTicket = async (req, res) => {
  try {
    console.log("=== CANCEL TICKET START ===");
    console.log("Ticket ID:", req.params.id);
    console.log("User:", req.user?.id, req.user?.role);
    const reason = req.body?.reason || null;

    const ticket = await Ticket.findById(req.params.id);
    console.log("Ticket found:", ticket ? "Yes" : "No");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Users can only cancel their own tickets, staff/owner/business can cancel any
    if (req.user.role === "user" && ticket.userId && ticket.userId.toString() !== req.user.id)
      return res.status(403).json({
        message: "You can only cancel your own tickets",
      });

    if (["done", "cancelled"].includes(ticket.status))
      return res.status(400).json({
        message: `Cannot cancel a ${ticket.status} ticket`,
      });

    const wasWaitingOrCalled = ["waiting", "called"].includes(ticket.status);

    console.log("Ticket status:", ticket.status);
    console.log("Will decrement queue:", wasWaitingOrCalled);
    
    ticket.status = "cancelled";
    ticket.cancelReason = reason || "Cancelled by staff";
    ticket.cancelledBy = req.user.id;
    
    console.log("Saving ticket...");
    await ticket.save();
    console.log("Ticket saved successfully");

    if (wasWaitingOrCalled) {
      console.log("Updating queue:", ticket.queueId);
      await Queue.findByIdAndUpdate(ticket.queueId, {
        $inc: { currentCount: -1 },
      });
      console.log("Queue updated");
    }

    console.log("Emitting socket events...");
    const socketIO = req.app.get("socketIO");
    if (socketIO && ticket.businessId) {
      socketIO.emitTicketUpdated(ticket.businessId.toString(), ticket);
      if (wasWaitingOrCalled && ticket.queueId) {
        socketIO.emitQueueUpdate(ticket.businessId.toString(), ticket.queueId.toString());
      }
    }

    // Send Notification
    if (ticket.userId) {
      NotificationService.createNotification({
        userId: ticket.userId,
        businessId: ticket.businessId,
        ticketId: ticket._id,
        type: 'system',
        message: `Your ticket #${ticket.ticketNumber} has been cancelled.`,
        emailSubject: "Ticket Cancelled ❌"
      }).catch(err => console.error("Cancel notification failed:", err));
    }

    return res.json({
      status: "success",
      message: "Ticket cancelled",
      data: ticket,
    });
  } catch (err) {
    console.error("cancelTicket error:", err);
    console.error("Stack trace:", err.stack);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message, stack: err.stack });
  }
};

// ===============================
// CALL TICKET
// ===============================
exports.callTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate("userId");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (!["staff", "owner", "business"].includes(req.user.role))
      return res.status(403).json({
        message: "Insufficient permissions to call tickets",
      });

    if (ticket.status !== "waiting")
      return res.status(400).json({
        message: "Only waiting tickets can be called",
      });

    ticket.status = "called";
    ticket.calledAt = new Date();
    await ticket.save();

    // Decrement waiting count in queue
    await Queue.findByIdAndUpdate(ticket.queueId, {
      $inc: { currentCount: -1 },
    });

    const socketIO = req.app.get("socketIO");
    if (socketIO) {
      // Emit to business room
      socketIO.emitTicketCalled(
        ticket.businessId.toString(),
        ticket,
        null // Removed userId to avoid duplicate: Handled by NotificationService.newNotification
      );
      socketIO.emitTicketUpdated(ticket.businessId.toString(), ticket);
      
      /* Redundant: Handled by NotificationService.newNotification
      const uId = ticket.userId?._id?.toString() || (ticket.userId && ticket.userId.toString());
      if (uId) {
          socketIO.emitToUser(uId, 'yourTicketCalled', {
              ticket,
              message: `It's your turn! Ticket #${ticket.ticketNumber} is being called.`,
              timestamp: new Date()
          });
      }
      */
    }

    // ------------------------------------------------------------
    // NOTIFICATION & EMAIL TRIGGER via NotificationService
    // ------------------------------------------------------------
    try {
      if (ticket.userId) {
        await NotificationService.createNotification({
          userId: ticket.userId._id || ticket.userId,
          businessId: ticket.businessId,
          ticketId: ticket._id,
          queueId: ticket.queueId,
          type: 'turn',
          message: `It's your turn! Ticket #${ticket.ticketNumber} is being called.`,
          userEmail: ticket.userId.email,
          userName: ticket.userId.name,
          emailSubject: "It's Your Turn! 🔔"
        });
      }
    } catch (notifError) {
      console.error("Notification trigger failed:", notifError);
    }

    return res.json({
      status: "success",
      message: "Ticket called",
      data: ticket,
    });
  } catch (err) {
    console.error("callTicket error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ===============================
// SERVE TICKET
// ===============================
exports.serveTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (!["staff", "owner", "business"].includes(req.user.role))
      return res.status(403).json({
        message: "Insufficient permissions to serve tickets",
      });

    if (!["called", "waiting"].includes(ticket.status))
      return res.status(400).json({
        message: "Only called or waiting tickets can be served",
      });

    ticket.status = "in-progress";
    ticket.startedAt = new Date();
    await ticket.save();

    const socketIO = req.app.get("socketIO");
    if (socketIO) {
      socketIO.emitTicketUpdated(ticket.businessId.toString(), ticket);
    }

    return res.json({
      status: "success",
      message: "Now serving ticket",
      data: ticket,
    });
  } catch (err) {
    console.error("serveTicket error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ===============================
// START TICKET
// ===============================
exports.startTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (!["called", "waiting"].includes(ticket.status))
      return res.status(400).json({
        message: "Only called or waiting tickets can be started",
      });

    ticket.status = "in-progress";
    await ticket.save();

    const socketIO = req.app.get("socketIO");
    if (socketIO) {
      socketIO.emitTicketUpdated(ticket.businessId.toString(), ticket);
    }

    return res.json({
      status: "success",
      message: "Service started",
      data: ticket,
    });
  } catch (err) {
    console.error("startTicket error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ===============================
// COMPLETE TICKET
// ===============================
exports.completeTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (["done", "ended"].includes(ticket.status))
      return res.status(400).json({
        message: "Ticket already completed",
      });

    ticket.status = "ended";
    ticket.completedAt = new Date();
    await ticket.save();

    const socketIO = req.app.get("socketIO");
    if (socketIO) {
      socketIO.emitTicketUpdated(ticket.businessId.toString(), ticket);
    }

    if (ticket.queueId) {
      etaCalculator.updateQueueETAs(ticket.queueId);
    }

    return res.json({
      status: "success",
      message: "Ticket completed",
      data: ticket,
    });
  } catch (err) {
    console.error("completeTicket error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ===============================
// NO SHOW TICKET
// ===============================
exports.noShowTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    // Allow both waiting and called tickets to be marked as no-show
    if (ticket.status !== "waiting" && ticket.status !== "called")
      return res.status(400).json({
        message: "Only waiting or called tickets can be marked as no-show",
      });

    ticket.status = "missed";
    await ticket.save();

    if (ticket.queueId) {
      await Queue.findByIdAndUpdate(ticket.queueId, {
        $inc: { currentCount: -1 },
      });
    }

    const socketIO = req.app.get("socketIO");
    if (socketIO) {
      socketIO.emitTicketUpdated(ticket.businessId.toString(), ticket);
      if (ticket.queueId) {
        socketIO.emitQueueUpdate(ticket.businessId.toString(), ticket.queueId.toString());
      }
    }

    // Send Notification
    if (ticket.userId) {
      NotificationService.createNotification({
        userId: ticket.userId,
        businessId: ticket.businessId,
        ticketId: ticket._id,
        type: 'system',
        message: `You missed your turn for ticket #${ticket.ticketNumber}.`,
        emailSubject: "Missed Appointment ⚠️"
      }).catch(err => console.error("No-show notification failed:", err));
    }

    return res.json({
      status: "success",
      message: "Ticket marked as no-show",
      data: ticket,
    });
  } catch (err) {
    console.error("noShowTicket error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ===============================
// REACTIVATE TICKET (Undo No-Show)
// ===============================
exports.reactivateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (ticket.status !== "missed" && ticket.status !== "cancelled") {
      return res.status(400).json({
        message: "Only missed/no-show or cancelled tickets can be reactivated",
      });
    }

    // Set back to waiting
    ticket.status = "waiting";
    // Optional: Reset expected service time or keep original? 
    // Keeping original preserves "ticket number" logic, but they might appear "late".
    // For simple re-admission, just status change is enough.
    
    await ticket.save();

    // Increment queue count again
    if (ticket.queueId) {
      await Queue.findByIdAndUpdate(ticket.queueId, {
        $inc: { currentCount: 1 },
      });
    }

    const socketIO = req.app.get("socketIO");
    if (socketIO) {
      socketIO.emitTicketUpdated(ticket.businessId.toString(), ticket);
      if (ticket.queueId) {
        socketIO.emitQueueUpdate(ticket.businessId.toString(), ticket.queueId.toString());
      }
    }

    // Send Notification
    if (ticket.userId) {
      NotificationService.createNotification({
        userId: ticket.userId,
        businessId: ticket.businessId,
        ticketId: ticket._id,
        type: 'ticket',
        message: `Your ticket #${ticket.ticketNumber} has been reactivated.`,
        emailSubject: "Ticket Reactivated 🔄"
      }).catch(err => console.error("Reactivate notification failed:", err));
    }

    return res.json({
      status: "success",
      message: "Ticket reactivated",
      data: ticket,
    });
  } catch (err) {
    console.error("reactivateTicket error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// ===============================
// MARK TICKET AS PAID (Cash)
// ===============================
exports.markTicketPaid = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (!["staff", "owner", "business"].includes(req.user.role))
      return res.status(403).json({
        message: "Insufficient permissions to update payment",
      });

    // Update ticket status
    ticket.paymentStatus = "paid";
    ticket.paymentMethod = ticket.paymentMethod || "cash"; 
    await ticket.save();

    // Create Payment Record
    try {
      const amount = ticket.price || req.body.amount || 0;
      
      const payment = await Payment.create({
        businessId: ticket.businessId,
        ticketId: ticket._id,
        userId: ticket.userId, // Can be null for guests
        amount: amount, // Store as regular number, not cents
        paymentMethod: 'cash',
        transactionId: `CASH_${crypto.randomBytes(4).toString('hex')}_${Date.now()}`,
        status: 'completed',
        paidAt: new Date()
      });

      // Update ticket with payment reference
      ticket.paymentId = payment._id;
      await ticket.save();

    } catch (paymentError) {
      console.error("Error creating payment record for cash transaction:", paymentError);
      // Don't fail the request if payment record fails, but log it
    }

    const socketIO = req.app.get("socketIO");
    if (socketIO) {
      socketIO.emitTicketUpdated(ticket.businessId.toString(), ticket);
    }

    // Send Notification
    if (ticket.userId) {
      NotificationService.createNotification({
        userId: ticket.userId,
        businessId: ticket.businessId,
        ticketId: ticket._id,
        type: 'payment',
        message: `Your payment for Ticket #${ticket.ticketNumber} has been confirmed.`,
        emailSubject: "Payment Confirmed 💳"
      }).catch(err => console.error("Paid notification failed:", err));
    }

    return res.json({
      status: "success",
      message: "Ticket marked as paid",
      data: ticket,
    });
  } catch (err) {
    console.error("markTicketPaid error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
