const mongoose = require('mongoose');
const Queue = require('../src/models/queueSchema');

const MONGODB_URI = 'mongodb://localhost:27017/queue-management';

const pauseQueue = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected');
    
    const result = await Queue.updateMany(
      { status: 'active' },
      { $set: { status: 'paused' } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} queues to paused`);
    
    const queues = await Queue.find().populate('businessId', 'name');
    queues.forEach(q => {
      console.log(`${q.businessId?.name || 'Unknown'}: ${q.status}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌', error.message);
    process.exit(1);
  }
};

pauseQueue();
