const mongoose = require('mongoose');
const Queue = require('../src/models/queueSchema');

const MONGODB_URI = 'mongodb://localhost:27017/queue-management';
const QUEUE_ID = '6933b64dec75c2cd78e12e28'; // Hussien Khaled's queue ID

const pauseQueue = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const queue = await Queue.findByIdAndUpdate(
      QUEUE_ID,
      { status: 'paused' },
      { new: true }
    );
    
    if (queue) {
      console.log('✅ Queue updated successfully!');
      console.log(`   Queue ID: ${queue._id}`);
      console.log(`   Status: ${queue.status}`);
      console.log('\n🎉 Now refresh your home page - Hussien Khaled should show "Busy"');
    } else {
      console.log('❌ Queue not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

pauseQueue();
