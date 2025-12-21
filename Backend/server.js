require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const passport = require("passport");
const connectDB = require("./src/config/db");
const passportConfig = require("./src/config/passport"); // make sure your GoogleStrategy is session: false
const socketHandler = require("./src/sockets/socketHandler");
const cookieParser = require("cookie-parser");

// -----------------------------
// ROUTES
// -----------------------------
const authRoutes = require("./src/routes/authRoutes");
const queueRoutes = require("./src/routes/queueRoutes");
const ticketRoutes = require("./src/routes/ticketRoutes");
const reviewRoutes = require("./src/routes/reviewRoutes");
const userRoutes = require("./src/routes/userRouter");
const adminRoutes = require("./src/routes/adminRoutes");
const businessRoutes = require("./src/routes/businessRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const notificationsRouter = require("./src/routes/notificationsRouter");
const paymentRoutes = require("./src/routes/paymentRoutes");
const searchRoutes = require("./src/routes/searchRoutes");
const statsRoutes = require("./src/routes/statsRoutes");
const subscriptionRoutes = require("./src/routes/subscriptionRoutes");
const migrationRoutes = require("./src/routes/migrationRoutes");

const app = express();

// -----------------------------
// MIDDLEWARES
// -----------------------------
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// CORS - Allow frontend origins
// CORS - Allow frontend origins
const getNormalizedOrigins = () => {
  const origins = [
    'https://queue-management-system-beta.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000', // Allow backend self-calls
  ];
  
  if (process.env.FRONTEND_URL) {
    // Split by comma in case multiple URLs are provided
    const envOrigins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    origins.push(...envOrigins);
  }
  
  // Normalize: Remove trailing slashes and falsy values
  return origins
    .filter(Boolean)
    .map(url => url.replace(/\/$/, ""));
};

const allowedOrigins = getNormalizedOrigins();
console.log('✅ Allowed CORS Origins:', allowedOrigins);

app.use(
  cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      const normalizedOrigin = origin.replace(/\/$/, "");
      
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      
      console.warn(`⚠️  Blocked by CORS: ${origin}`);
      return callback(new Error(`Not allowed by CORS: ${origin}`), false);
    },
    credentials: true,
  }),
);

// -----------------------------
// PASSPORT
// -----------------------------
app.use(passport.initialize());
// Note: No app.use(passport.session()) needed for JWT stateless auth

// Connect to database
connectDB();

// -----------------------------
// SOCKET.IO
// -----------------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize your socket handler
const socketIO = socketHandler(io);
app.set("socketIO", socketIO);

// Initialize notification service with socketIO
const notificationService = require("./src/utils/notificationService");
notificationService.init(socketIO);

// Optional: JWT auth for Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next();
  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    console.error("Socket auth failed:", err.message);
    next();
  }
});

// -----------------------------
// ROUTES
// -----------------------------
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/businesses", businessRoutes);
app.use("/api/v1/queues", queueRoutes);
app.use("/api/v1/tickets", ticketRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/notifications", notificationsRouter);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/stats", statsRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/analytics", require('./src/routes/analyticsRoutes'));
app.use("/api/v1/migrate", migrationRoutes);

// -----------------------------
// START SERVER
// -----------------------------
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`🚀 Server running on --> http://localhost:${port}`);
  console.log(`📡 Socket.IO enabled for real-time updates`);
  console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'NOT SET (cookies will use sameSite:lax)'}`);
  console.log(`🌐 FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET (CORS may fail)'}`);
});
