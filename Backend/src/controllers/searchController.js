const Business = require("../models/businessSchema");
const Review = require("../models/reviewSchema"); // Import Review model
const Queue = require("../models/queueSchema"); // Import Queue model
const {
  generateQueryEmbedding,
  findSimilar,
} = require("../utils/embeddingService");

// Helper function to attach ratings and queue status to businesses
const attachRatings = async (businesses) => {
  const { checkBookingLimit } = require("../utils/subscriptionLimits");
  
  return await Promise.all(
    businesses.map(async (business) => {
      // If lean() was used, business is a plain object. If not, it's a document.
      const businessObj = business.toObject ? business.toObject() : { ...business };
      
      const stats = await Review.aggregate([
        { $match: { businessId: business._id } },
        {
          $group: {
            _id: "$businessId",
            count: { $sum: 1 },
            avg: { $avg: "$rating" },
          },
        },
      ]);

      if (stats.length > 0) {
        businessObj.rating = stats[0].avg;
        businessObj.reviewCount = stats[0].count;
        
        // Optionally update the DB in background so next time it's fast
        Business.findByIdAndUpdate(business._id, {
          rating: stats[0].avg,
          reviewCount: stats[0].count
        }).catch(err => console.error('Background rating update failed', err));
      } else {
        businessObj.rating = businessObj.rating || 0;
        businessObj.reviewCount = businessObj.reviewCount || 0;
      }

      // Attach Queue Status - Get today's queue for this business
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const queue = await Queue.findOne({ 
        businessId: business._id,
        createdAt: { $gte: today, $lt: tomorrow }
      })
        .select('status currentCount maxCapacity')
        .sort({ createdAt: -1 });
      
      if (queue) {
        businessObj.queueStatus = queue.status;
        businessObj.isQueueFull = queue.maxCapacity && queue.currentCount >= queue.maxCapacity;
      } else {
        // If no queue found, assume inactive
        businessObj.queueStatus = 'inactive'; 
      }

      // Calculate isOpen logic (Manual calculation for aggregation results)
      let isOpenByTime = false;
      if (businessObj.workingHours && businessObj.workingHours.length > 0) {
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

        const todaySchedule = businessObj.workingHours.find(schedule => schedule.days === currentDay);
        
        if (todaySchedule && !todaySchedule.isClosed && todaySchedule.openTime && todaySchedule.closeTime) {
           // Handle overnight shifts (e.g. 23:00 - 09:00)
           if (todaySchedule.closeTime < todaySchedule.openTime) {
             isOpenByTime = currentTime >= todaySchedule.openTime || currentTime <= todaySchedule.closeTime;
           } else {
             isOpenByTime = currentTime >= todaySchedule.openTime && currentTime <= todaySchedule.closeTime;
           }
        }
      }

      // If businessObj already has isOpen (from virtual), respect it, otherwise use calculation
      if (typeof businessObj.isOpen === 'undefined') {
          businessObj.isOpen = isOpenByTime;
      }
      
      // Force open if queue is active
      if (businessObj.queueStatus === 'active') {
          businessObj.isOpen = true;
      }
      
      // Check subscription booking limit
      try {
        const limitCheck = await checkBookingLimit(businessObj);
        businessObj.isFullyBooked = !limitCheck.allowed;
      } catch (err) {
        businessObj.isFullyBooked = false;
      }
      
      return businessObj;
    })
  );
};

// -------------------------
// GET /api/v1/search
// Global search (businesses, services)
// -------------------------
exports.globalSearch = async (req, res) => {
  try {
    const { q, type, location, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(q, "i");

    let query = {
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { "services.name": searchRegex },
        { category: searchRegex },
      ],
    };

    if (type) query.businessType = type;
    if (location) {
      query.$or.push({ "address.city": new RegExp(location, "i") });
      query.$or.push({ "address.state": new RegExp(location, "i") });
    }

    const [businessesFound, total] = await Promise.all([
      Business.find(query).skip(skip).limit(Number(limit)).select("-__v"),
      Business.countDocuments(query),
    ]);
    
    // Attach accurate ratings
    const businesses = await attachRatings(businessesFound);

    res.status(200).json({
      success: true,
      data: {
        results: businesses,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({
      success: false,
      message: "Error performing search",
    });
  }
};

// -------------------------
// GET /api/v1/search/businesses
// Search businesses
// -------------------------
exports.searchBusinesses = async (req, res) => {
  try {
    const {
      q,
      businessType,
      category,
      location,
      rating,
      priceRange,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Text search
    if (q) {
      const searchRegex = new RegExp(q, "i");
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { specialization: searchRegex },
        { address: searchRegex },
        { "service.name": searchRegex },
        { "service.description": searchRegex },
      ];
    }

    // Filters
    if (businessType) query.businessType = businessType;
    if (category) query.category = new RegExp(category, "i");
    if (location) {
      query.$or = query.$or || [];
      query.$or.push(
        { "address.city": new RegExp(location, "i") },
        { "address.state": new RegExp(location, "i") }
      );
    }
    if (rating) query.rating = { $gte: Number(rating) };
    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      query.priceRange = { $gte: min, $lte: max };
    }

    const [businessesFound, total] = await Promise.all([
      Business.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ rating: -1, name: 1 })
        .select("-__v"),
      Business.countDocuments(query),
    ]);

    // Attach accurate ratings
    const businesses = await attachRatings(businessesFound);

    res.status(200).json({
      success: true,
      data: {
        businesses,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Search businesses error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching businesses",
    });
  }
};

// -------------------------
// GET /api/v1/search/businesses/:id
// Get single business by ID
// -------------------------
exports.getBusinessById = async (req, res) => {
  try {
    const { id } = req.params;

    const business = await Business.findById(id).select("-__v -password");

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }

    res.status(200).json({
      success: true,
      data: business,
    });
  } catch (error) {
    console.error("Get business by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching business",
    });
  }
};

