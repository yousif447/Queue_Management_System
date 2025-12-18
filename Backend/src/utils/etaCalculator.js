/**
 * AI-based ETA Prediction Module
 * Documentation: Optional: AI-based ETA predictions
 * 
 * This module calculates estimated wait times using:
 * 1. Historical data analysis
 * 2. Current queue length
 * 3. Time-of-day patterns
 * 4. Day-of-week patterns
 * 5. Service type duration
 */

const Ticket = require("../models/ticketSchema");
const Queue = require("../models/queueSchema");
const mongoose = require("mongoose");

/**
 * Calculate ETA for a new ticket
 * @param {String} businessId - Business ID
 * @param {String} queueId - Queue ID
 * @param {String} serviceType - Type of service
 * @returns {Object} - ETA prediction with confidence
 */
const geminiService = require('./geminiService');

exports.calculateETA = async (businessId, queueId, serviceType = "examination") => {
  try {
    // 1. Get Queue Context
    const queue = await Queue.findById(queueId);
    if (!queue) return { estimatedMinutes: 15, confidence: "low", method: "default" };

    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    // 2. Fetch "Smart Data"
    const recentTickets = await Ticket.aggregate([
      {
        $match: {
          queueId: new mongoose.Types.ObjectId(queueId),
          status: { $in: ["ended", "done"] },
          completedAt: { $exists: true },
          calledAt: { $exists: true }
        }
      },
      { $sort: { completedAt: -1 } },
      { $limit: 20 },
      {
        $project: {
          duration: { $divide: [ { $subtract: ["$completedAt", "$calledAt"] }, 60000 ] },
          completedAt: 1
        }
      },
       { $match: { duration: { $gt: 0, $lt: 240 } } }
    ]);
    
    // Calculate waiting count (DB Source of Truth)
    const waitingCount = await Ticket.countDocuments({ 
        queueId: queueId, 
        status: 'waiting' 
    });

    // --- ATTEMPT GEMINI AI PREDICTION ---
    const recentDurations = recentTickets.map(t => Math.round(t.duration * 10) / 10).slice(0, 10); // Take last 10
    
    const geminiContext = {
        serviceType,
        waitingCount,
        recentDurations,
        hour: currentHour,
        dayOfWeek: currentDay
    };

    console.log("Asking Gemini for ETA...");
    const aiPrediction = await geminiService.predictQueueETA(geminiContext);

    if (aiPrediction && typeof aiPrediction.estimatedMinutes === 'number') {
        console.log("Gemini Prediction:", aiPrediction);
        
        let estimatedMinutes = aiPrediction.estimatedMinutes;
        // Safety bounds
        if (estimatedMinutes < 1) estimatedMinutes = 1;
        
        const expectedTime = new Date();
        expectedTime.setMinutes(expectedTime.getMinutes() + estimatedMinutes);

        return {
            estimatedMinutes,
            expectedTime,
            confidence: aiPrediction.confidence || "high",
            method: "Gemini-AI-2.0-Flash",
            reasoning: aiPrediction.reasoning,
            factors: {
                aiUsed: true,
                waitingCount
            }
        };
    }
    
    console.log("Gemini unavailable/failed, falling back to Hybrid Math Model");

    // --- FALLBACK: HYBRID MATH MODEL (Previous Implementation) ---
    // 3. Fetch "Pattern Data" - Historical Context
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const historicalPattern = await Ticket.aggregate([
       {
         $match: {
           businessId: new mongoose.Types.ObjectId(businessId),
           status: { $in: ["ended", "done"] },
           createdAt: { $gte: thirtyDaysAgo },
           completedAt: { $exists: true },
           calledAt: { $exists: true }
         }
       },
       {
          $project: {
             duration: { $divide: [ { $subtract: ["$completedAt", "$calledAt"] }, 60000 ] },
             hour: { $hour: "$createdAt" },
             day: { $dayOfWeek: "$createdAt" }
          }
       },
       { $match: { duration: { $gt: 0, $lt: 240 } } },
       {
          $match: {
             hour: { $gte: currentHour - 1, $lte: currentHour + 1 },
             day: (currentDay === 0 || currentDay === 6) ? { $in: [1, 7] } : { $nin: [1, 7] }
          }
       },
       {
          $group: {
             _id: null,
             avgDuration: { $avg: "$duration" },
             count: { $sum: 1 }
          }
       }
    ]);

    // Trend Analysis (Linear Regression)
    let shortTermPrediction = 15;
    let longTermPrediction = 15;
    let confidence = "low";
    
    if (recentTickets.length >= 3) {
       let n = recentTickets.length;
       let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
       const chronTickets = [...recentTickets].reverse();
       
       chronTickets.forEach((t, i) => {
          sumX += i;
          sumY += t.duration;
          sumXY += i * t.duration;
          sumXX += i * i;
       });
       
       const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
       const intercept = (sumY - slope * sumX) / n;
       shortTermPrediction = slope * n + intercept;
       if (shortTermPrediction < 2) shortTermPrediction = 2;
    } else {
       shortTermPrediction = recentTickets.length > 0 ? recentTickets.reduce((a,b)=>a+b.duration,0)/recentTickets.length : 15;
    }

    if (historicalPattern.length > 0) {
       longTermPrediction = historicalPattern[0].avgDuration;
    } else {
       longTermPrediction = shortTermPrediction;
    }

    const recentVariance = recentTickets.length > 1 ? 
        recentTickets.reduce((acc, val) => acc + Math.pow(val.duration - shortTermPrediction, 2), 0) / recentTickets.length : 100;
    
    let wShort = 0.6;
    let wLong = 0.4;
    
    if (recentVariance > 50) {
       wShort = 0.3;
       wLong = 0.7;
       confidence = "low (volatile)";
    } else {
       confidence = "high";
    }

    let predictedServiceTime = (shortTermPrediction * wShort) + (longTermPrediction * wLong);
    const serviceMultipliers = { examination: 1.0, consultation: 1.5, procedure: 2.0, followup: 0.7 };
    const multiplier = serviceMultipliers[serviceType] || 1.0;
    const adjustedServiceTime = predictedServiceTime * multiplier;
    
    const estimatedMinutes = Math.round(waitingCount * adjustedServiceTime) || Math.round(adjustedServiceTime);

     // Calculate expected time
    const expectedTime = new Date();
    expectedTime.setMinutes(expectedTime.getMinutes() + estimatedMinutes);

    return {
      estimatedMinutes,
      expectedTime,
      confidence,
      method: `Hybrid-Math (Fallback)`,
      factors: {
        baseServiceTime: Math.round(predictedServiceTime),
        waitingCount,
        trend: shortTermPrediction, 
        history: longTermPrediction
      },
    };

  } catch (error) {
    console.error("ETA calculation error:", error);
    return {
      estimatedMinutes: 15,
      confidence: "low",
      method: "fallback_error",
      error: error.message,
    };
  }
};

