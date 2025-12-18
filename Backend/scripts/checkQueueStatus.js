const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Queue = require('../src/models/queueSchema');

dotenv.config({ path: '../.env' });

const checkAllQueues = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const queues = await Queue.find().populate('businessId', 'name');
    
    console.log(`Found ${queues.length} queues in database:\n`);
    
    queues.forEach(queue => {
      console.log(`Business: ${queue.businessId?.name || 'Unknown'}`);
      console.log(`  Queue ID: ${queue._id}`);
      console.log(`  Status: ${queue.status}`);
      console.log(`  Current Count: ${queue.currentCount}`);
      console.log(`  Max Capacity: ${queue.maxCapacity}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkAllQueues();
