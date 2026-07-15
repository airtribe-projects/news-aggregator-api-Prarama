const axios = require('axios');

/**
 * Fetches real-time personalized news metrics based on user preferences using GNews.io
 * @param {Object} preferences - Embedded user preferences document from MongoDB
 * @returns {Promise<Array>} Normalized array of matching articles
 */
const fetchPersonalizedNews = async (preferences) => {
    try {
        const apiToken = process.env.GNEWS_API_TOKEN;
        const baseURL = 'https://gnews.io/api/v4/search';

        let categoryList = ['general'];
        let language = 'en';

        if (Array.isArray(preferences)) {
            if (preferences.length > 0) {
                categoryList = preferences;
            }
        } else if (preferences && typeof preferences === 'object') {
            if (preferences.categories && preferences.categories.length > 0) {
                categoryList = preferences.categories;
            }
            if (preferences.languages && preferences.languages.length > 0) {
                language = preferences.languages[0];
            }
        }
        
        const queryString = categoryList.map(cat => `"${cat.trim()}"`).join(' OR ');

        // 3. Assemble parameters according to GNews.io query specifications
        const queryParams = {
            q: queryString,
            lang: language,
            max: 10, // Default return window (max allowed on free tier is 10)
            sortby: 'publishedAt', // Ensure latest news sorting order
            apikey: apiToken
        };

        // 4. Fire the network request downstream
        const response = await axios.get(baseURL, { params: queryParams });

        // 5. Structure fields cleanly to match user models and test utilities
        if (response.data && response.data.articles) {
            return response.data.articles.map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source ? article.source.name : 'GNews Provider',
                publishedAt: article.publishedAt,
                image: article.image || null
            }));
        }

        return [];
    } catch (error) {
        // Log clean telemetry details for debugging
        console.error('❌ GNews API Exception:', error.response?.data?.errors || error.message);
        throw new Error('Downstream news data retrieval failure.');
    }
};

module.exports = {
    fetchPersonalizedNews
};