# News Aggregator API

A simple and robust RESTful API that aggregates news from GNews.io and serves personalized feeds based on user preferences.

## Project Structure

```text
├── config/
│   └── db.js                 # Database connection logic
├── src/
│   ├── controllers/
│   │   ├── newsController.js # Business logic for news
│   │   └── usersController.js# Business logic for users
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── models/
│   │   └── user.js           # Mongoose schema for User
│   ├── routes/
│   │   ├── newsRoutes.js     # Routing endpoints for news
│   │   └── usersRoutes.js    # Routing endpoints for users
│   └── app.js                # Core Express application configuration
├── app.js                    # Server entry point wrapper (required for tests)
├── package.json              # Project dependencies and script runner configurations
└── README.md                 # Project documentation
```

## Features

- **User Authentication**: Secure user registration and login using bcrypt for password hashing and JSON Web Tokens (JWT) for authentication.
- **Preference Management**: Retrieve and update user-specific news category preferences.
- **Personalized News Feed**: Serves news filtered according to the user's saved preferences dynamically sourced from the GNews.io API.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd news-aggregator-api-Prarama
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables. Create a `.env` file in the root folder with the following variables:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/news_aggregator
   JWT_SECRET=your_super_secret_jwt_key
   GNEWS_API_TOKEN=your_gnews_api_token
   ```

## Running the Application

- **Development Mode**: Runs the server with auto-reloads on code changes using nodemon.
  ```bash
  npm run dev
  ```
- **Production Mode**: Runs the server normally.
  ```bash
  npm start
  ```

## Running Tests

To verify endpoint functionality against the test suite, run:
```bash
npm test
```

## API Endpoints

### Authentication
- `POST /users/signup` - Register a new user account.
- `POST /users/login` - Authenticate a user and receive a JWT.

### User Preferences (Protected)
- `GET /users/preferences` - Retrieve the user's category preferences.
- `PUT /users/preferences` - Update the user's category preferences.

### News (Protected)
- `GET /news` - Retrieve a personalized news feed based on the user's preferences.
