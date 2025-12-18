const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Business = require('../src/models/businessSchema');
const Review = require('../src/models/reviewSchema');

dotenv.config({ path: '../.env' });

const debugRatings = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Find a business that should have reviews
    const reviews = await Review.find().limit(5).populate('businessId');
    console.log(`Found ${reviews.length} reviews sample.`);

    if (reviews.length === 0) {
        console.log("No reviews found in the database!");
        process.exit(0);
    }

    const businessId = reviews[0].businessId._id;
    const businessName = reviews[0].businessId.name;
    
    console.log(`Checking Business: ${businessName} (${businessId})`);

    const business = await Business.findById(businessId);
    console.log('Business DB Record:', {
        name: business.name,
        rating: business.rating,
        reviewCount: business.reviewCount,
        id: business._id
    });

    // Count actual reviews
    const count = await Review.countDocuments({ businessId });
    console.log(`Actual Review Count in DB: ${count}`);

    // Calculate Average
    const stats = await Review.aggregate([
        { $match: { businessId: businessId } },
        {
          $group: {
            _id: "$businessId",
            avgRating: { $avg: "$rating" }
          }
        }
    ]);
    console.log('Calculated Stats:', stats);

    if (business.rating === undefined || business.rating === 0) {
        console.log('FIXING: Updating business record...');
        const avg = stats.length > 0 ? stats[0].avgRating : 0;
        await Business.findByIdAndUpdate(businessId, {
            rating: avg,
            reviewCount: count
        });
        console.log('Update Complete.');
        
        const updated = await Business.findById(businessId);
         console.log('Updated Business Record:', {
            name: updated.name,
            rating: updated.rating,
            reviewCount: updated.reviewCount
        });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

debugRatings();
