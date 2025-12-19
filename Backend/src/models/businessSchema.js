const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const businessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
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
      enum: ["business", "owner", "admin"],
      default: "business",
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,

    // Refresh tokens
    refreshTokens: [
      {
        token: String, // hashed token
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date },
      },
    ],

    mobilePhone: { type: String, required: true, minlength: 11, maxlength: 11 },
    landlinePhone: { type: String, required: true, minlength: 8, maxlength: 8 },

    profileImage: { type: String },
    businessImages: [String],

    address: { type: String, required: true },
    specialization: { 
      type: String,
      enum: [
        'Medical',
        'Healthcare',
        'Banking',
        'Finance',
        'Telecom',
        'Government',
        'Education',
        'Restaurant',
        'Retail',
        'Technology',
        'Automotive',
        'Real Estate',
        'Legal',
        'Consulting',
        'Entertainment',
        'Fitness',
        'Beauty',
        'Travel',
        'Insurance',
        'Logistics'
      ],
      required: true
    },
    ourClients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    workingHours: [
      {
        days: {
          type: String,
          enum: [
            "Saturday",
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
          ],
          required: true,
        },
        openTime: { type: String, required: true },
        closeTime: { type: String, required: true },
        isClosed: { type: Boolean, default: false },
      },
    ],

    service: [
      {
        name: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        duration: { type: Number, required: true },
      },
    ],

    queueSettings: [
      {
        maxPatientsPerDay: { type: Number, required: true },
        LastTimeToAppoint: { type: String, required: true },
      },
    ],

    paymentMethod: {
      type: [String],
      default: ["cash"],
      required: true,
    },

    // Subscription & Billing
    subscription: {
      plan: {
        type: String,
        enum: ["basic", "pro", "enterprise", "trial"],
        default: "basic"
      },
      status: {
        type: String,
        enum: ["active", "inactive", "cancelled", "past_due", "trialing"],
        default: "inactive"  // New businesses must complete payment
      },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      currentPeriodStart: Date,
      currentPeriodEnd: Date,
      trialEndsAt: Date,
      cancelAtPeriodEnd: Boolean,
      // Monthly booking tracking
      monthlyBookingCount: {
        type: Number,
        default: 0
      },
      lastBookingReset: {
        type: Date,
        default: Date.now
      }
    },

    // AI Embeddings for semantic search
    nameEmbedding: [Number],
    servicesEmbedding: [Number],
    specializationEmbedding: [Number],
    combinedEmbedding: [Number],

    // Review management
    rating: {
      type: Number,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    },
  },
  { timestamps: true },
);

// -------------------- Hooks & Methods --------------------

// Hash password before save
businessSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now() - 1000; // ensure JWT issued after this
  next();
});

// Compare password
businessSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create password reset token
const crypto = require("crypto");
businessSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Check if password changed after JWT issued
businessSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Virtual field to check if business is currently open
businessSchema.virtual('isOpen').get(function() {
  if (!this.workingHours || this.workingHours.length === 0) {
    return false;
  }

  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.toTimeString().slice(0, 5);

  // Find today's schedule
  const todaySchedule = this.workingHours.find(schedule => {
    return schedule.days === currentDay;
  });

  if (!todaySchedule || todaySchedule.isClosed) {
    return false;
  }

  // Check if current time is within working hours
  if (todaySchedule.openTime && todaySchedule.closeTime) {
    return currentTime >= todaySchedule.openTime && currentTime <= todaySchedule.closeTime;
  }

  return false;
});

// Ensure virtuals are included in JSON
businessSchema.set('toJSON', { virtuals: true });
businessSchema.set('toObject', { virtuals: true });

const Business = mongoose.model("Business", businessSchema);
module.exports = Business;