// -------------------------
// GET /api/v1/search/services
// Search services across businesses
// -------------------------
exports.searchServices = async (req, res) => {
  try {
    const { q, category, priceRange, location, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(q, "i");
    const query = {
      "services.name": searchRegex,
    };

    if (category) query["services.category"] = new RegExp(category, "i");
    if (location) {
      query.$or = [
        { "address.city": new RegExp(location, "i") },
        { "address.state": new RegExp(location, "i") },
      ];
    }
    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      query["services.price"] = { $gte: min, $lte: max };
    }

    const businesses = await Business.find(query)
      .skip(skip)
      .limit(Number(limit))
      .select("name address services rating")
      .lean();

    // Filter services that match the search
    const results = businesses.flatMap((business) =>
      business.services
        .filter((service) => searchRegex.test(service.name))
        .map((service) => ({
          service,
          business: {
            id: business._id,
            name: business.name,
            address: business.address,
            rating: business.rating,
          },
        }))
    );

    const total = results.length;

    res.status(200).json({
      success: true,
      data: {
        services: results.slice(0, limit),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Search services error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching services",
    });
  }
};

// -------------------------
// GET /api/v1/search/suggestions
// Get search suggestions (autocomplete)
// -------------------------
exports.getSuggestions = async (req, res) => {
  try {
    const { q, type = "business" } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: { suggestions: [] },
      });
    }

    const searchRegex = new RegExp(`^${q}`, "i");
    let suggestions = [];

    if (type === "business" || type === "all") {
      const businesses = await Business.find({ name: searchRegex })
        .limit(5)
        .select("name businessType");

      suggestions = suggestions.concat(
        businesses.map((b) => ({
          text: b.name,
          type: "business",
          id: b._id,
        }))
      );
    }

    if (type === "service" || type === "all") {
      const businesses = await Business.find({
        "services.name": searchRegex,
      })
        .limit(5)
        .select("services.name");

      const serviceNames = new Set();
      businesses.forEach((b) => {
        b.services.forEach((s) => {
          if (searchRegex.test(s.name)) {
            serviceNames.add(s.name);
          }
        });
      });

      suggestions = suggestions.concat(
        Array.from(serviceNames).map((name) => ({
          text: name,
          type: "service",
        }))
      );
    }

    res.status(200).json({
      success: true,
      data: { suggestions: suggestions.slice(0, 10) },
    });
  } catch (error) {
    console.error("Get suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching suggestions",
    });
  }
};

// -------------------------
// GET /api/v1/filter/businesses
// Advanced business filtering
// -------------------------
exports.filterBusinesses = async (req, res) => {
  try {
    const {
      location,
      rating,
      priceRange,
      features,
      openNow,
      businessType,
      category,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // Location filter
    if (location) {
      query.$or = [
        { "address.city": new RegExp(location, "i") },
        { "address.state": new RegExp(location, "i") },
        { "address.country": new RegExp(location, "i") },
      ];
    }

    // Rating filter
    if (rating) query.rating = { $gte: Number(rating) };

    // Price range filter
    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      query.priceRange = { $gte: min, $lte: max };
    }

    // Features filter
    if (features) {
      const featureArray = features.split(",");
      query.features = { $all: featureArray };
    }

    // Business type filter
    if (businessType) query.businessType = businessType;

    // Category filter
    if (category) query.category = new RegExp(category, "i");

    // Open now filter
    if (openNow === "true") {
      const now = new Date();
      const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "lowercase" });
      const currentTime = now.toTimeString().slice(0, 5);

      query[`workingHours.${dayOfWeek}.isOpen`] = true;
      query[`workingHours.${dayOfWeek}.from`] = { $lte: currentTime };
      query[`workingHours.${dayOfWeek}.to`] = { $gte: currentTime };
    }

    const [businesses, total] = await Promise.all([
      Business.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ rating: -1, name: 1 })
        .select("-__v"),
      Business.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        businesses,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
        filters: {
          location,
          rating,
          priceRange,
          features,
          openNow,
          businessType,
          category,
        },
      },
    });
  } catch (error) {
    console.error("Filter businesses error:", error);
    res.status(500).json({
      success: false,
      message: "Error filtering businesses",
    });
  }
};

