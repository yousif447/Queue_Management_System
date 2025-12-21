const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

//Get admin dashboard overview
router.get(
  "/dashboard",
  protect,
  restrictTo("admin"),
  adminController.dashboard,
);

//Get all users (admin panel)
router.get(
  "/users",
  protect,
  restrictTo("admin"),
  adminController.getAllUsers,
);

//Get all businesses (admin panel)
router.get(
  "/businesses",
  protect,
  restrictTo("admin"),
  adminController.getAllBusinesses,
);

//Get all tickets (admin panel)
router.get(
  "/tickets",
  protect,
  restrictTo("admin"),
  adminController.getAllTickets,
);

//Get user by ID (admin only)
router.get(
  "/users/:id",
  protect,
  restrictTo("admin"),
  adminController.getUserById,
);

//Update user by ID (admin only)
router.put(
  "/users/:id",
  protect,
  restrictTo("admin"),
  adminController.updateUserById,
);

//Delete user by ID (admin only)
router.delete(
  "/users/:id",
  protect,
  restrictTo("admin"),
  adminController.deleteUserById,
);

//Ban/Suspend user (admin only)
router.patch(
  "/users/:id/ban",
  protect,
  restrictTo("admin"),
  adminController.banUser,
);

//Unban user (admin only)
router.patch(
  "/users/:id/unban",
  protect,
  restrictTo("admin"),
  adminController.unbanUser,
);

//Create new admin (admin only)
router.post(
  "/create-admin",
  protect,
  restrictTo("admin"),
  adminController.createAdmin,
);

//Get system statistics (admin only)
router.get(
  "/system-stats",
  protect,
  restrictTo("admin"),
  adminController.getSystemStats,
);

//Get all reviews (admin only)
router.get(
  "/reviews",
  protect,
  restrictTo("admin"),
  adminController.getAllReviews,
);

//Delete review (admin only)
router.delete(
  "/reviews/:id",
  protect,
  restrictTo("admin"),
  adminController.deleteReview,
);

//Get categories with counts (admin only)
router.get(
  "/categories",
  protect,
  restrictTo("admin"),
  adminController.getCategories,
);

//Get all payments (admin only)
router.get(
  "/payments",
  protect,
  restrictTo("admin"),
  adminController.getAllPayments,
);

//Get all staff (admin only)
router.get(
  "/staff",
  protect,
  restrictTo("admin"),
  adminController.getAllStaff,
);

//Get all subscriptions (admin only)
router.get(
  "/subscriptions",
  protect,
  restrictTo("admin"),
  adminController.getSubscriptions,
);

//Create announcement (admin only)
router.post(
  "/announcements",
  protect,
  restrictTo("admin"),
  adminController.createAnnouncement,
);

//Get audit logs (admin only)
router.get(
  "/audit-logs",
  protect,
  restrictTo("admin"),
  adminController.getAuditLogs,
);

//Export data as CSV (admin only)
router.get(
  "/export/:type",
  protect,
  restrictTo("admin"),
  adminController.exportData,
);

//Queue monitoring (admin only)
router.get(
  "/queue-monitoring",
  protect,
  restrictTo("admin"),
  adminController.getQueueMonitoring,
);

//Bulk action (admin only)
router.post(
  "/bulk-action",
  protect,
  restrictTo("admin"),
  adminController.bulkAction,
);

//System health (admin only)
router.get(
  "/system-health",
  protect,
  restrictTo("admin"),
  adminController.getSystemHealth,
);

//Login history (admin only)
router.get(
  "/login-history",
  protect,
  restrictTo("admin"),
  adminController.getLoginHistory,
);

//Get settings (admin only)
router.get(
  "/settings",
  protect,
  restrictTo("admin"),
  adminController.getSettings,
);

module.exports = router;
