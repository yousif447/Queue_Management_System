require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('./src/models/businessSchema');
const { generateBusinessEmbeddings } = require('./src/utils/embeddingService');

const MONGODB_URI = process.env.MONGODB_URI;

async function syncEmbeddings() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing in .env');
    process.exit(1);
  }

  if (!process.env.COHERE_API_KEY) {
    console.error('❌ COHERE_API_KEY is missing in .env');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database.');

    const businesses = await Business.find({});
    console.log(`\n📊 Found ${businesses.length} businesses to process.\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];
      console.log(`[${i + 1}/${businesses.length}] Processing: ${business.name}...`);
      
      try {
        const embeddings = await generateBusinessEmbeddings(business);
        
        if (embeddings && Object.keys(embeddings).length > 0) {
          await Business.findByIdAndUpdate(business._id, embeddings);
          updatedCount++;
          console.log(`   ✅ Embeddings generated and saved.`);
        } else {
          skippedCount++;
          console.log(`   ⚠️  No embeddings generated (missing data?).`);
        }
        
        // Add small delay to avoid rate limiting
        if (i < businesses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Sync Complete!');
    console.log('='.repeat(50));
    console.log(`Total businesses: ${businesses.length}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⚠️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(50) + '\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Fatal Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

syncEmbeddings();

