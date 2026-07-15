const User = require('../models/user');
const { fetchPersonalizedNews } = require('../services/newsService');

const getNewsFeed = async (req, res) => {
    try {
        // req.user.id is derived dynamically from your verified JWT middleware token layer
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: "User account profile not found." });
        }

        // Pass database preferences configuration straight to our GNews layer
        const articles = await fetchPersonalizedNews(user.preferences);

        return res.status(200).json({
            news: articles
        });
        
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getNewsFeed
};