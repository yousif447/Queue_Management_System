const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Business = require('../src/models/businessSchema');
const Review = require('../src/models/reviewSchema');

dotenv.config({ path: '../.env' });

const syncRatings = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const businesses = await Business.find({});
    console.log(`Found ${businesses.length} businesses. Syncing ratings...`);

    for (const business of businesses) {
      console.log(`Processing ${business.name}...`);
      
      const stats = await Review.aggregate([
        { $match: { businessId: business._id } },
        {
          $group: {
            _id: '$businessId',
            nRating: { $sum: 1 },
            avgRating: { $avg: '$rating' }
          }
        }
      ]);

      if (stats.length > 0) {
        await Business.findByIdAndUpdate(business._id, {
          rating: stats[0].avgRating,
          reviewCount: stats[0].nRating
        });
        console.log(`Updated ${business.name}: Rating ${stats[0].avgRating.toFixed(1)}, Count ${stats[0].nRating}`);
      } else {
        await Business.findByIdAndUpdate(business._id, {
          rating: 0,
          reviewCount: 0
        });
        console.log(`Updated ${business.name}: No reviews.`);
      }
    }

    console.log('Sync complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing ratings:', error);
    process.exit(1);
  }
};

syncRatings();
