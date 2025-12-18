const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },
    refreshTokens: [
      {
        token: String,
        createdAt: Date,
        expiresAt: Date,
      },
    ],
  },
  { timestamps: true },
);

// Hash password before saving if modified
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // If the password already looks like a bcrypt hash, skip re-hashing.
  // This prevents double-hashing when helper scripts set a hashed password.
  if (typeof this.password === 'string' && /^\$2[aby]\$/.test(this.password)) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Instance method to compare passwords
adminSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
