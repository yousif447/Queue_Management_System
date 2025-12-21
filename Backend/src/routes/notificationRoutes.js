const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

// router.post("/test", protect, notificationController.sendTestNotification); // Removed
router.get("/", protect, notificationController.getNotifications);
router.patch("/read-all", protect, notificationController.markAllAsRead);
router.patch("/:id/read", protect, notificationController.markAsRead);
router.delete("/:id", protect, notificationController.deleteNotification);
router.delete("/", protect, notificationController.deleteAllNotifications);
module.exports = router;
