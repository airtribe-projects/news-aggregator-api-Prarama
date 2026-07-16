const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authenticateToken = require('../middleware/auth'); // Path to JWT middleware

// Secure routing endpoint mapping
router.get('/news', authenticateToken, newsController.getNewsFeed);

// Optional Features: Mark as read/favorite and retrieve
router.post('/news/read', authenticateToken, newsController.markAsRead);
router.get('/news/read', authenticateToken, newsController.getReadArticles);
router.post('/news/favorites', authenticateToken, newsController.markAsFavorite);
router.get('/news/favorites', authenticateToken, newsController.getFavoriteArticles);

module.exports = router;