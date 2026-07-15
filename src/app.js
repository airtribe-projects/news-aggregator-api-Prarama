const express = require("express");
const connectDB = require("./config/db");
const usersRoutes = require("./routes/usersRoutes");
const newsRoutes = require("./routes/newsRoutes"); // Imported the new news routes
require("dotenv").config({ quiet: true });

const app = express();

// Connect to MongoDB Instance
connectDB();

// Global Request Parsers Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bind user endpoints (e.g., signup, login, preferences)
app.use("/users", usersRoutes);

// Bind protected news feed endpoints
app.use("/", newsRoutes);

// Global Error Handling Middleware (Catches unexpected application exceptions gracefully)
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err.stack);
  res.status(500).json({
    message: "An internal server error occurred.",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

module.exports = app;
