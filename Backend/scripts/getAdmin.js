// scripts/getAdmin.js
// Usage: node scripts/getAdmin.js admin@admin.com

require('dotenv').config();
const connectDB = require('../src/config/db');
const Admin = require('../src/models/adminSchema');

(async () => {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/getAdmin.js <email>');
    process.exit(1);
  }
  const email = args[0];
  try {
    await connectDB();
    const admin = await Admin.findOne({ email }).select('+password +refreshTokens');
    if (!admin) {
      console.log('Admin not found for email:', email);
      process.exit(0);
    }
    console.log('Admin document:');
    const doc = admin.toObject();
    console.log(JSON.stringify(doc, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error fetching admin:', err);
    process.exit(1);
  }
})();
