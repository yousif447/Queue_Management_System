const Ticket = require('../models/ticketSchema');
const Payment = require('../models/paymentSchema');
const Business = require('../models/businessSchema');

// -------------------------
// GET /api/v1/analytics/revenue
// Get revenue analytics (Enterprise only)
// -------------------------
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const businessId = req.user.id;
    const { period = '30' } = req.query; // days

    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get all payments for this business
    const payments = await Payment.find({
      businessId,
      status: 'completed',
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    // Calculate total revenue
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Revenue by payment method
    const revenueByMethod = payments.reduce((acc, p) => {
      const method = p.paymentMethod || 'cash';
      acc[method] = (acc[method] || 0) + (p.amount || 0);
      return acc;
    }, {});

    // Revenue by day
    const revenueByDay = {};
    payments.forEach(p => {
      const day = p.createdAt.toISOString().split('T')[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + (p.amount || 0);
    });

    // Convert to array for charts
    const dailyRevenue = Object.entries(revenueByDay).map(([date, amount]) => ({
      date,
      amount
    }));

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        revenueByMethod,
        dailyRevenue,
        period: daysAgo
      }
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue analytics',
      error: error.message
    });
  }
};

// -------------------------
// GET /api/v1/analytics/bookings
// Get booking trends (Enterprise only)
// -------------------------
exports.getBookingAnalytics = async (req, res) => {
  try {
    const businessId = req.user.id;
    const { period = '30' } = req.query;

    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get all tickets for this business
    const tickets = await Ticket.find({
      businessId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    // Total bookings
    const totalBookings = tickets.length;

    // Bookings by status
    const bookingsByStatus = tickets.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    // Bookings by day
    const bookingsByDay = {};
    tickets.forEach(t => {
      const day = t.createdAt.toISOString().split('T')[0];
      bookingsByDay[day] = (bookingsByDay[day] || 0) + 1;
    });

    const dailyBookings = Object.entries(bookingsByDay).map(([date, count]) => ({
      date,
      count
    }));

    // Bookings by hour (peak hours)
    const bookingsByHour = tickets.reduce((acc, t) => {
      const hour = t.createdAt.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const peakHours = Object.entries(bookingsByHour)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        bookingsByStatus,
        dailyBookings,
        peakHours,
        period: daysAgo
      }
    });
  } catch (error) {
    console.error('Booking analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking analytics',
      error: error.message
    });
  }
};

// -------------------------
// GET /api/v1/analytics/customers
// Get customer insights (Enterprise only)
// -------------------------
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const businessId = req.user.id;

    // Get all tickets to analyze customers
    const tickets = await Ticket.find({ businessId });

    // Unique customers (by userId or guestEmail)
    const customerMap = new Map();
    tickets.forEach(t => {
      const customerId = t.userId?.toString() || t.guestPhone || t.guestEmail || 'unknown';
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          id: customerId,
          bookings: 0,
          totalSpent: 0,
          firstVisit: t.createdAt,
          lastVisit: t.createdAt
        });
      }
      const customer = customerMap.get(customerId);
      customer.bookings += 1;
      if (t.paymentStatus === 'paid') {
        customer.totalSpent += t.price || 0;
      }
      if (t.createdAt < customer.firstVisit) customer.firstVisit = t.createdAt;
      if (t.createdAt > customer.lastVisit) customer.lastVisit = t.createdAt;
    });

    const customers = Array.from(customerMap.values());
    const totalCustomers = customers.length;

    // New customers this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const newCustomersThisMonth = customers.filter(c => c.firstVisit >= thisMonth).length;

    // Repeat customers (more than 1 booking)
    const repeatCustomers = customers.filter(c => c.bookings > 1).length;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers * 100).toFixed(1) : 0;

    // Average bookings per customer
    const avgBookingsPerCustomer = totalCustomers > 0 
      ? (tickets.length / totalCustomers).toFixed(1) 
      : 0;

    // Average customer lifetime value
    const avgLifetimeValue = totalCustomers > 0
      ? (customers.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers).toFixed(2)
      : 0;

    // Top customers
    const topCustomers = customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(c => ({
        id: c.id,
        bookings: c.bookings,
        totalSpent: c.totalSpent,
        lastVisit: c.lastVisit
      }));

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        newCustomersThisMonth,
        repeatCustomers,
        repeatRate: parseFloat(repeatRate),
        avgBookingsPerCustomer: parseFloat(avgBookingsPerCustomer),
        avgLifetimeValue: parseFloat(avgLifetimeValue),
        topCustomers
      }
    });
  } catch (error) {
    console.error('Customer analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer analytics',
      error: error.message
    });
  }
};


