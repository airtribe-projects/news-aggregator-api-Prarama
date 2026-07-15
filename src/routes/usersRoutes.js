const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const authenticateToken = require("../middleware/auth");

// Auth routes
router.post("/signup", usersController.registerUser);
router.post("/login", usersController.loginUser);

// Preferences routes
router.get("/preferences", authenticateToken, usersController.getPreferences);
router.put("/preferences", authenticateToken, usersController.updatePreferences);

module.exports = router;