// -------------------------
// GET /api/v1/search/semantic
// Semantic search using Cohere AI embeddings
// -------------------------
exports.semanticSearchBusinesses = async (req, res) => {
  try {
    const {
      q,
      location,
      rating,
      priceRange,
      businessType,
      category,
      specialization,
      page = 1,
      limit = 10,
      minSimilarity = 0.35, // Minimum similarity threshold for relevance (lowered for better recall)
    } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // 1. Generate embedding for search query using Cohere (optimized for queries)
    const queryEmbedding = await generateQueryEmbedding(q.trim());

    if (!queryEmbedding) {
      console.warn("Embedding generation failed, falling back to keyword search");
      return exports.searchBusinesses(req, res);
    }

    // 2. Build filter query for pre-filtering
    const filterQuery = { status: 'active' };

    if (businessType) filterQuery.businessType = businessType;
    if (category) filterQuery.category = new RegExp(category, "i");
    if (specialization) filterQuery.specialization = specialization;
    if (rating) filterQuery.rating = { $gte: Number(rating) };
    if (location) {
      filterQuery.$or = [
        { address: new RegExp(location, "i") },
      ];
    }

    // 3. Fetch businesses with embeddings (filter businesses without embeddings)
    const businesses = await Business.find({
      ...filterQuery,
      combinedEmbedding: { $exists: true, $ne: null },
    })
      .select("-password -refreshTokens -passwordResetToken")
      .lean();

    if (!businesses || businesses.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          businesses: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            pages: 0,
          },
          searchType: "semantic_cohere",
          message: "No businesses found with the given filters",
        },
      });
    }

    // 4. Calculate similarity scores using in-memory search
    let similarBusinesses = findSimilar(
      queryEmbedding,
      businesses,
      businesses.length, // Get all, we'll paginate after
      Number(minSimilarity) // Minimum similarity threshold
    );

    // 5. Hybrid Search Fallback: If semantic search returns few results, add keyword matches
    if (similarBusinesses.length < Number(limit)) {
      console.log(`Semantic search returned ${similarBusinesses.length} results, adding keyword matches...`);
      
      const semanticIds = new Set(similarBusinesses.map(r => r.business._id.toString()));
      const searchRegex = new RegExp(q.trim(), "i");
      
      // Find keyword matches not already in semantic results
      const keywordMatches = businesses
        .filter(business => {
          const inSemanticResults = semanticIds.has(business._id.toString());
          const matchesKeyword = 
            searchRegex.test(business.name) ||
            searchRegex.test(business.specialization) ||
            searchRegex.test(business.address) ||
            (business.service && business.service.some(s => searchRegex.test(s.name)));
          
          return !inSemanticResults && matchesKeyword;
        })
        .map(business => ({
          business,
          similarity: 0.3, // Lower score for keyword matches
        }));
      
      // Combine semantic and keyword results
      similarBusinesses = [...similarBusinesses, ...keywordMatches]
        .sort((a, b) => b.similarity - a.similarity);
    }

    // 6. Pagination
    const skip = (page - 1) * limit;
    const total = similarBusinesses.length;
    const paginatedResults = similarBusinesses.slice(skip, skip + Number(limit));

    // 7. Extract business objects and attach metadata
    const businessResults = paginatedResults.map((result) => ({
      ...result.business,
      relevanceScore: result.similarity,
    }));

    // 8. Attach ratings, queue status, and other dynamic fields
    const enrichedBusinesses = await attachRatings(businessResults);

    res.status(200).json({
      success: true,
      data: {
        businesses: enrichedBusinesses,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: total,
          pages: Math.ceil(total / limit),
        },
        searchType: similarBusinesses.length > paginatedResults.length ? "hybrid_semantic_keyword" : "semantic_cohere",
        query: q,
      },
    });
  } catch (error) {
    console.error("Semantic search error:", error);
    
    // Fallback to keyword search on error
    console.warn("Falling back to keyword search due to error");
    return exports.searchBusinesses(req, res);
  }
};

