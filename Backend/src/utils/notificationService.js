const Notification = require("../models/notificationSchema");
const { sendNotificationEmail } = require("./emailService");

/**
 * Unified Notification Service
 * Handles DB storage, real-time socket emission, and email delivery.
 */
class NotificationService {
  constructor() {
    this.socketIO = null;
  }

  /**
   * Initialize with SocketIO instance
   * @param {Object} socketIO 
   */
  init(socketIO) {
    this.socketIO = socketIO;
  }

  /**
   * Create and send a notification
   * @param {Object} data 
   * @param {String} data.userId - Recipient user ID
   * @param {String} data.businessId - Related business ID
   * @param {String} data.ticketId - Related ticket ID
   * @param {String} data.queueId - Related queue ID
   * @param {String} data.type - Notification type (ticket, turn, payment, system)
   * @param {String} data.message - Notification message
   * @param {String} data.userEmail - Recipient email (optional)
   * @param {String} data.userName - Recipient name (optional)
   * @param {String} data.emailSubject - Email subject (optional)
   * @param {Boolean} data.sendEmail - Whether to send email (default: true if email provided)
   */
  async createNotification(data) {
    try {
      const {
        userId,
        businessId,
        ticketId,
        queueId,
        type,
        message,
        userEmail,
        userName,
        emailSubject,
        sendEmail = true
      } = data;

      // 1. Save to Database
      const notification = await Notification.create({
        userId,
        businessId,
        ticketId,
        queueId,
        type,
        message,
      });

      // 2. Emit Real-time Socket Event
      if (this.socketIO && userId && userId !== 'null' && userId !== 'undefined') {
        const targetUserId = String(userId._id || userId);
        this.socketIO.emitToUser(targetUserId, 'newNotification', {
          id: notification._id,
          type: notification.type,
          message: notification.message,
          timestamp: notification.createdAt,
          isRead: notification.isRead,
          data: notification
        });
      }

      // 3. Send Email Notification
      if (sendEmail && userEmail) {
        sendNotificationEmail({
          email: userEmail,
          name: userName || 'User',
          subject: emailSubject || this._getDefaultSubject(type),
          message: message,
          type: type
        }).catch(err => console.error("📧 Email Notification Failed:", err));
      }

      return notification;
    } catch (error) {
      console.error("❌ NotificationService Error:", error);
      throw error;
    }
  }

  _getDefaultSubject(type) {
    const subjects = {
      ticket: "Ticket Created 🎟️",
      turn: "It's Your Turn! 🔔",
      payment: "Payment Notification 💳",
      system: "System Update 📢"
    };
    return subjects[type] || "New Notification 🔔";
  }
}

module.exports = new NotificationService();
