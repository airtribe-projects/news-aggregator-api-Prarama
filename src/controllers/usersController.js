const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, preferences } = req.body;

    // 1. Simple Input Presence Validation
    if (!email || !password || !name) {
      const err = new Error("Please fill out all required fields: name, email, and password.");
      err.statusCode = 400;
      throw err;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const err = new Error("Invalid email format.");
      err.statusCode = 400;
      throw err;
    }

    // Validate password length (min 6 characters)
    if (password.length < 6) {
      const err = new Error("Password must be at least 6 characters long.");
      err.statusCode = 400;
      throw err;
    }

    // Validate preferences if provided during registration
    let validatedCategories = [];
    let validatedLanguages = [];
    if (preferences !== undefined && preferences !== null) {
      if (Array.isArray(preferences)) {
        if (preferences.some(pref => typeof pref !== 'string' || !pref.trim())) {
          const err = new Error("Preferences array can only contain valid, non-empty strings.");
          err.statusCode = 400;
          throw err;
        }
        validatedCategories = preferences.map(pref => pref.trim());
      } else if (typeof preferences === 'object') {
        if (preferences.categories) {
          if (!Array.isArray(preferences.categories)) {
            const err = new Error("categories must be an array of strings.");
            err.statusCode = 400;
            throw err;
          }
          if (preferences.categories.some(pref => typeof pref !== 'string' || !pref.trim())) {
            const err = new Error("categories array can only contain valid, non-empty strings.");
            err.statusCode = 400;
            throw err;
          }
          validatedCategories = preferences.categories.map(pref => pref.trim());
        }
        if (preferences.languages) {
          if (!Array.isArray(preferences.languages)) {
            const err = new Error("languages must be an array of strings.");
            err.statusCode = 400;
            throw err;
          }
          if (preferences.languages.some(lang => typeof lang !== 'string' || !lang.trim())) {
            const err = new Error("languages array can only contain valid, non-empty strings.");
            err.statusCode = 400;
            throw err;
          }
          validatedLanguages = preferences.languages.map(lang => lang.trim());
        }
      } else {
        const err = new Error("Preferences must be an array of category strings or a structured preferences object.");
        err.statusCode = 400;
        throw err;
      }
    }

    // 2. Check if a user with the same email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const err = new Error("User with this email already exists.");
      err.statusCode = 409;
      throw err;
    }

    // 3. Securely Hash the Password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Instantiate and Save the Document
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      preferences: {
        categories: validatedCategories,
        languages: validatedLanguages,
      },
    });

    await newUser.save();

    // 5. Send Back Success Response (Status 200 required by tests)
    return res.status(200).json({
      message: "User registered successfully!",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Basic Input Presence Validation
    if (!email || !password) {
      const err = new Error("Please provide both an email address and a password.");
      err.statusCode = 400;
      throw err;
    }

    // 2. Find the user profile in MongoDB
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const err = new Error("Invalid email or password.");
      err.statusCode = 401;
      throw err;
    }

    // 3. Compare the Plaintext Password against the Hashed Password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const err = new Error("Invalid email or password.");
      err.statusCode = 401;
      throw err;
    }

    // 4. Generate a Secure JWT Token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured in environment variables.");
    }
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    // 5. Send back success response along with the token
    return res.status(200).json({
      message: "Login successful!",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getPreferences = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      const err = new Error("Authentication token is missing or invalid.");
      err.statusCode = 401;
      throw err;
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      const err = new Error("User account profile not found.");
      err.statusCode = 404;
      throw err;
    }
    const responsePreferences = (user.preferences && user.preferences.languages && user.preferences.languages.length > 0)
      ? user.preferences
      : (user.preferences?.categories || []);

    return res.status(200).json({
      preferences: responsePreferences,
    });
  } catch (error) {
    next(error);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      const err = new Error("Authentication token is missing or invalid.");
      err.statusCode = 401;
      throw err;
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      const err = new Error("User account profile not found.");
      err.statusCode = 404;
      throw err;
    }
    
    const { preferences } = req.body;

    let validatedCategories = [];
    let validatedLanguages = [];

    if (!preferences) {
      const err = new Error("Preferences field is required.");
      err.statusCode = 400;
      throw err;
    }

    if (Array.isArray(preferences)) {
      if (preferences.length === 0) {
        const err = new Error("Preferences array cannot be empty.");
        err.statusCode = 400;
        throw err;
      }
      if (preferences.some(pref => typeof pref !== 'string' || !pref.trim())) {
        const err = new Error("Preferences array can only contain valid, non-empty strings.");
        err.statusCode = 400;
        throw err;
      }
      validatedCategories = preferences.map(pref => pref.trim());
    } else if (typeof preferences === 'object') {
      if (preferences.categories) {
        if (!Array.isArray(preferences.categories)) {
          const err = new Error("categories must be an array of strings.");
          err.statusCode = 400;
          throw err;
        }
        if (preferences.categories.some(pref => typeof pref !== 'string' || !pref.trim())) {
          const err = new Error("categories array can only contain valid, non-empty strings.");
          err.statusCode = 400;
          throw err;
        }
        validatedCategories = preferences.categories.map(pref => pref.trim());
      }
      if (preferences.languages) {
        if (!Array.isArray(preferences.languages)) {
          const err = new Error("languages must be an array of strings.");
          err.statusCode = 400;
          throw err;
        }
        if (preferences.languages.some(lang => typeof lang !== 'string' || !lang.trim())) {
          const err = new Error("languages array can only contain valid, non-empty strings.");
          err.statusCode = 400;
          throw err;
        }
        validatedLanguages = preferences.languages.map(lang => lang.trim());
      }
      if (validatedCategories.length === 0 && validatedLanguages.length === 0) {
        const err = new Error("At least one category or language preference must be configured.");
        err.statusCode = 400;
        throw err;
      }
    } else {
      const err = new Error("Preferences must be an array of category strings or a structured preferences object.");
      err.statusCode = 400;
      throw err;
    }

    user.preferences = {
      categories: validatedCategories,
      languages: validatedLanguages,
    };
    await user.save();

    const responsePref = (user.preferences && user.preferences.languages && user.preferences.languages.length > 0)
      ? user.preferences
      : (user.preferences?.categories || []);

    return res.status(200).json({
      message: "Preferences updated successfully!",
      preferences: responsePref,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getPreferences,
  updatePreferences,
};
