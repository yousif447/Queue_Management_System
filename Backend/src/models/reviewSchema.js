const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: false,
    },
    comment: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    anonymousName: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

// Static method to calculate average rating and save to Business
reviewSchema.statics.calcAverageRatings = async function (businessId) {
  const stats = await this.aggregate([
    {
      $match: { businessId: businessId },
    },
    {
      $group: {
        _id: "$businessId",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  try {
    if (stats.length > 0) {
      await mongoose.model("Business").findByIdAndUpdate(businessId, {
        rating: stats[0].avgRating,
        reviewCount: stats[0].nRating,
      });
    } else {
      await mongoose.model("Business").findByIdAndUpdate(businessId, {
        rating: 0,
        reviewCount: 0,
      });
    }
  } catch (error) {
    console.error("Error updating business ratings:", error);
  }
};

// Call calcAverageRatings after save
reviewSchema.post("save", function () {
  this.constructor.calcAverageRatings(this.businessId);
});

// Call calcAverageRatings after deleteOne
reviewSchema.post("deleteOne", { document: true, query: false }, function () {
  this.constructor.calcAverageRatings(this.businessId);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
