const User = require('../models/user');
const { fetchPersonalizedNews } = require('../services/newsService');

const getNewsFeed = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            const err = new Error("Authentication token is missing or invalid.");
            err.statusCode = 401;
            throw err;
        }

        // req.user.id is derived dynamically from your verified JWT middleware token layer
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User account profile not found." });
        }

        // Validate preference shape and presence
        const categories = user.preferences?.categories;
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            const err = new Error("Unusable or missing preferences. Please configure at least one category preference.");
            err.statusCode = 400;
            throw err;
        }

        // Validate that all elements are strings
        if (categories.some(pref => typeof pref !== 'string' || !pref.trim())) {
            const err = new Error("Unusable preferences. Preference items must be valid strings.");
            err.statusCode = 400;
            throw err;
        }

        // Pass database preferences configuration straight to our GNews layer
        const articles = await fetchPersonalizedNews(user.preferences);

        return res.status(200).json({
            news: articles
        });

    } catch (error) {
        next(error);
    }
};
const markAsRead = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            const err = new Error("Authentication token is missing or invalid.");
            err.statusCode = 401;
            throw err;
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User account profile not found." });
        }

        const { title, url, description, source, publishedAt, image } = req.body;
        if (!url) {
            const err = new Error("Article URL is required to mark as read.");
            err.statusCode = 400;
            throw err;
        }

        // Avoid duplicate entries
        if (!user.readArticles.some(art => art.url === url)) {
            user.readArticles.push({ title, url, description, source, publishedAt, image });
            await user.save();
        }

        return res.status(200).json({
            message: "Article marked as read successfully.",
            readArticles: user.readArticles
        });
    } catch (error) {
        next(error);
    }
};

const getReadArticles = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            const err = new Error("Authentication token is missing or invalid.");
            err.statusCode = 401;
            throw err;
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User account profile not found." });
        }
        return res.status(200).json({
            read: user.readArticles || []
        });
    } catch (error) {
        next(error);
    }
};

const markAsFavorite = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            const err = new Error("Authentication token is missing or invalid.");
            err.statusCode = 401;
            throw err;
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User account profile not found." });
        }

        const { title, url, description, source, publishedAt, image } = req.body;
        if (!url) {
            const err = new Error("Article URL is required to add to favorites.");
            err.statusCode = 400;
            throw err;
        }

        // Avoid duplicate entries
        if (!user.favoriteArticles.some(art => art.url === url)) {
            user.favoriteArticles.push({ title, url, description, source, publishedAt, image });
            await user.save();
        }

        return res.status(200).json({
            message: "Article added to favorites successfully.",
            favoriteArticles: user.favoriteArticles
        });
    } catch (error) {
        next(error);
    }
};

const getFavoriteArticles = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            const err = new Error("Authentication token is missing or invalid.");
            err.statusCode = 401;
            throw err;
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User account profile not found." });
        }
        return res.status(200).json({
            favorites: user.favoriteArticles || []
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNewsFeed,
    markAsRead,
    getReadArticles,
    markAsFavorite,
    getFavoriteArticles
};