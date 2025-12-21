// test-email.js
require('dotenv').config();
const { testConnection } = require('./src/utils/emailService');

async function runTest() {
  console.log("Starting SMTP connection test...");
  console.log("Current Environment Check:");
  console.log("- NODE_ENV:", process.env.NODE_ENV);
  console.log("- EMAIL_HOST:", process.env.EMAIL_HOST);
  console.log("- EMAIL_PORT:", process.env.EMAIL_PORT);
  console.log("- EMAIL_USER:", process.env.EMAIL_USER);
  console.log("- EMAIL_FROM:", process.env.EMAIL_FROM);
  console.log("- Has Password:", !!(process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS));

  const success = await testConnection();
  
  if (success) {
    console.log("\n✨ SUCCESS: Your email configuration is working!");
  } else {
    console.log("\n❌ FAILED: Please check the errors above and your provider settings.");
  }
}

runTest();
