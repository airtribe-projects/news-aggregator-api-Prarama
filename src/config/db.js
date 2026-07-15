const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Fetch the URI from your environment file
        const dbURI = process.env.MONGODB_URI;

        if (!dbURI) {
            throw new Error("MONGODB_URI is not defined in the .env file");
        }

        // Modern Mongoose connection setup compatible with newer Node.js drivers
        await mongoose.connect(dbURI, {
            // These options ensure stable connection management across environments
            autoIndex: true, // Build indexes automatically for schema definitions
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of hanging
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });

        console.log('🚀 MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        
        // Detailed troubleshooting hint for network DNS blocks
        if (error.message.includes('ECONNREFUSED')) {
            console.error('💡 Tip: If you are on a restricted network or VPN, try switching to a public DNS (like 8.8.8.8) or verify your connection string formatting.');
        }
        
        process.exit(1); 
    }
};

module.exports = connectDB;