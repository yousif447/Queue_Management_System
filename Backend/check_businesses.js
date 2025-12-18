require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('./src/models/businessSchema');

async function checkBusinesses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    const businesses = await Business.find({}).select('name specialization address');
    
    console.log('📊 Businesses in database:\n');
    businesses.forEach((b, i) => {
      console.log(`${i+1}. ${b.name}`);
      console.log(`   Specialization: ${b.specialization}`);
      console.log(`   Address: ${b.address || 'N/A'}\n`);
    });
    
    console.log(`Total: ${businesses.length} businesses`);
    
    // Check for banking businesses
    const bankingBusinesses = businesses.filter(b => 
      b.specialization === 'Banking' || b.specialization === 'Finance'
    );
    console.log(`\n🏦 Banking/Finance businesses: ${bankingBusinesses.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkBusinesses();
