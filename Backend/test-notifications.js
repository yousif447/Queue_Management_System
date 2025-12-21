require('dotenv').config();
const mongoose = require('mongoose');
const NotificationService = require('./src/utils/notificationService');
const connectDB = require('./src/config/db');

async function testNotificationFlow() {
  try {
    console.log("🚀 Starting Notification Flow Test...");
    
    // Connect to DB
    await connectDB();
    console.log("✅ DB Connected");

    // Mock SocketIO if needed (though init won't have it in this script)
    // NotificationService.init({ emitToUser: (id, event, data) => console.log(`📡 Socket Emitted: ${event}`) });

    const testData = {
      userId: new mongoose.Types.ObjectId(), // Fake ID
      type: 'ticket',
      message: "Test Notification Content 🧪",
      userEmail: process.env.EMAIL_USER, // Send to self for testing
      userName: "Test User",
      sendEmail: true
    };

    console.log("Creating notification...");
    const notif = await NotificationService.createNotification(testData);
    console.log("✅ Notification saved to DB:", notif._id);
    
    console.log("Check your email (if RESEND_API_KEY is configured correctly).");
    
    // Clean up
    // await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Test Failed:", error);
    process.exit(1);
  }
}

testNotificationFlow();
