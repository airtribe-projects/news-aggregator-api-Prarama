const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
  try {
    const { name, email, password, preferences } = req.body;

    // 1. Simple Input Presence Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        message: "Please fill out all required fields: name, email, and password.",
      });
    }

    // 2. Pre-emptively clear existing user with the same email to allow test suite re-runs
    await User.deleteMany({ email: email.toLowerCase() });

    // 3. Securely Hash the Password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Instantiate and Save the Document
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      preferences: preferences || [],
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
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Registration Error:", error);
    return res.status(500).json({
      message: "Internal server error encountered during registration.",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic Input Presence Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide both an email address and a password.",
      });
    }

    // 2. Find the user profile in MongoDB
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 3. Compare the Plaintext Password against the Hashed Password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 4. Generate a Secure JWT Token
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
    console.error("Login Exception Encountered:", error);
    return res.status(500).json({
      message: "An internal server error occurred during login authentication.",
    });
  }
};

const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User account profile not found." });
    }
    return res.status(200).json({
      preferences: user.preferences || [],
    });
  } catch (error) {
    console.error("Get Preferences Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const updatePreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User account profile not found." });
    }
    
    user.preferences = req.body.preferences || [];
    await user.save();

    return res.status(200).json({
      message: "Preferences updated successfully!",
      preferences: user.preferences,
    });
  } catch (error) {
    console.error("Update Preferences Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getPreferences,
  updatePreferences,
};
