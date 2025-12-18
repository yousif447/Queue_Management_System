// scripts/hashAdminPasswords.js
// Run with: node scripts/hashAdminPasswords.js

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Admin = require('../src/models/adminSchema');
const bcrypt = require('bcryptjs');

const run = async () => {
  try {
    await connectDB();

    const admins = await Admin.find().select('+password');
    if (!admins || admins.length === 0) {
      console.log('No admin users found.');
      process.exit(0);
    }

    for (const admin of admins) {
      const pwd = admin.password;
      if (!pwd) {
        console.log(`Admin ${admin.email} has no password, skipping.`);
        continue;
      }

      // detect if already hashed (bcrypt hashes start with $2a$ or $2b$ or $2y$)
      if (/^\$2[aby]\$/.test(pwd)) {
        console.log(`Admin ${admin.email} already has hashed password.`);
        continue;
      }

      const hashed = await bcrypt.hash(pwd, 12);
      admin.password = hashed;
      await admin.save();
      console.log(`Hashed password for admin ${admin.email}`);
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error hashing admin passwords:', err);
    process.exit(1);
  }
};

run();
