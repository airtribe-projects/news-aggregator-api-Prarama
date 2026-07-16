const express = require("express");
const connectDB = require("./config/db");
const usersRoutes = require("./routes/usersRoutes");
const newsRoutes = require("./routes/newsRoutes"); // Imported the new news routes
require("dotenv").config({ quiet: true });

const app = express();

// Connect to MongoDB Instance
connectDB().catch(err => {
  console.error("Critical database connection failure:", err.message);
  if (process.env.NODE_ENV !== "test") {
    process.exit(1);
  }
});

// Global Request Parsers Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bind user endpoints (e.g., signup, login, preferences)
app.use("/", usersRoutes);

// Bind protected news feed endpoints
app.use("/", newsRoutes);

// Global Error Handling Middleware (Catches unexpected application exceptions gracefully)
app.use((err, req, res, next) => {
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || "An internal server error occurred.";

  // 1. Invalid Input / Validation errors
  if (
    err.name === "ValidationError" || 
    err.name === "ValidatorError" ||
    (err.name === "SyntaxError" && err.status === 400) ||
    err.message.toLowerCase().includes("validation") ||
    err.message.toLowerCase().includes("invalid input")
  ) {
    statusCode = 400;
  }

  // 2. Authentication / Authorization failures
  if (
    err.name === "UnauthorizedError" ||
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError" ||
    err.name === "NotBeforeError" ||
    err.message === "Access token missing" ||
    err.message === "Authentication token is missing or invalid." ||
    err.message.toLowerCase() === "invalid or expired token"
  ) {
    // Keep 403 if it was specifically set (e.g., forbidden/expired), else default to 401
    statusCode = (statusCode === 403) ? 403 : 401;
  }

  // 3. External news API failures
  if (
    err.isAxiosError || 
    err.message.toLowerCase().includes("downstream") ||
    err.message.toLowerCase().includes("gnews") ||
    err.message.toLowerCase().includes("news data")
  ) {
    statusCode = err.statusCode || err.response?.status || 502; // 502 Bad Gateway
  }

  // Only log unhandled server crashes or true server errors (5xx)
  if (statusCode >= 500) {
    console.error("Unhandled Server Error:", err.stack || err);
    // Sanitize user-facing message to avoid leaking internals (like database details)
    if (statusCode === 500) {
      message = "An internal server error occurred.";
    }
  }

  res.status(statusCode).json({
    message: message,
    error: process.env.NODE_ENV === "development" ? {
      message: err.message,
      stack: err.stack,
    } : {},
  });
});

module.exports = app;
