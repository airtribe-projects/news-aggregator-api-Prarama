const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authenticateToken = require('../middleware/auth'); // Path to JWT middleware

// Secure routing endpoint mapping
router.get('/news', authenticateToken, newsController.getNewsFeed);

module.exports = router;