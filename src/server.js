const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const app = express();

// Simple test route for debugging
app.get("/test", (req, res) => {
  res.send("Test route is working!");
});

// Basic middleware
app.use(express.json());
app.use(cors());

// Configure Helmet with more permissive settings for development
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
  })
);

app.use(morgan("dev"));

// Rate limiting - exclude Swagger UI from rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.path.startsWith("/api-docs"),
});
app.use(limiter);

// Swagger documentation - moved before other routes
const swaggerDocument = require("./config/swagger.json");
app.use("/api-docs", swaggerUi.serve);
app.get(
  "/api-docs",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  },
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Fitness Tracker API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: "list",
      tryItOutEnabled: true,
    },
  })
);

// API Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/exercises", require("./routes/exercise.routes"));
app.use("/api/workouts", require("./routes/workout.routes"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    status: err.status || 500,
  });
});

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/fitness-tracker"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server is running on port 5050`);
  console.log("API Documentation available at http://localhost:5050/api-docs");
});
