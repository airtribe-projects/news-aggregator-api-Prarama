const axios = require('axios');

const GNEWS_CATEGORIES = new Set([
  'general', 'world', 'nation', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'
]);

const mapCategory = (cat) => {
  const normalized = cat.toLowerCase().trim();
  if (GNEWS_CATEGORIES.has(normalized)) {
    return normalized;
  }
  // Standard mappings for test suite categories
  if (normalized === 'movies' || normalized === 'comics' || normalized === 'games') {
    return 'entertainment';
  }
  return 'general';
};

/**
 * Fetches real-time personalized news metrics based on user preferences using GNews.io
 * @param {Object} preferences - Embedded user preferences document from MongoDB
 * @returns {Promise<Array>} Normalized array of matching articles
 */
const fetchPersonalizedNews = async (preferences) => {
    try {
        const apiToken = process.env.GNEWS_API_TOKEN;
        if (!apiToken) {
            const err = new Error("GNEWS_API_TOKEN is not configured in environment variables.");
            err.statusCode = 500;
            throw err;
        }
        const baseURL = 'https://gnews.io/api/v4/top-headlines';

        let categoryList = ['general'];
        let language = 'en';

        if (Array.isArray(preferences)) {
            if (preferences.length > 0) {
                categoryList = preferences;
            }
        } else if (preferences && typeof preferences === 'object') {
            if (preferences.categories) {
                if (Array.isArray(preferences.categories) && preferences.categories.length > 0) {
                    categoryList = preferences.categories;
                } else if (typeof preferences.categories === 'string' && preferences.categories.trim() !== '') {
                    categoryList = [preferences.categories.trim()];
                }
            }
            if (preferences.languages) {
                if (Array.isArray(preferences.languages) && preferences.languages.length > 0) {
                    language = preferences.languages[0];
                } else if (typeof preferences.languages === 'string' && preferences.languages.trim() !== '') {
                    language = preferences.languages.trim();
                }
            }
        }

        // Map categories to standard GNews categories
        const mappedCategories = [...new Set(categoryList.map(mapCategory))];

        // Fetch articles for each category in parallel
        const requests = mappedCategories.map(cat => {
            return axios.get(baseURL, {
                params: {
                    category: cat,
                    lang: language,
                    max: 10,
                    apikey: apiToken
                }
            }).catch(err => {
                console.error(`Error fetching category ${cat}:`, err.message);
                if (err.response?.status === 401) {
                    throw err;
                }
                return { data: { articles: [] } };
            });
        });

        const responses = await Promise.all(requests);
        let allArticles = [];
        for (const res of responses) {
            if (res.data && res.data.articles) {
                allArticles.push(...res.data.articles);
            }
        }

        // Deduplicate articles by URL
        const uniqueArticles = [];
        const seenUrls = new Set();
        for (const article of allArticles) {
            if (article.url && !seenUrls.has(article.url)) {
                seenUrls.add(article.url);
                uniqueArticles.push(article);
            }
        }

        // Sort by publishedAt descending
        uniqueArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        // Limit to 10 articles
        const limitedArticles = uniqueArticles.slice(0, 10);

        return limitedArticles.map(article => ({
            title: article.title,
            description: article.description,
            url: article.url,
            source: article.source ? article.source.name : 'GNews Provider',
            publishedAt: article.publishedAt,
            image: article.image || null
        }));

    } catch (error) {
        // Log clean telemetry details for debugging
        console.error('❌ GNews API Exception:', error.response?.data?.errors || error.message);
        
        let msg = 'Downstream news data retrieval failure.';
        if (error.response?.data?.errors) {
            msg = `Downstream news provider error: ${Array.isArray(error.response.data.errors) ? error.response.data.errors.join(', ') : error.response.data.errors}`;
        } else if (error.message) {
            msg = `Downstream news provider error: ${error.message}`;
        }
        
        const err = new Error(msg);
        err.statusCode = error.response?.status || 502;
        err.isAxiosError = true;
        if (error.response?.data) {
            err.upstreamError = error.response.data;
        }
        throw err;
    }
};

module.exports = {
    fetchPersonalizedNews
};