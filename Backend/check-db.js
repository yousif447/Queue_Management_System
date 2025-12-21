const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./src/models/userSchema");
const Admin = require("./src/models/adminSchema");
const Business = require("./src/models/businessSchema");

async function check(email) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const user = await User.findOne({ email });
    const admin = await Admin.findOne({ email });
    const business = await Business.findOne({ email });

    console.log(`Results for ${email}:`);
    console.log(`- In User collection: ${user ? 'YES (role: ' + user.role + ')' : 'NO'}`);
    console.log(`- In Admin collection: ${admin ? 'YES' : 'NO'}`);
    console.log(`- In Business collection: ${business ? 'YES' : 'NO'}`);

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

const email = process.argv[2] || "a@a.com";
check(email);
