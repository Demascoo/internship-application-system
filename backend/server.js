const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const fs = require("fs");
require("dotenv").config();

// Import database connection and socket configuration
const connectDB = require("./config/database");
const initializeSocket = require("./config/socket");
const seedData = require("./utils/seedData");

// Import routes
const authRoutes = require("./routes/auth");
const programRoutes = require("./routes/programs");
const applicationRoutes = require("./routes/applications");
const notificationRoutes = require("./routes/notifications");
const acceptancePaperRoutes = require("./routes/acceptancePapers");
const groupRoutes = require("./routes/groups");
const loginActivityRoutes = require("./routes/loginActivities");
const { activityLogger } = require("./middleware/activityLogger");
const adviserRoutes = require("./routes/advisers");
const accountManagementRoutes = require("./routes/accountManagement");
const facultyHeadRoutes = require("./routes/facultyHead");
const progressRoutes = require("./routes/progress");
const finalEvaluationRoutes = require("./routes/finalEvaluation");

const universityRoutes = require("./routes/university");

// Initialize Express app
const app = express();
const server = http.createServer(app);

// CORS configuration - moved to the top
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  process.env.FRONTEND_URL,
].filter(Boolean); // Remove any undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

// Apply CORS middleware first
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "ws:", "wss:", ...allowedOrigins],
      },
    },
  })
);

// Initialize Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store io instance in app for use in controllers
app.set("io", io);

// Initialize socket handlers
initializeSocket(io);

// Connect to database
connectDB();

// Create upload directories if they don't exist
const uploadDirs = ["uploads", "uploads/acceptance-papers", "uploads/final-evaluations"];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

app.use("/api/auth", authLimiter);
app.use("/api/", generalLimiter);

// Serve static files with proper CORS headers
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, path) => {
      res.setHeader("Access-Control-Allow-Origin", allowedOrigins.join(", "));
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

      if (path.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
      }
      if (path.endsWith(".doc")) {
        res.setHeader("Content-Type", "application/msword");
      }
      if (path.endsWith(".docx")) {
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
      }
    },
  })
);
// Serve adviser documents and message attachments
app.use(
  "/uploads/adviser-docs",
  express.static(path.join(__dirname, "uploads/adviser-docs"))
);

// API Routes
// Global activity logger (after common middleware, before routes)
app.use(activityLogger);
app.use("/api/auth", authRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/acceptance-papers", acceptancePaperRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/login-activities", loginActivityRoutes);
app.use("/api/advisers", adviserRoutes);
app.use("/api/account-management", accountManagementRoutes);
app.use("/api/faculty-heads", facultyHeadRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/final-evaluation", finalEvaluationRoutes);

app.use("/api/universities", universityRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Error handling middleware (unchanged)
app.use((err, req, res, next) => {
  console.error("Error:", err);
  // ... (keep your existing error handling code)
});

// Handle 404 errors
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(
    `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
  );
  console.log(`🔗 Allowed Origins: ${allowedOrigins.join(", ")}`);
  await seedData();
});

// Process handlers (unchanged)
process.on("unhandledRejection", (err, promise) => {
  console.error("❌ Unhandled Promise Rejection:", err.message);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully...");
  server.close(() => console.log("💤 Process terminated"));
});