/**
 * Update ETA for all waiting tickets in a queue
 * @param {String} queueId - Queue ID
 */
exports.updateQueueETAs = async (queueId) => {
  try {
    const queue = await Queue.findById(queueId).populate("businessId");
    if (!queue) return;

    const waitingTickets = await Ticket.find({
      queueId,
      status: "waiting",
    }).sort({ ticketNumber: 1 });

    // Calculate ETA for first ticket
    const baseETA = await exports.calculateETA(
      queue.businessId._id || queue.businessId,
      queueId
    );

    // Update each ticket with cumulative ETA
    for (let i = 0; i < waitingTickets.length; i++) {
      const ticket = waitingTickets[i];
      
      // Calculate adjusted ETA for this specific position
      // We use the AI-predicted baseETA and multiply by position
      // Note: baseETA.estimatedMinutes is for the WHOLE waiting count.
      // So average per person = baseETA.estimatedMinutes / waitingTickets.length
      
      const avgPerPerson = baseETA.estimatedMinutes / (waitingTickets.length || 1);
      const positionETA = Math.round((i + 1) * avgPerPerson);

      const newExpectedTime = new Date();
      newExpectedTime.setMinutes(newExpectedTime.getMinutes() + positionETA);

      await Ticket.findByIdAndUpdate(ticket._id, {
        estimatedTime: positionETA,
        expectedServiceTime: newExpectedTime
      });
    }

    return waitingTickets.length;
  } catch (error) {
    console.error("Update queue ETAs error:", error);
  }
};

/**
 * Get estimated wait time for a specific position in queue
 * @param {String} queueId - Queue ID
 * @param {Number} position - Position in queue
 */
exports.getPositionETA = async (queueId, position) => {
  try {
    const queue = await Queue.findById(queueId);
    if (!queue) return null;

    const baseETA = await exports.calculateETA(queue.businessId, queueId);
    const estimatedMinutes = Math.round(position * (baseETA.estimatedMinutes / Math.max(queue.currentCount, 1)));

    const expectedTime = new Date();
    expectedTime.setMinutes(expectedTime.getMinutes() + estimatedMinutes);

    return {
      position,
      estimatedMinutes,
      expectedTime,
      confidence: baseETA.confidence,
    };
  } catch (error) {
    console.error("Get position ETA error:", error);
    return null;
  }
};
