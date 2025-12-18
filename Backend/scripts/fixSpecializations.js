require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('../src/models/businessSchema');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Fix specializations for all businesses
async function fixSpecializations() {
  try {
    console.log('\n🔧 Fixing business specializations...\n');

    // Fetch all businesses
    const businesses = await Business.find({});
    console.log(`📊 Found ${businesses.length} businesses\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    // Mapping of old categories to new specializations
    const categoryMap = {
      'clinic': 'Medical',
      'clicnk': 'Medical',
      'medical': 'Medical',
      'health': 'Healthcare',
      'doctor': 'Medical',
      'hospital': 'Medical',
      'bank': 'Banking',
      'banking': 'Banking',
      'finance': 'Finance',
      'telecom': 'Telecom',
      'phone': 'Telecom',
      'government': 'Government',
      'education': 'Education',
      'school': 'Education',
      'restaurant': 'Restaurant',
      'food': 'Restaurant',
      'retail': 'Retail',
      'shop': 'Retail',
      'store': 'Retail',
      'technology': 'Technology',
      'tech': 'Technology',
      'it': 'Technology',
      'automotive': 'Automotive',
      'car': 'Automotive',
      'real estate': 'Real Estate',
      'property': 'Real Estate',
      'legal': 'Legal',
      'law': 'Legal',
      'consulting': 'Consulting',
      'entertainment': 'Entertainment',
      'fitness': 'Fitness',
      'gym': 'Fitness',
      'beauty': 'Beauty',
      'salon': 'Beauty',
      'travel': 'Travel',
      'insurance': 'Insurance',
      'logistics': 'Logistics'
    };

    const validSpecializations = [
      'Medical', 'Healthcare', 'Banking', 'Finance', 'Telecom',
      'Government', 'Education', 'Restaurant', 'Retail', 'Technology',
      'Automotive', 'Real Estate', 'Legal', 'Consulting', 'Entertainment',
      'Fitness', 'Beauty', 'Travel', 'Insurance', 'Logistics'
    ];

    for (const business of businesses) {
      const currentSpec = business.specialization;
      
      // Check if specialization is valid
      if (validSpecializations.includes(currentSpec)) {
        console.log(`✅ ${business.name}: Already has valid specialization (${currentSpec})`);
        skippedCount++;
        continue;
      }

      // Try to map from current specialization
      let newSpec = null;
      if (currentSpec) {
        const lowerSpec = currentSpec.toLowerCase();
        newSpec = categoryMap[lowerSpec];
      }

      // If no mapping found, try to infer from business name or category
      if (!newSpec && business.category) {
        const lowerCat = business.category.toLowerCase();
        for (const [key, value] of Object.entries(categoryMap)) {
          if (lowerCat.includes(key)) {
            newSpec = value;
            break;
          }
        }
      }

      // If still no mapping, try from business name
      if (!newSpec && business.name) {
        const lowerName = business.name.toLowerCase();
        for (const [key, value] of Object.entries(categoryMap)) {
          if (lowerName.includes(key)) {
            newSpec = value;
            break;
          }
        }
      }

      // Default to 'Retail' if nothing found
      if (!newSpec) {
        newSpec = 'Retail';
      }

      // Update the business
      try {
        await Business.findByIdAndUpdate(business._id, {
          specialization: newSpec
        });
        console.log(`🔧 ${business.name}: ${currentSpec || 'None'} → ${newSpec}`);
        fixedCount++;
      } catch (error) {
        console.error(`❌ Error updating ${business.name}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Fixed: ${fixedCount}`);
    console.log(`⏭️  Skipped (already valid): ${skippedCount}`);
    console.log(`📊 Total: ${businesses.length}`);
    console.log('\n✨ Specialization fix complete!\n');
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Main execution
async function main() {
  await connectDB();
  await fixSpecializations();
  await mongoose.connection.close();
  console.log('👋 Disconnected from MongoDB');
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
