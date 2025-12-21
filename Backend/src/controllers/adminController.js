const Users = require("../models/userSchema");
const Business = require("../models/businessSchema");
const Admin = require("../models/adminSchema");

// Optional models - may not exist in all setups
let Ticket = null;
let Subscription = null;
try { Ticket = require("../models/ticketSchema"); } catch (e) {}
try { Subscription = require("../models/subscriptionSchema"); } catch (e) {}

// -------------------------
// GET /api/v1/admin/dashboard
// -------------------------
exports.dashboard = async (req, res) => {
  try {
    // Basic counts
    const userCount = await Users.countDocuments({ role: "user" });

    const adminSchemaCount = await Admin.countDocuments();
    const userSchemaAdminCount = await Users.countDocuments({ role: "admin" });
    const adminCount = adminSchemaCount + userSchemaAdminCount;
    const businessUserCount = await Users.countDocuments({ role: "owner" });
    const businessCount = await Business.countDocuments();
    const activeBusinessCount = await Business.countDocuments({ status: "active" });
    
    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Ticket statistics
    let ticketStats = { total: 0, completed: 0, pending: 0, cancelled: 0, today: 0 };
    if (Ticket) {
      try {
        ticketStats.total = await Ticket.countDocuments();
        ticketStats.completed = await Ticket.countDocuments({ status: { $in: ["completed", "done", "ended"] } });
        ticketStats.pending = await Ticket.countDocuments({ status: { $in: ["waiting", "called", "in-progress", "pending_payment"] } });
        ticketStats.cancelled = await Ticket.countDocuments({ status: { $in: ["cancelled", "missed"] } });
        ticketStats.today = await Ticket.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } });
      } catch (e) { console.log("Ticket query error:", e.message); }
    }
    
    // Revenue from tickets (sum of paid tickets)
    let totalRevenue = 0;
    if (Ticket) {
      try {
        const paidTickets = await Ticket.find({ paymentStatus: "paid" }).select("price");
        totalRevenue = paidTickets.reduce((sum, t) => sum + (t.price || 0), 0);
      } catch (e) { console.log("Revenue query error:", e.message); }
    }
    
    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await Users.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo },
      role: "user"
    });
    const recentBusinesses = await Business.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });
    
    // Today's new users and businesses
    const todayUsers = await Users.countDocuments({ createdAt: { $gte: today, $lt: tomorrow }, role: "user" });
    const todayBusinesses = await Business.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } });
    
    // Get recent activities (last 5 users and businesses)
    const recentUsersList = await Users.find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email createdAt");
    const recentBusinessesList = await Business.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name specialization status createdAt");
    
    // Monthly growth data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - i);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      const monthUsers = await Users.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate },
        role: "user"
      });
      const monthBusinesses = await Business.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate }
      });
      
      let monthTickets = 0;
      if (Ticket) {
        try {
          monthTickets = await Ticket.countDocuments({
            createdAt: { $gte: startDate, $lt: endDate }
          });
        } catch (e) {}
      }
      
      monthlyData.push({
        month: startDate.toLocaleString('default', { month: 'short' }),
        year: startDate.getFullYear(),
        users: monthUsers,
        businesses: monthBusinesses,
        tickets: monthTickets
      });
    }

    res.status(200).json({
      status: "success",
      data: { 
        userCount, 
        adminCount,
        businessUserCount,
        businessCount,
        activeBusinessCount,
        ticketStats,
        totalRevenue,
        todayStats: {
          users: todayUsers,
          businesses: todayBusinesses,
          tickets: ticketStats.today
        },
        growth: {
          recentUsers,
          recentBusinesses,
          userGrowthPercent: userCount > 0 ? Math.round((recentUsers / userCount) * 100) : 0,
          businessGrowthPercent: businessCount > 0 ? Math.round((recentBusinesses / businessCount) * 100) : 0
        },
        monthlyData,
        recentActivity: {
          users: recentUsersList,
          businesses: recentBusinessesList
        }
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// -------------------------
// GET /api/v1/admin/users
// -------------------------
exports.getAllUsers = async (req, res) => {
  try {
    const users = await Users.find();
    const admins = await Admin.find(); // Get admins from Admin schema
    
    // Combine users and admins
    const allUsers = [...users, ...admins];

    res.status(200).json({
      status: "success",
      results: allUsers.length,
      users: allUsers,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// -------------------------
// GET /api/v1/admin/businesses
// -------------------------
exports.getAllBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find();

    res.status(200).json({
      status: "success",
      results: businesses.length,
      businesses,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// -------------------------
// GET /api/v1/admin/users/:id
// -------------------------
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    let user = await Users.findById(id);
    if (!user) {
      // Try finding in Admin schema
      user = await Admin.findById(id);
    }
    
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User/Admin not found",
      });
    }

    res.status(200).json({
      status: "success",
      user,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// -------------------------
// PATCH /api/v1/admin/users/:id
// -------------------------
exports.updateUserById = async (req, res) => {
  try {
    const { id } = req.params;



    // Sanitize input: empty phone should be null to avoid validation error
    if (req.body.phone === "") {
      req.body.phone = null;
    }

    let updatedUser = await Users.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedUser) {
      // Try updating in Admin schema
      // Note: Admin schema might not have all fields that User schema has (e.g. phone)
      // Filter body to only include valid Admin fields if necessary, but Mongoose ignores unknown fields by default
      updatedUser = await Admin.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      });
    }

    if (!updatedUser) {
      return res.status(404).json({
        status: "fail",
        message: "User/Admin not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ status: "fail", message: err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ status: "fail", message: "Duplicate field value: " + JSON.stringify(err.keyValue) });
    }
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// -------------------------
// DELETE /api/v1/admin/users/:id
// -------------------------
exports.deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;

    let deletedUser = await Users.findByIdAndDelete(id);

    if (!deletedUser) {
      // Try deleting from Admin schema
      deletedUser = await Admin.findByIdAndDelete(id);
    }

    if (!deletedUser) {
      return res.status(404).json({
        status: "fail",
        message: "User/Admin not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// -------------------------
// GET /api/v1/admin/tickets
// -------------------------
exports.getAllTickets = async (req, res) => {
  try {
    if (!Ticket) {
      return res.status(200).json({
        status: "success",
        results: 0,
        tickets: [],
      });
    }
    
    const tickets = await Ticket.find()
      .populate("businessId", "name")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(100); // Limit to last 100 tickets

    res.status(200).json({
      status: "success",
      results: tickets.length,
      tickets,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// -------------------------
// PATCH /api/v1/admin/users/:id/ban
// -------------------------
exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await Users.findByIdAndUpdate(
      id,
      { 
        isBanned: true, 
        banReason: reason || "Banned by admin",
        bannedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "User banned successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// -------------------------
// PATCH /api/v1/admin/users/:id/unban
// -------------------------
exports.unbanUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await Users.findByIdAndUpdate(
      id,
      { 
        isBanned: false, 
        banReason: null,
        bannedAt: null
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "User unbanned successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// -------------------------
// POST /api/v1/admin/create-admin
// -------------------------
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if email already exists in Admin schema
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        status: "fail",
        message: "Email already exists (Admin)",
      });
    }

    // Check if email already exists in User schema (to prevent conflicts)
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "Email already exists (User)",
      });
    }

    // Check Business schema too
    const existingBusiness = await Business.findOne({ email });
    if (existingBusiness) {
      return res.status(400).json({
        status: "fail",
        message: "Email already exists (Business)",
      });
    }

    // Create new admin in Admin schema
    console.log(`Creating admin: ${email}, password length: ${password?.length}`);
    const newAdmin = await Admin.create({
      name,
      email,
      password, // Pre-save hook will hash this
      role: "admin",
      // Phone is not in Admin schema, so we skip it
    });

    // Remove password from response
    newAdmin.password = undefined;

    res.status(201).json({
      status: "success",
      message: "Admin created successfully",
      admin: newAdmin,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// -------------------------
// GET /api/v1/admin/system-stats
// -------------------------
exports.getSystemStats = async (req, res) => {
  try {
    // Get counts by role
    const usersByRole = await Users.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);
    
    // Add admin schema count to admin role or as separate entry?
    // Let's add it to the existing "admin" role count if it exists, or push new
    const adminCount = await Admin.countDocuments();
    const adminRoleIndex = usersByRole.findIndex(r => r._id === "admin");
    if (adminRoleIndex !== -1) {
      usersByRole[adminRoleIndex].count += adminCount;
    } else if (adminCount > 0) {
      usersByRole.push({ _id: "admin", count: adminCount });
    }

    // Get banned users count
    const bannedUsers = await Users.countDocuments({ isBanned: true });

    // Get businesses by status
    const businessesByStatus = await Business.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Get ticket stats if available
    let ticketsByStatus = [];
    let totalRevenue = 0;
    if (Ticket) {
      ticketsByStatus = await Ticket.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
      
      const revenueResult = await Ticket.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$price" } } }
      ]);
      totalRevenue = revenueResult[0]?.total || 0;
    }

    // Get registrations per day for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRegistrations = await Users.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      status: "success",
      data: {
        usersByRole,
        bannedUsers,
        businessesByStatus,
        ticketsByStatus,
        totalRevenue,
        dailyRegistrations,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// -------------------------
// GET /api/v1/admin/reviews
// -------------------------
exports.getAllReviews = async (req, res) => {
  try {
    let Review;
    try { Review = require("../models/reviewSchema"); } catch (e) {
      return res.status(200).json({ status: "success", results: 0, reviews: [] });
    }
    
    const reviews = await Review.find()
      .populate("businessId", "name")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      status: "success",
      results: reviews.length,
      reviews,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// -------------------------
// DELETE /api/v1/admin/reviews/:id
// -------------------------
exports.deleteReview = async (req, res) => {
  try {
    let Review;
    try { Review = require("../models/reviewSchema"); } catch (e) {
      return res.status(404).json({ status: "fail", message: "Review model not found" });
    }
    
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);
    
    if (!review) {
      return res.status(404).json({ status: "fail", message: "Review not found" });
    }

    res.status(200).json({ status: "success", message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// -------------------------
// GET /api/v1/admin/categories
// -------------------------
exports.getCategories = async (req, res) => {
  try {
    // Get categories from business schema enum
    const categories = [
      'Medical', 'Healthcare', 'Banking', 'Finance', 'Telecom', 'Government',
      'Education', 'Restaurant', 'Retail', 'Technology', 'Automotive',
      'Real Estate', 'Legal', 'Consulting', 'Entertainment', 'Fitness',
      'Beauty', 'Travel', 'Insurance', 'Logistics'
    ];
    
    // Count businesses per category
    const categoryCounts = await Business.aggregate([
      { $group: { _id: "$specialization", count: { $sum: 1 } } }
    ]);
    
    const categoryData = categories.map(cat => {
      const found = categoryCounts.find(c => c._id === cat);
      return { name: cat, count: found ? found.count : 0 };
    });

    res.status(200).json({
      status: "success",
      categories: categoryData,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// -------------------------
// GET /api/v1/admin/payments
// -------------------------
exports.getAllPayments = async (req, res) => {
  try {
    if (!Ticket) {
      return res.status(200).json({ status: "success", results: 0, payments: [] });
    }
    
    // Get all paid tickets as payment records
    const payments = await Ticket.find({ paymentStatus: "paid" })
      .populate("businessId", "name")
      .populate("userId", "name email")
      .sort({ completedAt: -1, updatedAt: -1 })
      .limit(100)
      .select("ticketNumber businessId userId price paymentMethod paymentStatus createdAt completedAt");

    res.status(200).json({
      status: "success",
      results: payments.length,
      payments,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// -------------------------
// GET /api/v1/admin/staff
// -------------------------
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Users.find({ role: "staff" })
      .populate("businessIds", "name")
      .select("name email phone businessIds createdAt");

    res.status(200).json({
      status: "success",
      results: staff.length,
      staff,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// -------------------------
// GET /api/v1/admin/subscriptions
// -------------------------
exports.getSubscriptions = async (req, res) => {
  try {
    const businesses = await Business.find()
      .select("name email subscription status createdAt")
      .sort({ createdAt: -1 });

    const subscriptionData = businesses.map(b => ({
      _id: b._id,
      businessName: b.name,
      email: b.email,
      plan: b.subscription?.plan || "basic",
      status: b.subscription?.status || "inactive",
      periodEnd: b.subscription?.currentPeriodEnd,
      businessStatus: b.status,
      createdAt: b.createdAt,
    }));

    // Summary stats
    const stats = {
      total: businesses.length,
      active: subscriptionData.filter(s => s.status === "active").length,
      trial: subscriptionData.filter(s => s.status === "trialing").length,
      inactive: subscriptionData.filter(s => s.status === "inactive").length,
    };

    res.status(200).json({
      status: "success",
      stats,
      subscriptions: subscriptionData,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// -------------------------
// POST /api/v1/admin/announcements
// -------------------------
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, targetAudience } = req.body;
    
    // In a real system, you'd save to a notifications/announcements collection
    // and/or send push notifications. For now, we'll create notifications for users.
    let Notification;
    try { Notification = require("../models/notificationSchema"); } catch (e) {
      return res.status(200).json({ 
        status: "success", 
        message: "Announcement created (no notification model available)",
        announcement: { title, message, targetAudience }
      });
    }
    
    // Get target users based on audience
    let targetUsers = [];
    if (targetAudience === "all" || targetAudience === "users") {
      const users = await Users.find({ role: "user" }).select("_id");
      targetUsers = targetUsers.concat(users.map(u => u._id));
    }
    if (targetAudience === "all" || targetAudience === "owners") {
      const owners = await Users.find({ role: "owner" }).select("_id");
      targetUsers = targetUsers.concat(owners.map(u => u._id));
    }

    // Create notifications for each user (batch insert)
    // Combine title and message since schema only has 'message' field
    const fullMessage = title ? `${title}: ${message}` : message;
    const notifications = targetUsers.map(userId => ({
      userId,
      message: fullMessage,
      type: "system", // Use 'system' as it's in the enum
      isRead: false,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      status: "success",
      message: `Announcement sent to ${notifications.length} users`,
      announcement: { title, message, targetAudience, recipientCount: notifications.length },
    });
  } catch (err) {
    console.error("Announcement error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// -------------------------
// GET /api/v1/admin/audit-logs
// -------------------------
exports.getAuditLogs = async (req, res) => {
  try {
    // In a production system, you'd have an audit log collection
    // For now, return recent admin actions based on entity updates
    const recentUsers = await Users.find()
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("name email role updatedAt");
      
    const recentBusinesses = await Business.find()
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("name status updatedAt");

    res.status(200).json({
      status: "success",
      logs: {
        recentUserUpdates: recentUsers,
        recentBusinessUpdates: recentBusinesses,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// -------------------------
// GET /api/v1/admin/export/:type
// -------------------------
exports.exportData = async (req, res) => {
  try {
    const { type } = req.params;
    let data = [];
    let headers = [];
    
    switch (type) {
      case "users":
        data = await Users.find().select("-password -refreshTokens").lean();
        headers = ["_id", "name", "email", "phone", "role", "status", "createdAt"];
        break;
      case "businesses":
        data = await Business.find().select("-password -refreshTokens").lean();
        headers = ["_id", "name", "email", "specialization", "status", "mobilePhone", "address", "createdAt"];
        break;
      case "tickets":
        if (Ticket) {
          data = await Ticket.find().populate("businessId", "name").populate("userId", "name email").lean();
          headers = ["_id", "ticketNumber", "businessId.name", "userId.name", "status", "paymentStatus", "price", "createdAt"];
        }
        break;
      case "reviews":
        const Review = require("../models/reviewSchema");
        data = await Review.find().populate("businessId", "name").populate("userId", "name").lean();
        headers = ["_id", "userId.name", "businessId.name", "rating", "comment", "createdAt"];
        break;
      default:
        return res.status(400).json({ status: "fail", message: "Invalid export type" });
    }
    
    // Convert to CSV
    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((acc, key) => acc?.[key], obj) || "";
    };
    
    let csv = headers.join(",") + "\n";
    data.forEach(item => {
      const row = headers.map(h => {
        let val = getNestedValue(item, h);
        if (val instanceof Date) val = val.toISOString();
        if (typeof val === "object") val = JSON.stringify(val);
        // Escape quotes and wrap in quotes if contains comma
        val = String(val || "").replace(/"/g, '""');
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          val = `"${val}"`;
        }
        return val;
      });
      csv += row.join(",") + "\n";
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${type}_export_${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// -------------------------
// GET /api/v1/admin/queue-monitoring
// -------------------------
exports.getQueueMonitoring = async (req, res) => {
  try {
    let Queue;
    try { Queue = require("../models/queueSchema"); } catch (e) {
      return res.status(200).json({ status: "success", queues: [] });
    }
    
    const queues = await Queue.find()
      .populate("businessId", "name")
      .sort({ updatedAt: -1 });
    
    // Get ticket counts for each queue
    const queueData = await Promise.all(queues.map(async (q) => {
      let waiting = 0, serving = 0;
      if (Ticket) {
        waiting = await Ticket.countDocuments({ queueId: q._id, status: "waiting" });
        serving = await Ticket.countDocuments({ queueId: q._id, status: { $in: ["called", "in-progress"] } });
      }
      return {
        _id: q._id,
        businessName: q.businessId?.name || "Unknown",
        status: q.status,
        currentNumber: q.currentNumber || 0,
        waiting,
        serving,
        updatedAt: q.updatedAt,
      };
    }));

    res.status(200).json({
      status: "success",
      queues: queueData,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// -------------------------
// POST /api/v1/admin/bulk-action
// -------------------------
exports.bulkAction = async (req, res) => {
  try {
    const { action, type, ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: "fail", message: "No items selected" });
    }
    
    let result = { affected: 0 };
    
    switch (type) {
      case "users":
        if (action === "delete") {
          const r = await Users.deleteMany({ _id: { $in: ids }, role: { $ne: "admin" } });
          result.affected = r.deletedCount;
        } else if (action === "ban") {
          const r = await Users.updateMany({ _id: { $in: ids } }, { isBanned: true, banReason: "Bulk ban by admin" });
          result.affected = r.modifiedCount;
        } else if (action === "unban") {
          const r = await Users.updateMany({ _id: { $in: ids } }, { isBanned: false, banReason: null });
          result.affected = r.modifiedCount;
        }
        break;
      case "businesses":
        if (action === "delete") {
          const r = await Business.deleteMany({ _id: { $in: ids } });
          result.affected = r.deletedCount;
        } else if (action === "activate") {
          const r = await Business.updateMany({ _id: { $in: ids } }, { status: "active" });
          result.affected = r.modifiedCount;
        } else if (action === "deactivate") {
          const r = await Business.updateMany({ _id: { $in: ids } }, { status: "inactive" });
          result.affected = r.modifiedCount;
        }
        break;
      case "reviews":
        if (action === "delete") {
          const Review = require("../models/reviewSchema");
          const r = await Review.deleteMany({ _id: { $in: ids } });
          result.affected = r.deletedCount;
        }
        break;
      default:
        return res.status(400).json({ status: "fail", message: "Invalid type" });
    }

    res.status(200).json({
      status: "success",
      message: `${action} completed on ${result.affected} items`,
      result,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// -------------------------
// GET /api/v1/admin/system-health
// -------------------------
exports.getSystemHealth = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    
    // Database status
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    
    // Memory usage
    const memUsage = process.memoryUsage();
    
    // Uptime
    const uptime = process.uptime();
    
    // Count stats
    const totalUsers = await Users.countDocuments();
    const totalBusinesses = await Business.countDocuments();
    let totalTickets = 0;
    if (Ticket) {
      totalTickets = await Ticket.countDocuments();
    }

    res.status(200).json({
      status: "success",
      health: {
        database: dbStatus,
        uptime: Math.floor(uptime),
        uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + " MB",
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + " MB",
          rss: Math.round(memUsage.rss / 1024 / 1024) + " MB",
        },
        counts: {
          users: totalUsers,
          businesses: totalBusinesses,
          tickets: totalTickets,
        },
        serverTime: new Date().toISOString(),
        nodeVersion: process.version,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// -------------------------
// GET /api/v1/admin/login-history
// -------------------------
exports.getLoginHistory = async (req, res) => {
  try {
    // Get users sorted by last login
    const users = await Users.find({ lastLogin: { $exists: true, $ne: null } })
      .sort({ lastLogin: -1 })
      .limit(50)
      .select("name email role lastLogin");
    
    const businesses = await Business.find({ lastLogin: { $exists: true, $ne: null } })
      .sort({ lastLogin: -1 })
      .limit(50)
      .select("name email lastLogin");

    res.status(200).json({
      status: "success",
      loginHistory: {
        users,
        businesses,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// -------------------------
// GET /api/v1/admin/settings
// -------------------------
exports.getSettings = async (req, res) => {
  try {
    // In production, you'd store these in a Settings collection
    // For now, return default settings
    res.status(200).json({
      status: "success",
      settings: {
        maintenanceMode: false,
        allowNewRegistrations: true,
        allowBusinessRegistrations: true,
        maxTicketsPerUser: 5,
        defaultBookingLimit: 50,
        emailNotifications: true,
        smsNotifications: false,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
