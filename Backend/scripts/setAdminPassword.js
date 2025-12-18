// scripts/setAdminPassword.js
// Usage: node scripts/setAdminPassword.js admin@example.com newPassword

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Admin = require('../src/models/adminSchema');
const bcrypt = require('bcryptjs');

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/setAdminPassword.js <email> <newPassword>');
    process.exit(1);
  }

  const [email, newPassword] = args;
  if (!email || !newPassword) {
    console.error('Email and password are required');
    process.exit(1);
  }

  try {
    await connectDB();

    const hashed = await bcrypt.hash(newPassword, 12);

    const admin = await Admin.findOne({ email }).select('+password');

    if (admin) {
      admin.password = hashed;
      await admin.save();
      console.log(`Updated password for admin ${email}`);
    } else {
      // Create admin if not exist
      const newAdmin = new Admin({ name: 'Admin', email, password: hashed });
      await newAdmin.save();
      console.log(`Created admin ${email} with provided password`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error setting admin password:', err);
    process.exit(1);
  }
}

run();
